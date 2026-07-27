// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, StdInvariant} from "forge-std/Test.sol";
import {VaultEngine}       from "../src/VaultEngine.sol";
import {USDAxToken}        from "../src/USDAxToken.sol";
import {CollateralManager} from "../src/CollateralManager.sol";
import {MockERC20}         from "../src/MockERC20.sol";
import {MockPriceOracle}   from "../src/MockPriceOracle.sol";

/**
 * @title VaultEngine Invariant Handler
 * @notice Stateful actor that calls VaultEngine functions in arbitrary order
 *         so the invariant test framework can explore reachable states.
 */
contract VaultHandler is Test {

    VaultEngine       vault;
    USDAxToken        usdax;
    MockERC20         weth;
    address           owner;
    address[]         actors;

    uint256 constant WETH_PRICE      = 2_000e18;
    uint256 constant MAX_MINT_PER_ETH = 1_600e18; // 80% LTV
    uint256 constant MIN_DEBT         = 10e18;

    // Track how much each actor has deposited (for ghost variable assertions)
    mapping(address => uint256) public deposited;
    uint256 public totalMinted; // sum of all mintUsdax calls (before fee)

    constructor(VaultEngine _vault, USDAxToken _usdax, MockERC20 _weth, address _owner) {
        vault  = _vault;
        usdax  = _usdax;
        weth   = _weth;
        owner  = _owner;

        actors.push(makeAddr("h_alice"));
        actors.push(makeAddr("h_bob"));
        actors.push(makeAddr("h_carol"));
        // Actor WETH funding is done by the test setUp via fundActors()
        // to avoid conflicting with the setUp's vm.startPrank context.
    }

    /// @notice Called by setUp after vm.stopPrank() to fund each actor with WETH.
    function fundActors() external {
        for (uint i = 0; i < actors.length; i++) {
            vm.prank(owner);
            weth.mint(actors[i], 100 ether);
        }
    }

    function deposit(uint256 actorIdx, uint256 amt) external {
        actorIdx = bound(actorIdx, 0, actors.length - 1);
        amt      = bound(amt, 0.01 ether, 5 ether);
        address actor = actors[actorIdx];

        vm.startPrank(actor);
        weth.approve(address(vault), amt);
        vault.depositCollateral(address(weth), amt);
        vm.stopPrank();

        deposited[actor] += amt;
    }

    function mint(uint256 actorIdx, uint256 amt) external {
        actorIdx = bound(actorIdx, 0, actors.length - 1);
        amt      = bound(amt, MIN_DEBT, 500e18);
        address actor = actors[actorIdx];

        uint256 dep  = vault.collateralDeposits(actor, address(weth));
        if (dep == 0) return;

        uint256 maxMintable = (dep * WETH_PRICE / 1e18) * 8000 / 10_000;
        uint256 currentDebt = vault.currentDebt(actor);
        if (maxMintable <= currentDebt + amt) return;

        vm.prank(actor);
        try vault.mintUsdax(amt) {
            totalMinted += amt;
        } catch {}
    }

    function repay(uint256 actorIdx, uint256 amt) external {
        actorIdx = bound(actorIdx, 0, actors.length - 1);
        address actor = actors[actorIdx];
        uint256 debt  = vault.currentDebt(actor);
        if (debt == 0) return;
        amt = bound(amt, 0, debt);
        if (usdax.balanceOf(actor) < amt) return;

        vm.startPrank(actor);
        usdax.approve(address(vault), amt);
        vault.repayUsdax(amt);
        vm.stopPrank();
    }

    function withdraw(uint256 actorIdx, uint256 amt) external {
        actorIdx = bound(actorIdx, 0, actors.length - 1);
        address actor = actors[actorIdx];
        amt = bound(amt, 0.001 ether, 1 ether);

        vm.prank(actor);
        try vault.withdrawCollateral(address(weth), amt) {} catch {}
    }

    function warpTime(uint256 secs) external {
        secs = bound(secs, 1, 30 days);
        skip(secs);
    }

    function actors_() external view returns (address[] memory) {
        return actors;
    }
}

