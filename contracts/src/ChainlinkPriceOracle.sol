// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {IUSDAxOracle} from "./interfaces/IUSDAxOracle.sol";

/// @title  ChainlinkPriceOracle
/// @author USDAX Finance
/// @notice Production price oracle for the USDAX protocol.
///         Reads live USD prices from Chainlink AggregatorV3 feeds and normalises
///         them to 18 decimals. Falls back to owner-set prices when a feed is
///         unavailable or returns a stale answer.
///
///         Two-tier price resolution (getPrice)
///         ──────────────────────────────────────
///         1. If a Chainlink feed is registered and returns a fresh, valid answer,
///            that price is used. "Valid" = positive answer, completed round, age ≤ maxStaleness.
///         2. Otherwise the admin fallback is used. Fallback must be ≤ 24 hours old.
///         3. If neither source yields a valid price, the call reverts.
///
///         Mainnet Robinhood Chain (4663) Chainlink feed addresses
///         ─────────────────────────────────────────────────────────
///         ETH/USD:    0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9
///         WBTC/USD:   0x62107b0d3adA75fc1697fD342d99eed947a3aA5E
///         WSTETH/USD: 0x3F5040B50FB37934573B210fE54B53a6F1A792E8
///         Register these via registerFeed() after mainnet deployment.
///
///         Testnet (46630): no Chainlink feeds are deployed.
///         Use setFallbackPrices() to seed prices; the keeper refreshes every 30 minutes.
///
/// @dev    All prices are expressed in USD with 18 decimal places (WAD).
///         Chainlink feeds may use 8 decimals (standard) — _tryChainlink() normalises to 18.
contract ChainlinkPriceOracle is IUSDAxOracle, Ownable {

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice 1 WAD = 1e18. All prices returned by this contract are WAD-scaled.
    uint256 public constant WAD = 1e18;

    // ─── Config ───────────────────────────────────────────────────────────────

    /// @notice Maximum age (seconds) for a Chainlink round answer before it is treated
    ///         as stale and the fallback price is used instead. Default: 1 hour.
    ///         Can be raised for less-liquid assets with slower feed update cadences.
    uint256 public maxStaleness = 3_600;

    /// @notice Address authorised to push fallback prices (setFallbackPrice / setFallbackPrices).
    ///         Separate from the contract owner so the keeper bot can update prices frequently
    ///         without having governance-level admin rights. address(0) = only owner may push prices.
    ///         Set via setUpdater(). On mainnet, set this to a dedicated keeper EOA or multisig;
    ///         on testnet, the deployer serves as both owner and updater.
    address public updater;

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @notice Chainlink AggregatorV3 feed registered for each collateral token.
    ///         address(0) means no feed is registered; fallback price is used.
    mapping(address => AggregatorV3Interface) public feeds;

    /// @notice Admin-set fallback price data for a token.
    struct FallbackData {
        /// @dev USD price with 18 decimal places (WAD).
        uint256 price;
        /// @dev block.timestamp of the last admin update via setFallbackPrice(s).
        uint256 updatedAt;
    }

    /// @notice Fallback price data for each token, keyed by token address.
    ///         Private: read via getPrice() or getPriceUnsafe().
    mapping(address => FallbackData) private _fallback;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a Chainlink feed is registered for a token.
    /// @param token      Collateral token address.
    /// @param aggregator Chainlink AggregatorV3Interface contract address.
    event FeedRegistered(address indexed token, address indexed aggregator);

    /// @notice Emitted when a Chainlink feed is removed, reverting that token to fallback pricing.
    /// @param token Collateral token address whose feed was removed.
    event FeedRemoved(address indexed token);

    /// @notice Emitted when an admin fallback price is set for a token.
    /// @param token  Collateral token address.
    /// @param price  New fallback price (18 decimals, USD).
    event FallbackPriceSet(address indexed token, uint256 price);

    /// @notice Emitted when the maximum Chainlink staleness threshold is updated.
    /// @param newMaxStaleness New threshold in seconds.
    event MaxStalenessUpdated(uint256 newMaxStaleness);

    /// @notice Emitted when the updater address is changed.
    /// @param oldUpdater Previous updater address (address(0) if none was set).
    /// @param newUpdater New updater address (address(0) to clear the role).
    event UpdaterSet(address indexed oldUpdater, address indexed newUpdater);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @notice Deploy the oracle with no registered feeds and no updater set.
    ///         Call setUpdater() after deployment to authorise the keeper bot address.
    ///         Seed fallback prices via setFallbackPrices() and register Chainlink feeds
    ///         via registerFeed() as needed.
    /// @param owner_ Initial contract owner (Ownable). Typically the deployer or a timelock.
    constructor(address owner_) Ownable(owner_) {}

    // ─── Modifiers ────────────────────────────────────────────────────────────

    /// @dev Allows the call from either the contract owner or the designated updater.
    ///      Used to restrict fallback-price setters so only the keeper (updater role) or
    ///      the governance owner can push prices, while registerFeed / removeFeed /
    ///      setMaxStaleness remain exclusively owner-controlled.
    modifier onlyUpdaterOrOwner() {
        require(
            msg.sender == owner() || (updater != address(0) && msg.sender == updater),
            "Oracle: not owner or updater"
        );
        _;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Assign or replace the updater address — the account authorised to push
    ///         fallback prices without full owner privileges.
    ///         Set to the keeper bot EOA on testnet; on mainnet use a dedicated hot wallet
    ///         or a separate Gnosis Safe with a lower signing threshold.
    ///         Set to address(0) to revoke the role (only owner may push prices).
    ///         Only callable by the contract owner (or timelock on production).
    /// @param newUpdater Address to grant the updater role. May be address(0) to clear it.
    function setUpdater(address newUpdater) external onlyOwner {
        address old = updater;
        updater = newUpdater;
        emit UpdaterSet(old, newUpdater);
    }

    /// @notice Register a Chainlink AggregatorV3 feed for a collateral token.
    ///         After registration, getPrice() will prefer the Chainlink feed over the fallback.
    ///         On Robinhood Chain mainnet (4663) call this after deployment with the addresses
    ///         documented in the contract-level NatSpec.
    ///         Only callable by the contract owner.
    /// @param token      Collateral token address. Must be non-zero.
    /// @param aggregator Chainlink AggregatorV3Interface address. Must be non-zero.
    function registerFeed(address token, address aggregator) external onlyOwner {
        require(token != address(0) && aggregator != address(0), "zero address");
        feeds[token] = AggregatorV3Interface(aggregator);
        emit FeedRegistered(token, aggregator);
    }

    /// @notice Remove the Chainlink feed for a token.
    ///         After removal, getPrice() falls back to the admin-set price.
    ///         Only callable by the contract owner.
    /// @param token Collateral token address whose feed should be removed.
    function removeFeed(address token) external onlyOwner {
        delete feeds[token];
        emit FeedRemoved(token);
    }

    /// @notice Set a single admin fallback price.
    ///         The fallback is used when no Chainlink feed is registered or the feed is stale.
    ///         On testnet this is the primary (only) price source; the keeper refreshes it
    ///         every 30 minutes from a CoinGecko feed to keep it within the 24-hour validity window.
    ///         Callable by the contract owner OR the designated updater (keeper bot).
    /// @param token       Collateral token address.
    /// @param usdPrice18  USD price with 18 decimal places (e.g. $3 247.50 = 3247.5e18). Must be > 0.
    function setFallbackPrice(address token, uint256 usdPrice18) external onlyUpdaterOrOwner {
        require(usdPrice18 > 0, "price zero");
        _fallback[token] = FallbackData({price: usdPrice18, updatedAt: block.timestamp});
        emit FallbackPriceSet(token, usdPrice18);
    }

    /// @notice Batch-set admin fallback prices for multiple tokens in one transaction.
    ///         Useful for the keeper's periodic refresh to minimise gas and round-trip latency.
    ///         Callable by the contract owner OR the designated updater (keeper bot).
    /// @param tokens  Array of collateral token addresses. Must be the same length as `prices`.
    /// @param prices  Corresponding USD prices with 18 decimals. Each must be > 0.
    function setFallbackPrices(
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyUpdaterOrOwner {
        require(tokens.length == prices.length, "length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(prices[i] > 0, "price zero");
            _fallback[tokens[i]] = FallbackData({price: prices[i], updatedAt: block.timestamp});
            emit FallbackPriceSet(tokens[i], prices[i]);
        }
    }

    /// @notice Update the maximum Chainlink answer age before it is treated as stale.
    ///         A shorter window gives stronger freshness guarantees but may cause reverts
    ///         during Chainlink downtime. A longer window is appropriate for less-liquid assets.
    ///         Minimum allowed value is 300 seconds (5 minutes) to prevent misconfiguration.
    ///         Only callable by the contract owner.
    /// @param newMaxStaleness New staleness threshold in seconds. Must be ≥ 300.
    function setMaxStaleness(uint256 newMaxStaleness) external onlyOwner {
        require(newMaxStaleness >= 300, "too short (min 5m)");
        maxStaleness = newMaxStaleness;
        emit MaxStalenessUpdated(newMaxStaleness);
    }

    // ─── IUSDAxOracle ─────────────────────────────────────────────────────────

    /// @notice Returns the current USD price for `token` with staleness enforcement.
    ///         Priority: Chainlink feed (if registered and fresh) → admin fallback (if ≤ 24h old).
    ///         Reverts if no valid, non-stale price is available.
    ///         This is the only function that should be called from protocol logic
    ///         (mintUsdax, liquidate, health-factor checks).
    /// @param  token     Collateral token address to price.
    /// @return price     USD price (18 decimals, WAD-scaled).
    /// @return updatedAt block.timestamp at which the price was last confirmed valid.
    ///                   VaultEngine additionally validates this against MAX_ORACLE_STALENESS.
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

    /// @notice Returns the most recently known price for `token` WITHOUT staleness checks.
    ///         Intended for off-chain UI display, monitoring dashboards, and test helpers.
    ///         MUST NOT be called from liquidation, mint, or any other protocol safety logic.
    ///         Returns (0, 0) if no price has ever been set for the token.
    /// @param  token     Collateral token address to query.
    /// @return price     Most recent USD price (18 decimals). 0 if never set.
    /// @return updatedAt Timestamp of the most recent price update. 0 if never set.
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

    /// @notice Returns whether a Chainlink feed is currently registered for a token.
    ///         A `true` result does not guarantee the feed is fresh or returning valid data.
    /// @param  token  Collateral token address.
    /// @return True if a non-zero aggregator is registered; false otherwise.
    function hasFeed(address token) external view returns (bool) {
        return address(feeds[token]) != address(0);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Attempt to read the latest price from the registered Chainlink feed for `token`.
    ///      Returns (false, 0, 0) on any failure so the caller can decide whether to revert
    ///      or fall through to the fallback price — no external side effects on failure.
    ///
    ///      Validity filters applied to the Chainlink response:
    ///      • answer must be positive (> 0).
    ///      • answeredInRound must be ≥ roundId (ensures the round is complete).
    ///      • Decimal normalisation: Chainlink typically uses 8 decimals; result is scaled to 18.
    ///
    /// @param  token     Collateral token address.
    /// @return success   True if the feed returned a usable price.
    /// @return price18   USD price normalised to 18 decimal places.
    /// @return ts        updatedAt timestamp from the Chainlink round.
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
            // Reject negative, zero, or incomplete-round answers.
            if (answer <= 0)               return (false, 0, 0);
            if (answeredInRound < roundId) return (false, 0, 0);

            // Normalise Chainlink decimals to 18 decimal places (WAD).
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
