// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IUSDAxOracle} from "./interfaces/IUSDAxOracle.sol";

/// @title ChainlinkPriceOracle
/// @notice Production-grade oracle for USDAX protocol.
///         Reads live prices from Chainlink AggregatorV3 feeds.
///         Falls back to owner-set prices when a feed is unavailable or stale.
///
/// @dev Mainnet Robinhood Chain (4663) Chainlink feeds:
///      ETH/USD:     0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9
///      WBTC/USD:    0x62107b0d3adA75fc1697fD342d99eed947a3aA5E
///      WSTETH/USD:  0x3F5040B50FB37934573B210fE54B53a6F1A792E8
///
///      On testnet (46630) no Chainlink feeds are deployed — use setFallbackPrice().
///      On mainnet, call registerFeed(token, aggregator) after deploying.
contract ChainlinkPriceOracle is IUSDAxOracle, Ownable {

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant WAD = 1e18;

    // ─── Config ───────────────────────────────────────────────────────────────
    /// @notice Maximum age (seconds) for a Chainlink answer before it's considered stale.
    ///         Default: 1 hour. Can be extended for low-liquidity assets.
    uint256 public maxStaleness = 3_600;

    // ─── Storage ──────────────────────────────────────────────────────────────
    /// @notice token → Chainlink aggregator
    mapping(address => AggregatorV3Interface) public feeds;

    struct FallbackData {
        uint256 price;      // USD price, 18 decimals
        uint256 updatedAt;  // block.timestamp of last admin update
    }
    /// @notice Admin-set fallback prices (used when Chainlink feed is absent/stale)
    mapping(address => FallbackData) private _fallback;

    // ─── Events ───────────────────────────────────────────────────────────────
    event FeedRegistered(address indexed token, address indexed aggregator);
    event FeedRemoved(address indexed token);
    event FallbackPriceSet(address indexed token, uint256 price);
    event MaxStalenessUpdated(uint256 newMaxStaleness);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address owner_) Ownable(owner_) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Register a Chainlink aggregator for a collateral token.
    ///         On Robinhood Chain mainnet (4663) call this after deploying with the
    ///         live feed addresses documented above.
    function registerFeed(address token, address aggregator) external onlyOwner {
        require(token != address(0) && aggregator != address(0), "zero address");
        feeds[token] = AggregatorV3Interface(aggregator);
        emit FeedRegistered(token, aggregator);
    }

    /// @notice Remove a Chainlink feed — oracle will fall back to admin-set price.
    function removeFeed(address token) external onlyOwner {
        delete feeds[token];
        emit FeedRemoved(token);
    }

    /// @notice Set a fallback price for a token (18 decimals, e.g. $3247.50 = 3247.5e18).
    ///         Required on testnet where no Chainlink feeds exist.
    ///         Also used as a backup on mainnet if the feed goes stale.
    function setFallbackPrice(address token, uint256 usdPrice18) external onlyOwner {
        require(usdPrice18 > 0, "price zero");
        _fallback[token] = FallbackData({price: usdPrice18, updatedAt: block.timestamp});
        emit FallbackPriceSet(token, usdPrice18);
    }

    /// @notice Batch-set fallback prices.
    function setFallbackPrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyOwner {
        require(tokens.length == prices.length, "length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(prices[i] > 0, "price zero");
            _fallback[tokens[i]] = FallbackData({price: prices[i], updatedAt: block.timestamp});
            emit FallbackPriceSet(tokens[i], prices[i]);
        }
    }

    /// @notice Update the maximum staleness threshold (minimum: 5 minutes).
    function setMaxStaleness(uint256 newMaxStaleness) external onlyOwner {
        require(newMaxStaleness >= 300, "too short (min 5m)");
        maxStaleness = newMaxStaleness;
        emit MaxStalenessUpdated(newMaxStaleness);
    }

    // ─── IUSDAxOracle ─────────────────────────────────────────────────────────

    /// @notice Returns the USD price for a token.
    ///         Attempts Chainlink feed first; falls back to admin-set price.
    ///         Reverts if no valid price is available or the price is stale.
    function getPrice(address token)
        external
        view
        returns (uint256 price, uint256 updatedAt)
    {
        // 1. Try Chainlink feed
        (bool ok, uint256 clPrice, uint256 clTs) = _tryChainlink(token);
        if (ok) {
            require(
                block.timestamp - clTs <= maxStaleness,
                "Oracle: Chainlink price stale"
            );
            return (clPrice, clTs);
        }

        // 2. Fallback to admin-set price
        FallbackData memory fb = _fallback[token];
        require(fb.price > 0, "Oracle: price not set");
        require(
            block.timestamp - fb.updatedAt <= 24 hours,
            "Oracle: fallback price stale (>24h)"
        );
        return (fb.price, fb.updatedAt);
    }

    /// @notice Returns price without staleness check (for UI / off-chain helpers).
    ///         MUST NOT be used in liquidation or mint logic.
    function getPriceUnsafe(address token)
        external
        view
        returns (uint256 price, uint256 updatedAt)
    {
        (bool ok, uint256 clPrice, uint256 clTs) = _tryChainlink(token);
        if (ok) return (clPrice, clTs);
        FallbackData memory fb = _fallback[token];
        return (fb.price, fb.updatedAt);
    }

    /// @notice Returns whether a live Chainlink feed is active for a token.
    function hasFeed(address token) external view returns (bool) {
        return address(feeds[token]) != address(0);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Attempts to read `latestRoundData()` from the registered Chainlink feed.
    ///      Returns (false, 0, 0) on any failure — caller decides whether to revert.
    function _tryChainlink(address token)
        internal
        view
        returns (bool success, uint256 price18, uint256 ts)
    {
        AggregatorV3Interface feed = feeds[token];
        if (address(feed) == address(0)) return (false, 0, 0);

        try feed.latestRoundData() returns (
            uint80  roundId,
            int256  answer,
            uint256, // startedAt (unused)
            uint256  updatedAt_,
            uint80  answeredInRound
        ) {
            // Reject negative, zero, or incomplete-round answers
            if (answer <= 0)               return (false, 0, 0);
            if (answeredInRound < roundId) return (false, 0, 0);

            // Normalize Chainlink decimals → 18 decimals
            uint8 dec = feed.decimals();
            uint256 raw = uint256(answer);
            if (dec < 18) {
                price18 = raw * (10 ** uint256(18 - dec));
            } else if (dec > 18) {
                price18 = raw / (10 ** uint256(dec - 18));
            } else {
                price18 = raw;
            }
            return (true, price18, updatedAt_);
        } catch {
            return (false, 0, 0);
        }
    }
}
