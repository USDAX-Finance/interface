// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VaultEngine}       from "../src/VaultEngine.sol";
import {USDAxToken}        from "../src/USDAxToken.sol";
import {CollateralManager} from "../src/CollateralManager.sol";
import {MockERC20}         from "../src/MockERC20.sol";
import {MockPriceOracle}   from "../src/MockPriceOracle.sol";

/**
 * @title VaultEngine Fuzz Tests
 * @notice Property-based tests covering key invariants that unit tests cannot
 *         exhaustively verify: fee accounting, LTV enforcement, HF monotonicity,
 *         debt ceiling, and liquidation eligibility across arbitrary inputs.
 */
contract VaultEngineFuzzTest is Test {

    VaultEngine       vault;
    USDAxToken        usdax;
    CollateralManager cm;
    MockERC20         weth;
    MockPriceOracle   oracle;

    address owner     = makeAddr("owner");
    address alice     = makeAddr("alice");
    address bob       = makeAddr("bob");
    address feeWallet = makeAddr("feeWallet");

    uint256 constant WETH_LTV    = 8000;       // 80 %
    uint256 constant WETH_LIQ    = 8500;       // 85 %
    uint256 constant WETH_BONUS  = 500;        // 5 %
    uint256 constant WETH_PRICE  = 2_000e18;   // $2,000
    uint256 constant STAB_FEE    = 500;        // 5 % APY
    uint256 constant BASIS       = 10_000;
    uint256 constant MIN_DEBT    = 10e18;

    // Max safely mintable per 1 ETH at $2k, 80 % LTV
    uint256 constant MAX_MINT_PER_ETH = 1_600e18;

    function setUp() public {
        vm.startPrank(owner);

        weth   = new MockERC20("WETH", "WETH", 18, owner);
        oracle = new MockPriceOracle(owner);

        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = address(weth);
        pxs[0]  = WETH_PRICE;
        oracle.setPrices(toks, pxs);

        cm = new CollateralManager(owner);
        cm.addCollateral(address(weth), WETH_LTV, WETH_LIQ, WETH_BONUS, 18);

        usdax = new USDAxToken(owner);
        vault = new VaultEngine(
            address(usdax), address(cm), address(oracle),
            feeWallet, owner, STAB_FEE
        );
        usdax.updateVaultEngine(address(vault));
        vm.stopPrank();

        vm.prank(owner); weth.mint(alice, 100 ether);
        vm.prank(owner); weth.mint(bob,   100 ether);
    }

    // ── 1. Health factor decreases monotonically as debt grows ───────────────

    /// @notice After minting more USDAX against the same collateral, HF must drop.
    function testFuzz_HealthFactorDecreasesWithMoreDebt(
        uint256 firstMint,
        uint256 additionalMint
    ) public {
        // first mint: 10–800 USDAX (safely within 80 % LTV on 1 ETH @ $2k)
        firstMint      = bound(firstMint,      MIN_DEBT, 800e18);
        additionalMint = bound(additionalMint, MIN_DEBT, MAX_MINT_PER_ETH - firstMint - 1e18);
        vm.assume(additionalMint >= MIN_DEBT);
        vm.assume(firstMint + additionalMint <= MAX_MINT_PER_ETH - 1e18);

        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vault.mintUsdax(firstMint);

        uint256 hfBefore = vault.healthFactor(alice);

        vault.mintUsdax(additionalMint);
        uint256 hfAfter = vault.healthFactor(alice);
        vm.stopPrank();

        assertLt(hfAfter, hfBefore, "HF must fall when debt increases");
    }

    // ── 2. Mint fee always accrues to feeRecipient, never off by one ─────────

    /// @notice For any valid mint amount, fee = amount * 50 / 10_000.
    function testFuzz_MintFeeExactlyGoesToFeeWallet(uint256 mintAmt) public {
        // Keep mint within safe LTV for 10 ETH collateral
        mintAmt = bound(mintAmt, MIN_DEBT, 10 * MAX_MINT_PER_ETH - 1e18);

        vm.prank(owner); weth.mint(alice, 10 ether); // extra on top of setUp

        uint256 feeBefore = usdax.balanceOf(feeWallet);

        vm.startPrank(alice);
        weth.approve(address(vault), 10 ether);
        vault.depositCollateral(address(weth), 10 ether);
        // cap to what is actually mintable
        uint256 debt0 = vault.currentDebt(alice);
        uint256 maxMint = (10 ether * WETH_PRICE / 1e18 * WETH_LTV / BASIS) - debt0;
        if (maxMint < MIN_DEBT) { vm.stopPrank(); return; }
        mintAmt = bound(mintAmt, MIN_DEBT, maxMint);
        vault.mintUsdax(mintAmt);
        vm.stopPrank();

        uint256 expectedFee = (mintAmt * 50) / BASIS;
        assertEq(usdax.balanceOf(feeWallet) - feeBefore, expectedFee, "fee wrong");
    }

    // ── 3. Cannot mint above LTV ─────────────────────────────────────────────

    /// @notice Any attempt to mint above the 80 % LTV limit must revert.
    function testFuzz_MintAboveLTVReverts(uint256 overage) public {
        // overage on top of the max mintable for 1 ETH
        overage = bound(overage, 1e18, 5_000e18);

        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);

        // Max for 1 ETH at 80 % LTV, $2000 = 1600 USDAX (before fee inclusion)
        uint256 overLimit = MAX_MINT_PER_ETH + overage;

        vm.expectRevert();
        vault.mintUsdax(overLimit);
        vm.stopPrank();
    }

    // ── 4. Debt ceiling always enforced ──────────────────────────────────────

    /// @notice With any active debt ceiling, minting beyond it must revert.
    function testFuzz_DebtCeilingEnforced(uint256 ceiling) public {
        // Small ceiling so alice can't fit inside it with her deposit
        ceiling = bound(ceiling, MIN_DEBT, 100e18);

        vm.prank(owner);
        vault.setDebtCeiling(ceiling);

        vm.startPrank(alice);
        weth.approve(address(vault), 5 ether);
        vault.depositCollateral(address(weth), 5 ether);

        // Try minting ceiling + 10 USDAX — must revert
        vm.expectRevert();
        vault.mintUsdax(ceiling + MIN_DEBT);
        vm.stopPrank();
    }

    // ── 5. Healthy vault can never be liquidated ──────────────────────────────

    /// @notice Any vault above HF=1.0 is not liquidatable.
    function testFuzz_HealthyVaultCannotBeLiquidated(uint256 mintAmt) public {
        // alice: strictly under max LTV → vault is healthy
        mintAmt = bound(mintAmt, MIN_DEBT, 1_200e18); // well below 1600 limit

        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vault.mintUsdax(mintAmt);
        vm.stopPrank();

        // give bob some USDAX so he can attempt to liquidate
        _openVault(bob, 1 ether, MIN_DEBT);
        vm.startPrank(bob);
        usdax.approve(address(vault), type(uint256).max);
        vm.expectRevert();
        vault.liquidate(alice, mintAmt, address(weth));
        vm.stopPrank();
    }

    // ── 6. Stability fee rate hard-cap enforced ───────────────────────────────

    /// @notice setStabilityFee must revert for any rate above 20 % APY (2000 bps).
    function testFuzz_StabilityFeeCapEnforced(uint256 fee) public {
        fee = bound(fee, 2_001, 100_000);
        vm.prank(owner);
        vm.expectRevert();
        vault.setStabilityFee(fee);
    }

    /// @notice setStabilityFee succeeds for any rate ≤ 20 % APY.
    function testFuzz_StabilityFeeValidRangeAccepted(uint256 fee) public {
        fee = bound(fee, 0, 2_000);
        vm.prank(owner);
        vault.setStabilityFee(fee);
        assertEq(vault.stabilityFeePerYear(), fee);
    }

    // ── 7. Repaying full debt always allows full collateral withdrawal ─────────

    /// @notice Open vault → repay all → withdraw all collateral — must always work.
    /// @dev    VaultEngine mints `amount` USDAX to borrower and `fee` to feeWallet,
    ///         recording debt = amount. Borrower receives (amount - fee) net, so
    ///         we use forge deal() to top up the shortfall before repaying.
    function testFuzz_FullRepayAllowsFullWithdraw(uint256 mintAmt) public {
        mintAmt = bound(mintAmt, MIN_DEBT, 1_200e18);

        _openVault(alice, 1 ether, mintAmt);

        uint256 debt = vault.currentDebt(alice);

        // Mint fee was deducted from alice's received balance; top up via deal()
        // so this test focuses on "can repay in full" not "can afford the fee"
        deal(address(usdax), alice, debt);

        vm.startPrank(alice);
        usdax.approve(address(vault), debt);
        vault.repayUsdax(debt);

        // Collateral must be fully withdrawable after full repay
        uint256 deposit = vault.collateralDeposits(alice, address(weth));
        vault.withdrawCollateral(address(weth), deposit);
        vm.stopPrank();

        assertEq(vault.collateralDeposits(alice, address(weth)), 0, "collateral not zero");
        assertEq(vault.currentDebt(alice), 0,                       "debt not zero");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    function _openVault(address user, uint256 wethAmt, uint256 usdaxAmt) internal {
        vm.startPrank(user);
        weth.approve(address(vault), wethAmt);
        vault.depositCollateral(address(weth), wethAmt);
        vault.mintUsdax(usdaxAmt);
        vm.stopPrank();
    }
}
