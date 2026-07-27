// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VaultEngine}       from "../src/VaultEngine.sol";
import {USDAxToken}        from "../src/USDAxToken.sol";
import {CollateralManager} from "../src/CollateralManager.sol";
import {MockERC20}         from "../src/MockERC20.sol";
import {MockPriceOracle}   from "../src/MockPriceOracle.sol";

/**
 * @title VaultEngine — Vault Owner Pagination Tests
 * @notice Covers vaultOwnerCount() and getVaultOwnersPaginated(offset, limit).
 *         Verifies that paginated reads reproduce the same set as getVaultOwners()
 *         and that all edge cases (empty, out-of-bounds, limit=0) are handled safely.
 */
contract VaultEnginePaginationTest is Test {

    VaultEngine       vault;
    USDAxToken        usdax;
    CollateralManager cm;
    MockERC20         weth;
    MockPriceOracle   oracle;

    address owner     = makeAddr("owner");
    address feeWallet = makeAddr("feeWallet");

    uint256 constant WETH_PRICE = 2_000e18;
    uint256 constant MIN_DEBT   = 10e18;

    function setUp() public {
        vm.startPrank(owner);

        weth   = new MockERC20("WETH", "WETH", 18, owner);
        oracle = new MockPriceOracle(owner);
        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = address(weth); pxs[0] = WETH_PRICE;
        oracle.setPrices(toks, pxs);

        cm = new CollateralManager(owner);
        cm.addCollateral(address(weth), 8000, 8500, 500, 18);

        usdax = new USDAxToken(owner);
        vault = new VaultEngine(
            address(usdax), address(cm), address(oracle),
            feeWallet, owner, 500
        );
        usdax.updateVaultEngine(address(vault));
        vm.stopPrank();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _makeUser(uint256 idx) internal returns (address user) {
        user = makeAddr(string(abi.encodePacked("user", idx)));
        vm.prank(owner);
        weth.mint(user, 1 ether);
        vm.startPrank(user);
        weth.approve(address(vault), 1 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vm.stopPrank();
    }

    // ── 1. Empty vault: count=0, paginated returns empty ─────────────────────

    function test_EmptyVault_CountZero() public view {
        assertEq(vault.vaultOwnerCount(), 0);
    }

    function test_EmptyVault_PaginatedEmpty() public view {
        address[] memory page = vault.getVaultOwnersPaginated(0, 10);
        assertEq(page.length, 0);
    }

    // ── 2. Single depositor ───────────────────────────────────────────────────

    function test_SingleOwner_CountOne() public {
        _makeUser(1);
        assertEq(vault.vaultOwnerCount(), 1);
    }

    function test_SingleOwner_PaginatedReturnsOne() public {
        address user = _makeUser(1);
        address[] memory page = vault.getVaultOwnersPaginated(0, 10);
        assertEq(page.length, 1);
        assertEq(page[0], user);
    }

    // ── 3. Pagination reproduces full array ───────────────────────────────────

    function test_PaginatedMatchesFullArray_FiveOwners() public {
        address[] memory users = new address[](5);
        for (uint i = 0; i < 5; i++) users[i] = _makeUser(i);

        address[] memory full   = vault.getVaultOwners();
        address[] memory paged0 = vault.getVaultOwnersPaginated(0, 3); // [0,1,2]
        address[] memory paged1 = vault.getVaultOwnersPaginated(3, 3); // [3,4]

        assertEq(full.length, 5);
        assertEq(paged0.length, 3);
        assertEq(paged1.length, 2);

        // paged0 + paged1 must equal full
        for (uint i = 0; i < 3; i++) assertEq(paged0[i], full[i]);
        for (uint i = 0; i < 2; i++) assertEq(paged1[i], full[3 + i]);
    }

    // ── 4. Offset beyond array returns empty ──────────────────────────────────

    function test_OffsetBeyondEnd_ReturnsEmpty() public {
        _makeUser(1);
        _makeUser(2);
        address[] memory page = vault.getVaultOwnersPaginated(10, 5);
        assertEq(page.length, 0);
    }

    // ── 5. limit=0 returns empty ──────────────────────────────────────────────

    function test_LimitZero_ReturnsEmpty() public {
        _makeUser(1);
        address[] memory page = vault.getVaultOwnersPaginated(0, 0);
        assertEq(page.length, 0);
    }

    // ── 6. Limit larger than remaining returns truncated slice ────────────────

    function test_LimitExceedsRemaining_ReturnsTruncated() public {
        for (uint i = 0; i < 3; i++) _makeUser(i);
        // offset=2, limit=100 → should return only index 2
        address[] memory page = vault.getVaultOwnersPaginated(2, 100);
        assertEq(page.length, 1);
        assertEq(page[0], vault.getVaultOwners()[2]);
    }

    // ── 7. Count equals getVaultOwners().length always ───────────────────────

    function test_CountAlwaysMatchesArrayLength() public {
        for (uint i = 0; i < 7; i++) {
            _makeUser(i);
            assertEq(vault.vaultOwnerCount(), vault.getVaultOwners().length);
        }
    }

    // ── 8. Depositing twice does NOT double-register an owner ─────────────────

    function test_DoubleDeposit_OwnerRegisteredOnce() public {
        address user = makeAddr("repeat");
        vm.prank(owner); weth.mint(user, 2 ether);

        vm.startPrank(user);
        weth.approve(address(vault), 2 ether);
        vault.depositCollateral(address(weth), 1 ether);
        vault.depositCollateral(address(weth), 1 ether); // second deposit
        vm.stopPrank();

        assertEq(vault.vaultOwnerCount(), 1, "owner registered only once");
    }
}
