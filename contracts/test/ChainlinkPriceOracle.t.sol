// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ChainlinkPriceOracle} from "../src/ChainlinkPriceOracle.sol";

/**
 * @title ChainlinkPriceOracle Tests
 * @notice Covers: fallback price setting, staleness validation, access control,
 *         and Chainlink feed integration (mocked AggregatorV3 interface).
 */
contract ChainlinkPriceOracleTest is Test {

    // ── Minimal Chainlink AggregatorV3 mock ─────────────────────────────────

    /**
     * A simple mock aggregator that returns a fixed answer and timestamp.
     * We deploy these inline; their addresses become the "feed" addresses.
     */
    MockAggregator internal freshFeed;
    MockAggregator internal staleFeed;
    MockAggregator internal negativeFeed; // returns zero/negative price

    ChainlinkPriceOracle internal oracle;

    address internal owner   = address(0xDEAD);
    address internal alice   = address(0xA11CE);
    address internal weth    = address(0x1001);
    address internal wbtc    = address(0x1002);
    address internal steth   = address(0x1003);

    uint256 internal constant WETH_PRICE  = 3_000e18;
    uint256 internal constant WBTC_PRICE  = 65_000e18;
    uint256 internal constant STETH_PRICE = 2_950e18;

    function setUp() public {
        // Warp to a safe timestamp so "block.timestamp - 27 hours" never underflows
        vm.warp(2 days);

        vm.startPrank(owner);
        oracle = new ChainlinkPriceOracle(owner);

        // Set testnet fallback prices for weth/wbtc/steth
        address[] memory tokens = new address[](3);
        uint256[] memory prices = new uint256[](3);
        tokens[0] = weth;  prices[0] = WETH_PRICE;
        tokens[1] = wbtc;  prices[1] = WBTC_PRICE;
        tokens[2] = steth; prices[2] = STETH_PRICE;
        oracle.setFallbackPrices(tokens, prices);

        // Deploy mock Chainlink feeds
        // Fresh: timestamp 1 hour ago (well within MAX_STALENESS of 26 h)
        freshFeed    = new MockAggregator(int256(4_000e8), block.timestamp - 1 hours);
        // Stale: timestamp 27 hours ago (exceeds MAX_STALENESS)
        staleFeed    = new MockAggregator(int256(4_000e8), block.timestamp - 27 hours);
        // Zero price
        negativeFeed = new MockAggregator(int256(0), block.timestamp);

        vm.stopPrank();
    }

    // ── Fallback price reads ─────────────────────────────────────────────────

    function test_FallbackPriceRead() public view {
        (uint256 price, uint256 updatedAt) = oracle.getPrice(weth);
        assertEq(price, WETH_PRICE, "weth fallback price");
        assertGt(updatedAt, 0, "updatedAt set");
    }

    function test_FallbackUpdatedAtEqualsBlockTimestamp() public view {
        (, uint256 updatedAt) = oracle.getPrice(wbtc);
        // fallback prices are stored with block.timestamp at the time of setFallbackPrices
        assertEq(updatedAt, block.timestamp, "fallback updatedAt = block.timestamp");
    }

    function test_UnknownTokenReverts() public {
        vm.expectRevert();
        oracle.getPrice(address(0xBAD));
    }

    // ── setFallbackPrices access control ────────────────────────────────────

    function test_OnlyOwnerCanSetFallbackPrices() public {
        vm.startPrank(alice);
        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = weth; pxs[0] = 1_000e18;
        vm.expectRevert();
        oracle.setFallbackPrices(toks, pxs);
        vm.stopPrank();
    }

    function test_SetFallbackPricesLengthMismatchReverts() public {
        vm.startPrank(owner);
        address[] memory toks = new address[](2);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = weth; toks[1] = wbtc; pxs[0] = 1_000e18;
        vm.expectRevert();
        oracle.setFallbackPrices(toks, pxs);
        vm.stopPrank();
    }

    function test_ZeroFallbackPriceReverts() public {
        vm.startPrank(owner);
        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = weth; pxs[0] = 0;
        vm.expectRevert();
        oracle.setFallbackPrices(toks, pxs);
        vm.stopPrank();
    }

    function test_OwnerCanUpdateFallbackPrice() public {
        vm.startPrank(owner);
        address[] memory toks = new address[](1);
        uint256[] memory pxs  = new uint256[](1);
        toks[0] = weth; pxs[0] = 4_000e18;
        oracle.setFallbackPrices(toks, pxs);
        vm.stopPrank();
        (uint256 price,) = oracle.getPrice(weth);
        assertEq(price, 4_000e18, "updated fallback price");
    }

    // ── setFeed / Chainlink integration ─────────────────────────────────────

    function test_OnlyOwnerCanSetFeed() public {
        vm.startPrank(alice);
        vm.expectRevert();
        oracle.registerFeed(weth, address(freshFeed));
        vm.stopPrank();
    }

    function test_FreshChainlinkFeedUsed() public {
        vm.startPrank(owner);
        oracle.registerFeed(weth, address(freshFeed));
        vm.stopPrank();

        (uint256 price,) = oracle.getPrice(weth);
        // freshFeed returns 4_000e8 at 8 decimals, oracle normalises to 18 decimals
        assertEq(price, 4_000e18, "Chainlink feed price");
    }

    function test_StaleFeedReverts() public {
        vm.startPrank(owner);
        oracle.registerFeed(weth, address(staleFeed));
        vm.stopPrank();

        // Stale Chainlink feed → getPrice() reverts with "Oracle: Chainlink price stale"
        // The oracle does NOT silently fall back when a registered feed is stale; it reverts
        // so that callers cannot unknowingly use an outdated price.
        vm.expectRevert(bytes("Oracle: Chainlink price stale"));
        oracle.getPrice(weth);
    }

    function test_ZeroPriceFeedFallsBackToFallbackPrice() public {
        vm.startPrank(owner);
        oracle.registerFeed(weth, address(negativeFeed));
        vm.stopPrank();

        (uint256 price,) = oracle.getPrice(weth);
        assertEq(price, WETH_PRICE, "zero-price feed falls back to fallback price");
    }

    // ── removeFeed ──────────────────────────────────────────────────────────

    function test_RemoveFeedRestoresFallback() public {
        vm.startPrank(owner);
        oracle.registerFeed(weth, address(freshFeed));
        oracle.removeFeed(weth);
        vm.stopPrank();

        (uint256 price,) = oracle.getPrice(weth);
        assertEq(price, WETH_PRICE, "removed feed falls back to fallback price");
    }

    function test_OnlyOwnerCanRemoveFeed() public {
        vm.startPrank(owner);
        oracle.registerFeed(weth, address(freshFeed));
        vm.stopPrank();

        vm.startPrank(alice);
        vm.expectRevert();
        oracle.removeFeed(weth);
        vm.stopPrank();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    function toArr(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }
}

// ── Minimal Chainlink AggregatorV3 mock ─────────────────────────────────────

contract MockAggregator {
    int256  public immutable answer;
    uint256 public immutable updatedAt;

    constructor(int256 _answer, uint256 _updatedAt) {
        answer    = _answer;
        updatedAt = _updatedAt;
    }

    function decimals() external pure returns (uint8) { return 8; }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 ans,
        uint256 startedAt,
        uint256 updAt,
        uint80 answeredInRound
    ) {
        roundId        = 1;
        ans            = answer;
        startedAt      = updatedAt;
        updAt          = updatedAt;
        answeredInRound = 1;
    }
}
