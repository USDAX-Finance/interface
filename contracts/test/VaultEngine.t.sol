// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {VaultEngine}       from "../src/VaultEngine.sol";
import {USDAxToken}        from "../src/USDAxToken.sol";
import {CollateralManager} from "../src/CollateralManager.sol";
import {MockERC20}         from "../src/MockERC20.sol";
import {MockPriceOracle}   from "../src/MockPriceOracle.sol";

/// @notice Full test suite for VaultEngine v1.3
///         Covers: happy path, stability fee, debt ceiling, emergency pause, liquidation.
contract VaultEngineTest is Test {

    // ── Contracts ──────────────────────────────────────────────────────────
    VaultEngine       vault;
    USDAxToken        usdax;
    CollateralManager cm;
    MockERC20         weth;
    MockPriceOracle   oracle;

    // ── Actors ─────────────────────────────────────────────────────────────
    address owner      = makeAddr("owner");
    address alice      = makeAddr("alice");    // borrower
    address bob        = makeAddr("bob");      // liquidator
    address feeWallet  = makeAddr("feeWallet");

    // ── Risk params (matching mainnet config) ──────────────────────────────
    uint256 constant WETH_LTV    = 8000; // 80%
    uint256 constant WETH_LIQ    = 8500; // 85%
    uint256 constant WETH_BONUS  = 500;  // 5%
    uint256 constant WETH_PRICE  = 2000e18; // $2,000

    uint256 constant STAB_FEE    = 500;  // 5% APY

    function setUp() public {
        vm.startPrank(owner);

        // 1. Mock WETH
        weth = new MockERC20("Wrapped Ether", "WETH", 18, owner);

        // 2. Oracle
        oracle = new MockPriceOracle(owner);
        address[] memory tokens = new address[](1);
        uint256[] memory prices = new uint256[](1);
        tokens[0] = address(weth); prices[0] = WETH_PRICE;
        oracle.setPrices(tokens, prices);

        // 3. CollateralManager
        cm = new CollateralManager(owner);
        cm.addCollateral(address(weth), WETH_LTV, WETH_LIQ, WETH_BONUS, 18);

        // 4. USDAxToken
        usdax = new USDAxToken(owner);

        // 5. VaultEngine
        vault = new VaultEngine(
            address(usdax),
            address(cm),
            address(oracle),
            feeWallet,
            owner,
            STAB_FEE
        );

        // 6. Authorize vault as USDAX minter
        usdax.updateVaultEngine(address(vault));

        vm.stopPrank();

        // Fund alice with 10 WETH, bob with 500 USDAX (for liquidations)
        vm.prank(owner);
        weth.mint(alice, 10 ether);

        // Bob needs USDAX to liquidate — give him a vault first, then transfer
        vm.prank(owner);
        weth.mint(bob, 10 ether);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /// Deposit `wethAmt` and mint `usdaxAmt` as `user`
    function _openVault(address user, uint256 wethAmt, uint256 usdaxAmt) internal {
        vm.startPrank(user);
        weth.approve(address(vault), wethAmt);
        vault.depositCollateral(address(weth), wethAmt);
        vault.mintUsdax(usdaxAmt);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HAPPY PATH
    // ═══════════════════════════════════════════════════════════════════════

    function test_DepositCollateral() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vm.stopPrank();

        assertEq(vault.collateralDeposits(alice, address(weth)), 1 ether);
    }

    function test_MintUsdax() public {
        _openVault(alice, 1 ether, 1000e18);

        // Alice gets (1000 - 0.5%) = 995 USDAX
        assertEq(usdax.balanceOf(alice), 995e18);
        // Fee wallet gets 5 USDAX
        assertEq(usdax.balanceOf(feeWallet), 5e18);
        // Debt recorded as full 1000
        assertEq(vault.debt(alice), 1000e18);
    }

    function test_RepayUsdax() public {
        _openVault(alice, 1 ether, 1000e18);

        // Alice repays 500 USDAX
        vm.startPrank(alice);
        usdax.approve(address(vault), 500e18);
        vault.repayUsdax(500e18);
        vm.stopPrank();

        assertEq(vault.debt(alice), 500e18);
    }

    function test_WithdrawCollateral() public {
        _openVault(alice, 2 ether, 500e18); // low debt, safe to withdraw

        vm.startPrank(alice);
        vault.withdrawCollateral(address(weth), 0.5 ether);
        vm.stopPrank();

        assertEq(vault.collateralDeposits(alice, address(weth)), 1.5 ether);
    }

    function test_FullCycle_OpenRepayWithdraw() public {
        // Note: due to the 0.5% mint fee, alice mints 1000 but only receives 995 USDAX.
        // To fully repay 1000 debt she needs the extra 5 from an external source.
        // Bob opens a vault and sends alice 10 USDAX to cover the gap.
        _openVault(alice, 1 ether, 1000e18);
        _openVault(bob,   2 ether, 500e18);

        vm.prank(bob);
        usdax.transfer(alice, 10e18); // alice now has 1005 USDAX — enough to repay 1000

        uint256 owed = vault.currentDebt(alice); // 1000 (no time warp)

        vm.startPrank(alice);
        usdax.approve(address(vault), owed);
        vault.repayUsdax(owed);
        vault.withdrawCollateral(address(weth), 1 ether);
        vm.stopPrank();

        assertEq(vault.debt(alice), 0);
        assertEq(vault.collateralDeposits(alice, address(weth)), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MINT FEE
    // ═══════════════════════════════════════════════════════════════════════

    function test_MintFeeGoesToFeeWallet() public {
        // 1 WETH @ $2000, maxLTV 80% = $1600 max mintable
        // Mint 1500 USDAX (75% LTV — safely within limit)
        // Fee = 1500 * 0.5% = 7.5 USDAX to feeWallet
        _openVault(alice, 1 ether, 1500e18);
        assertEq(usdax.balanceOf(feeWallet), 7.5e18);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STABILITY FEE
    // ═══════════════════════════════════════════════════════════════════════

    function test_StabilityFeeAccrues() public {
        _openVault(alice, 1 ether, 1000e18);

        uint256 debtBefore = vault.debt(alice);

        // Warp forward 1 year
        vm.warp(block.timestamp + 365 days);

        uint256 debtAfter = vault.currentDebt(alice);
        // 5% APY on 1000 USDAX ≈ 50 USDAX pending fee (linear approx)
        assertApproxEqAbs(debtAfter - debtBefore, 50e18, 1e18);
    }

    function test_DripSettlesInterest() public {
        _openVault(alice, 1 ether, 1000e18);

        vm.warp(block.timestamp + 365 days);

        // Before drip: debt[alice] still shows principal
        assertEq(vault.debt(alice), 1000e18);

        // Call drip — interest now settles into debt[alice]
        vault.drip(alice);

        uint256 settled = vault.debt(alice);
        // Should be ~1050 USDAX
        assertApproxEqAbs(settled, 1050e18, 1e18);
        // Fee minted to feeWallet (≈50 USDAX, beyond the initial 5 mint fee)
        assertGt(usdax.balanceOf(feeWallet), 50e18);
    }

    function test_PendingFeeViewIsAccurate() public {
        _openVault(alice, 1 ether, 1000e18);
        vm.warp(block.timestamp + 180 days); // ~half year

        uint256 pending = vault.pendingFee(alice);
        // ~2.5% of 1000 ≈ 25 USDAX (±1)
        assertApproxEqAbs(pending, 25e18, 1e18);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEBT CEILING
    // ═══════════════════════════════════════════════════════════════════════

    function test_DebtCeilingNotEnforcedWhenZero() public {
        // debtCeiling = 0 means uncapped — should succeed
        _openVault(alice, 5 ether, 5000e18); // fine
    }

    function test_DebtCeilingBlocksMint() public {
        // Set ceiling to 500 USDAX
        vm.prank(owner);
        vault.setDebtCeiling(500e18);

        vm.startPrank(alice);
        weth.approve(address(vault), 5 ether);
        vault.depositCollateral(address(weth), 5 ether);
        // Try to mint 1000 USDAX — exceeds ceiling
        vm.expectRevert("debt ceiling reached");
        vault.mintUsdax(1000e18);
        vm.stopPrank();
    }

    function test_DebtCeilingAllowsUpToLimit() public {
        vm.prank(owner);
        vault.setDebtCeiling(1000e18);

        // Mint exactly 1000 — should work
        _openVault(alice, 2 ether, 1000e18);
        assertEq(vault.debt(alice), 1000e18);
    }

    function test_SetDebtCeilingEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit VaultEngine.DebtCeilingUpdated(0, 1_000_000e18);
        vault.setDebtCeiling(1_000_000e18);
    }

    function test_OnlyOwnerCanSetDebtCeiling() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setDebtCeiling(100e18);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EMERGENCY PAUSE
    // ═══════════════════════════════════════════════════════════════════════

    function test_PauseBlocksDeposit() public {
        vm.prank(owner);
        vault.pause();

        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vm.expectRevert();
        vault.depositCollateral(address(weth), 1 ether);
        vm.stopPrank();
    }

    function test_PauseBlocksMint() public {
        // Deposit first (before pause)
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vm.stopPrank();

        vm.prank(owner);
        vault.pause();

        vm.prank(alice);
        vm.expectRevert();
        vault.mintUsdax(500e18);
    }

    function test_PauseBlocksLiquidate() public {
        // Create liquidatable vault first
        _openVault(alice, 1 ether, 1400e18); // near max LTV

        vm.prank(owner);
        vault.pause();

        // Drop price so vault is undercollateralized
        vm.startPrank(owner);
        address[] memory t = new address[](1);
        uint256[] memory p = new uint256[](1);
        t[0] = address(weth); p[0] = 1000e18; // $1000 — vault now below liq threshold
        oracle.setPrices(t, p);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert();
        vault.liquidate(alice, 100e18, address(weth));
    }

    function test_PauseAllowsRepay() public {
        _openVault(alice, 1 ether, 1000e18);

        vm.prank(owner);
        vault.pause();

        // Repay should still work — users must always be able to exit
        vm.startPrank(alice);
        usdax.approve(address(vault), 500e18);
        vault.repayUsdax(500e18); // no revert expected
        vm.stopPrank();

        assertEq(vault.debt(alice), 500e18);
    }

    function test_PauseAllowsWithdraw() public {
        _openVault(alice, 2 ether, 100e18); // very low debt, safe to withdraw

        vm.prank(owner);
        vault.pause();

        vm.prank(alice);
        vault.withdrawCollateral(address(weth), 0.5 ether); // no revert expected

        assertEq(vault.collateralDeposits(alice, address(weth)), 1.5 ether);
    }

    function test_UnpauseRestoresNormalOperation() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(owner);
        vault.unpause();

        // Should work again
        _openVault(alice, 1 ether, 500e18);
        assertEq(vault.debt(alice), 500e18);
    }

    function test_OnlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.pause();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIQUIDATION
    // ═══════════════════════════════════════════════════════════════════════

    function test_HealthyVaultNotLiquidatable() public {
        _openVault(alice, 2 ether, 1000e18); // healthy HF

        // Give bob USDAX to liquidate with
        _openVault(bob, 2 ether, 500e18);

        vm.prank(bob);
        vm.expectRevert("vault is healthy");
        vault.liquidate(alice, 100e18, address(weth));
    }

    function test_LiquidationHappyPath() public {
        // Alice: 1 WETH ($2000) deposits, mints 1400 USDAX (70% LTV)
        _openVault(alice, 1 ether, 1400e18);

        // Bob opens a vault to get USDAX to liquidate with
        _openVault(bob, 5 ether, 2000e18);

        // Drop WETH price to $1400 — Alice's adjusted value = $1400 * 85% = $1190
        // Alice's currentDebt = 1400 → HF = 1190/1400 < 1 → liquidatable
        vm.startPrank(owner);
        address[] memory t = new address[](1);
        uint256[] memory p = new uint256[](1);
        t[0] = address(weth); p[0] = 1400e18;
        oracle.setPrices(t, p);
        vm.stopPrank();

        uint256 bobUsdaxBefore  = usdax.balanceOf(bob);
        uint256 bobWethBefore   = weth.balanceOf(bob);

        uint256 debtToRepay = 700e18; // repay 50% of alice's debt

        vm.startPrank(bob);
        usdax.approve(address(vault), debtToRepay);
        vault.liquidate(alice, debtToRepay, address(weth));
        vm.stopPrank();

        // Bob's USDAX decreased by debtToRepay
        assertEq(bobUsdaxBefore - usdax.balanceOf(bob), debtToRepay);
        // Bob received WETH (amount > 0)
        assertGt(weth.balanceOf(bob), bobWethBefore);
        // Alice's debt decreased
        assertLt(vault.debt(alice), 1400e18);
    }

    function test_LiquidationEmitsEvent() public {
        _openVault(alice, 1 ether, 1400e18);
        _openVault(bob, 5 ether, 2000e18);

        vm.startPrank(owner);
        address[] memory t = new address[](1);
        uint256[] memory p = new uint256[](1);
        t[0] = address(weth); p[0] = 1400e18;
        oracle.setPrices(t, p);
        vm.stopPrank();

        vm.startPrank(bob);
        usdax.approve(address(vault), 700e18);
        vm.expectEmit(true, true, true, false); // check indexed args only
        emit VaultEngine.Liquidated(bob, alice, address(weth), 0, 0);
        vault.liquidate(alice, 700e18, address(weth));
        vm.stopPrank();
    }

    function test_LiquidationBonus() public {
        // Alice: 1 WETH @ $2000, mint 1400
        _openVault(alice, 1 ether, 1400e18);
        _openVault(bob, 5 ether, 2000e18);

        // Drop to $1400
        vm.startPrank(owner);
        address[] memory t = new address[](1);
        uint256[] memory p = new uint256[](1);
        t[0] = address(weth); p[0] = 1400e18;
        oracle.setPrices(t, p);
        vm.stopPrank();

        uint256 debtToRepay = 700e18;
        // Collateral equiv at $1400: 700/1400 = 0.5 WETH
        // With 5% bonus: 0.5 * 1.05 = 0.525 WETH
        uint256 bobWethBefore = weth.balanceOf(bob);

        vm.startPrank(bob);
        usdax.approve(address(vault), debtToRepay);
        vault.liquidate(alice, debtToRepay, address(weth));
        vm.stopPrank();

        uint256 wethReceived = weth.balanceOf(bob) - bobWethBefore;
        // Should be ~0.525 WETH (±1%)
        assertApproxEqRel(wethReceived, 0.525 ether, 0.01e18);
    }

    function test_CannotSelfLiquidate() public {
        _openVault(alice, 1 ether, 1400e18);

        vm.startPrank(owner);
        address[] memory t = new address[](1);
        uint256[] memory p = new uint256[](1);
        t[0] = address(weth); p[0] = 1000e18;
        oracle.setPrices(t, p);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert("cannot self-liquidate");
        vault.liquidate(alice, 100e18, address(weth));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GUARDS
    // ═══════════════════════════════════════════════════════════════════════

    function test_MinDebtEnforced() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vm.expectRevert("below min debt");
        vault.mintUsdax(5e18); // below 10 USDAX min
        vm.stopPrank();
    }

    function test_ExceedsMaxLTVReverts() public {
        vm.startPrank(alice);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        // 1 WETH @ $2000, maxLTV 80% = $1600 max
        vm.expectRevert("exceeds max LTV");
        vault.mintUsdax(1700e18);
        vm.stopPrank();
    }

    function test_WithdrawBeyondDepositReverts() public {
        _openVault(alice, 1 ether, 100e18);

        vm.prank(alice);
        vm.expectRevert("insufficient collateral");
        vault.withdrawCollateral(address(weth), 2 ether);
    }

    function test_NonWhitelistedTokenReverts() public {
        MockERC20 rando = new MockERC20("Rando", "RND", 18, owner);
        vm.prank(owner);
        rando.mint(alice, 10 ether);

        vm.startPrank(alice);
        rando.approve(address(vault), 1 ether);
        vm.expectRevert("token not whitelisted");
        vault.depositCollateral(address(rando), 1 ether);
        vm.stopPrank();
    }

    function test_OnlyOwnerCanSetStabilityFee() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setStabilityFee(1000);
    }

    function test_StabilityFeeCapEnforced() public {
        vm.prank(owner);
        vm.expectRevert("fee too high (max 20%)");
        vault.setStabilityFee(2001); // above 20% max
    }
}