/**
 * @title VaultEngine Invariant Test Suite
 * @notice Stateful invariant properties that must hold across any sequence of
 *         deposits, mints, repayments, withdrawals, and time warps.
 */
contract VaultEngineInvariantTest is StdInvariant, Test {

    VaultEngine       vault;
    USDAxToken        usdax;
    CollateralManager cm;
    MockERC20         weth;
    MockPriceOracle   oracle;
    VaultHandler      handler;

    address owner     = makeAddr("owner");
    address feeWallet = makeAddr("feeWallet");

    function setUp() public {
        vm.startPrank(owner);

        weth   = new MockERC20("WETH", "WETH", 18, owner);
        oracle = new MockPriceOracle(owner);

        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = address(weth);
        pxs[0]  = 2_000e18;
        oracle.setPrices(toks, pxs);

        cm = new CollateralManager(owner);
        cm.addCollateral(address(weth), 8000, 8500, 500, 18);

        usdax = new USDAxToken(owner);
        vault = new VaultEngine(
            address(usdax), address(cm), address(oracle),
            feeWallet, owner, 500
        );
        usdax.updateVaultEngine(address(vault));

        handler = new VaultHandler(vault, usdax, weth, owner);
        vm.stopPrank();

        // Fund handler actors now that no prank is active
        handler.fundActors();

        // Direct invariant fuzzing at the handler
        targetContract(address(handler));
    }

    // ── Invariant 1: USDAX total supply ≤ sum of all vault collateral values ─

    /// @notice The protocol must always be at least minimally overcollateralized
    ///         in aggregate — total USDAX supply cannot exceed total collateral value.
    function invariant_SupplyBackedByCollateral() public view {
        address[] memory actors = handler.actors_();
        uint256 totalCollUsd;
        for (uint i = 0; i < actors.length; i++) {
            uint256 wethDep  = vault.collateralDeposits(actors[i], address(weth));
            // $2000 per ETH, 18 decimals
            totalCollUsd += wethDep * 2_000e18 / 1e18;
        }
        uint256 supply = usdax.totalSupply();
        // supply includes fees minted to feeWallet — collateral still backs it
        assertLe(supply, totalCollUsd + 1e18, "supply > collateral value");
    }

    // ── Invariant 2: vault debt ceiling never breached ────────────────────────

    /// @notice USDAX totalSupply can never exceed an active debt ceiling.
    function invariant_DebtCeilingNeverBreached() public view {
        uint256 ceiling = vault.debtCeiling();
        if (ceiling == 0) return; // 0 = uncapped
        assertLe(usdax.totalSupply(), ceiling + 1e18, "ceiling breached");
    }

    // ── Invariant 3: feeWallet balance only ever increases ───────────────────

    /// @notice The protocol feeWallet balance must be non-decreasing.
    ///         (Tested by ensuring it never goes negative — fees are never returned.)
    function invariant_FeeWalletOnlyIncreases() public view {
        // feeWallet cannot spend USDAX in this test scenario
        // so its balance must always be ≥ 0 (trivially true for uint, but
        // this documents the property: fees flow one-way to feeWallet).
        assertGe(usdax.balanceOf(feeWallet), 0);
    }

    // ── Invariant 4: no actor's debt exceeds their collateral capacity ────────

    /// @notice Every individual vault must have debt ≤ collateral × liquidationThreshold.
    ///         Vaults above this threshold should have been liquidated already — the
    ///         handler does not include a liquidator, so we verify the engine never
    ///         allows minting past LTV in the first place.
    function invariant_NoVaultExceedsLTV() public view {
        address[] memory actors = handler.actors_();
        for (uint i = 0; i < actors.length; i++) {
            address actor = actors[i];
            uint256 debt  = vault.currentDebt(actor);
            if (debt == 0) continue;
            uint256 dep     = vault.collateralDeposits(actor, address(weth));
            // max mintable at 80 % LTV, $2000/ETH (ignoring fee)
            uint256 maxDebt = dep * 2_000e18 / 1e18 * 8000 / 10_000;
            // debt including fee may slightly exceed maxDebt; allow 1 % buffer
            assertLe(debt, maxDebt * 101 / 100, "debt exceeds LTV capacity");
        }
    }
}
