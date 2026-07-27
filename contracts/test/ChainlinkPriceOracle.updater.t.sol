// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ChainlinkPriceOracle} from "../src/ChainlinkPriceOracle.sol";

/**
 * @title ChainlinkPriceOracle — Updater Role Tests
 * @notice Covers the new `updater` role introduced in v1.5:
 *         - setUpdater() access control
 *         - Updater can call setFallbackPrice / setFallbackPrices
 *         - Updater cannot call owner-only functions (registerFeed, setMaxStaleness)
 *         - Clearing the updater (address(0)) reverts the role
 *         - Owner retains all permissions regardless of updater setting
 */
contract ChainlinkPriceOracleUpdaterTest is Test {

    ChainlinkPriceOracle oracle;

    address owner   = makeAddr("owner");
    address keeper  = makeAddr("keeper");   // will be set as updater
    address hacker  = makeAddr("hacker");  // should have no rights

    address weth = address(0x1001);
    address wbtc = address(0x1002);

    uint256 constant WETH_PRICE = 2_000e18;
    uint256 constant WBTC_PRICE = 65_000e18;

    function setUp() public {
        vm.warp(1 days); // safe timestamp baseline
        vm.prank(owner);
        oracle = new ChainlinkPriceOracle(owner);
    }

    // ── setUpdater access control ─────────────────────────────────────────────

    function test_OnlyOwnerCanSetUpdater() public {
        vm.prank(hacker);
        vm.expectRevert();
        oracle.setUpdater(keeper);
    }

    function test_OwnerCanSetUpdater() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);
        assertEq(oracle.updater(), keeper);
    }

    function test_OwnerCanClearUpdater() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);
        vm.prank(owner);
        oracle.setUpdater(address(0));
        assertEq(oracle.updater(), address(0));
    }

    function test_SetUpdaterEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, false, address(oracle));
        emit ChainlinkPriceOracle.UpdaterSet(address(0), keeper);
        oracle.setUpdater(keeper);
    }

    // ── Updater can push fallback prices ──────────────────────────────────────

    function test_UpdaterCanSetFallbackPrice() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        vm.prank(keeper);
        oracle.setFallbackPrice(weth, WETH_PRICE);

        (uint256 price,) = oracle.getPrice(weth);
        assertEq(price, WETH_PRICE);
    }

    function test_UpdaterCanSetFallbackPrices() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        address[] memory tokens = new address[](2);
        uint256[] memory prices = new uint256[](2);
        tokens[0] = weth; prices[0] = WETH_PRICE;
        tokens[1] = wbtc; prices[1] = WBTC_PRICE;

        vm.prank(keeper);
        oracle.setFallbackPrices(tokens, prices);

        (uint256 p1,) = oracle.getPrice(weth);
        (uint256 p2,) = oracle.getPrice(wbtc);
        assertEq(p1, WETH_PRICE);
        assertEq(p2, WBTC_PRICE);
    }

    // ── Updater cannot call owner-only functions ───────────────────────────────

    function test_UpdaterCannotRegisterFeed() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        vm.prank(keeper);
        vm.expectRevert();
        oracle.registerFeed(weth, address(0x9999));
    }

    function test_UpdaterCannotSetMaxStaleness() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        vm.prank(keeper);
        vm.expectRevert();
        oracle.setMaxStaleness(7200);
    }

    function test_UpdaterCannotSetUpdater() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        vm.prank(keeper);
        vm.expectRevert();
        oracle.setUpdater(hacker);
    }

    // ── Hacker (not updater, not owner) cannot push prices ────────────────────

    function test_RandomAddressCannotSetFallbackPrice() public {
        // No updater set
        vm.prank(hacker);
        vm.expectRevert();
        oracle.setFallbackPrice(weth, WETH_PRICE);
    }

    function test_RandomAddressCannotSetFallbackPricesEvenWithUpdaterSet() public {
        vm.prank(owner);
        oracle.setUpdater(keeper); // keeper is updater, hacker is not

        vm.prank(hacker);
        vm.expectRevert();
        oracle.setFallbackPrice(weth, WETH_PRICE);
    }

    // ── Clearing updater revokes push-price rights ───────────────────────────

    function test_ClearingUpdaterRevokesAccess() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);
        vm.prank(owner);
        oracle.setUpdater(address(0)); // clear

        // Keeper no longer authorised
        vm.prank(keeper);
        vm.expectRevert();
        oracle.setFallbackPrice(weth, WETH_PRICE);
    }

    // ── Owner retains all permissions when updater is set ────────────────────

    function test_OwnerCanStillPushPricesWhenUpdaterSet() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        vm.prank(owner);
        oracle.setFallbackPrice(weth, WETH_PRICE);

        (uint256 price,) = oracle.getPrice(weth);
        assertEq(price, WETH_PRICE);
    }

    function test_OwnerCanRegisterFeedWhenUpdaterSet() public {
        vm.prank(owner);
        oracle.setUpdater(keeper);

        // Should not revert (address(0x9999) is dummy, won't cause revert on registerFeed)
        vm.prank(owner);
        oracle.registerFeed(weth, address(0x9999));
        assertTrue(oracle.hasFeed(weth));
    }

    // ── Default state: no updater set, only owner can push ───────────────────

    function test_DefaultState_NoUpdaterSet() public view {
        assertEq(oracle.updater(), address(0));
    }

    function test_DefaultState_OnlyOwnerCanPush() public {
        // owner succeeds
        vm.prank(owner);
        oracle.setFallbackPrice(weth, WETH_PRICE);

        // non-owner fails
        vm.prank(hacker);
        vm.expectRevert();
        oracle.setFallbackPrice(weth, WETH_PRICE);
    }
}
