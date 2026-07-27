// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title  CollateralManager
/// @author USDAX Finance
/// @notice Registry of whitelisted collateral tokens and their risk parameters.
///         VaultEngine reads this contract to determine maximum LTV, liquidation
///         thresholds, and liquidation bonuses for each token it accepts.
///
///         Risk parameter relationships (enforced at addCollateral / updateCollateral)
///         ───────────────────────────────────────────────────────────────────────────
///         maxLTV < liquidationThreshold ≤ 100%
///         • maxLTV:               maximum debt a user may mint against a token (e.g. 80% = 8000 bps).
///         • liquidationThreshold: health factor numerator threshold; vault becomes liquidatable
///                                 when its health factor drops below 1.0 WAD (e.g. 85% = 8500 bps).
///         • liquidationBonus:     extra collateral paid to the liquidator as incentive (≤ 20% = 2000 bps).
///         • tokenDecimals:        native decimal places of the token ERC-20 (used in price scaling).
///
///         Disabling a token
///         ─────────────────
///         disableCollateral() sets enabled=false. Existing vaults with that collateral are
///         NOT affected (VaultEngine does not close them). New deposits of that token are blocked.
///         Re-enabling requires addCollateral() — updating a disabled token is not supported.
///
/// @dev    All basis-point values use BASIS_POINTS = 10 000 as the divisor (100%).
contract CollateralManager is Ownable {

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Divisor for basis-point calculations (10 000 = 100%).
    uint256 public constant BASIS_POINTS = 10_000;

    // ─── Types ────────────────────────────────────────────────────────────────

    /// @notice Risk parameters for a whitelisted collateral token.
    struct CollateralConfig {
        /// @dev Whether this token is currently accepted as collateral.
        ///      False after disableCollateral(); not reset by updateCollateral().
        bool enabled;

        /// @dev Maximum loan-to-value ratio in basis points (e.g. 8000 = 80%).
        ///      A user with $1 000 of this collateral may mint up to $800 USDAX.
        uint256 maxLTV;

        /// @dev Liquidation threshold in basis points (e.g. 8500 = 85%).
        ///      A vault is liquidatable when its adjusted collateral value falls below
        ///      (debt × 1e18 / liquidationThreshold). Must be > maxLTV.
        uint256 liquidationThreshold;

        /// @dev Liquidation bonus in basis points (e.g. 500 = 5%).
        ///      The liquidator receives principal collateral + bonus as incentive.
        ///      Bounded to ≤ 2000 bps (20%) to prevent excessive bad debt.
        uint256 liquidationBonus;

        /// @dev Native decimal places of the ERC-20 token (e.g. 18 for WETH, 8 for WBTC).
        ///      Used by VaultEngine to normalise token amounts to USD (18 decimal) prices:
        ///      usdValue = tokenAmount × tokenPrice / 10^tokenDecimals.
        uint8 tokenDecimals;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Ordered list of all collateral token addresses ever added (including disabled).
    ///         Used by VaultEngine to iterate over tokens when computing vault values.
    address[] public collateralList;

    /// @notice Risk configuration for each collateral token address.
    mapping(address => CollateralConfig) public collaterals;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a new collateral type is added.
    /// @param token         ERC-20 token address of the new collateral.
    /// @param maxLTV        Maximum LTV in basis points.
    /// @param liqThreshold  Liquidation threshold in basis points.
    /// @param liqBonus      Liquidation bonus in basis points.
    /// @param tokenDecimals Native decimal places of the token.
    event CollateralAdded(
        address indexed token,
        uint256 maxLTV,
        uint256 liqThreshold,
        uint256 liqBonus,
        uint8   tokenDecimals
    );

    /// @notice Emitted when risk parameters for an existing collateral are updated.
    /// @param token        ERC-20 token address of the updated collateral.
    /// @param maxLTV       New maximum LTV in basis points.
    /// @param liqThreshold New liquidation threshold in basis points.
    /// @param liqBonus     New liquidation bonus in basis points.
    event CollateralUpdated(
        address indexed token,
        uint256 maxLTV,
        uint256 liqThreshold,
        uint256 liqBonus
    );

    /// @notice Emitted when a collateral token is disabled.
    /// @param token ERC-20 token address that was disabled.
    event CollateralDisabled(address indexed token);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @notice Deploy the CollateralManager with no collateral tokens registered.
    ///         Add tokens via addCollateral() after deployment.
    /// @param owner_ Initial contract owner (Ownable). Typically the deployer or a timelock.
    constructor(address owner_) Ownable(owner_) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Register a new collateral token with its risk parameters.
    ///         Reverts if the token is already registered (use updateCollateral for changes).
    ///         Enforces maxLTV < liquidationThreshold ≤ 100% and liquidationBonus ≤ 20%.
    ///         Only callable by the contract owner.
    /// @param token               ERC-20 token address to whitelist as collateral.
    /// @param maxLTV              Maximum loan-to-value in basis points (e.g. 8000 = 80%).
    ///                            Must be strictly less than `liquidationThreshold`.
    /// @param liquidationThreshold Threshold at which vaults become liquidatable, in basis points
    ///                            (e.g. 8500 = 85%). Must be ≤ BASIS_POINTS (100%).
    /// @param liquidationBonus    Bonus collateral awarded to liquidators in basis points
    ///                            (e.g. 500 = 5%). Must be ≤ 2000.
    /// @param tokenDecimals       Native ERC-20 decimal places of the token (e.g. 18 for WETH).
    function addCollateral(
        address token,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint8   tokenDecimals
    ) external onlyOwner {
        require(!collaterals[token].enabled, "already added");
        require(maxLTV < liquidationThreshold, "LTV must be < liq threshold");
        require(liquidationThreshold <= BASIS_POINTS, "liq threshold > 100%");
        require(liquidationBonus <= 2000, "bonus too high");

        collaterals[token] = CollateralConfig({
            enabled:              true,
            maxLTV:               maxLTV,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus:     liquidationBonus,
            tokenDecimals:        tokenDecimals
        });
        collateralList.push(token);
        emit CollateralAdded(token, maxLTV, liquidationThreshold, liquidationBonus, tokenDecimals);
    }

    /// @notice Update risk parameters for an already-registered collateral token.
    ///         tokenDecimals is immutable — the token's decimal count cannot change.
    ///         Enforces maxLTV < liquidationThreshold (same constraint as addCollateral).
    ///         Only callable by the contract owner.
    /// @param token               ERC-20 token address of the collateral to update.
    /// @param maxLTV              New maximum LTV in basis points. Must be < liquidationThreshold.
    /// @param liquidationThreshold New liquidation threshold in basis points.
    /// @param liquidationBonus    New liquidation bonus in basis points.
    function updateCollateral(
        address token,
        uint256 maxLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyOwner {
        require(collaterals[token].enabled, "not whitelisted");
        require(maxLTV < liquidationThreshold, "LTV must be < liq threshold");
        collaterals[token].maxLTV               = maxLTV;
        collaterals[token].liquidationThreshold = liquidationThreshold;
        collaterals[token].liquidationBonus     = liquidationBonus;
        emit CollateralUpdated(token, maxLTV, liquidationThreshold, liquidationBonus);
    }

    /// @notice Disable a collateral token to prevent new deposits.
    ///         Existing vault positions that hold this token are NOT automatically closed.
    ///         VaultEngine will still price and liquidate existing positions; users can repay
    ///         and withdraw the disabled token at any time.
    ///         Only callable by the contract owner.
    /// @param token ERC-20 token address to disable.
    function disableCollateral(address token) external onlyOwner {
        collaterals[token].enabled = false;
        emit CollateralDisabled(token);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    /// @notice Check whether a collateral token is currently enabled for new deposits.
    /// @param  token  ERC-20 token address to query.
    /// @return True if the token is whitelisted and not disabled; false otherwise.
    function isEnabled(address token) external view returns (bool) {
        return collaterals[token].enabled;
    }

    /// @notice Return the full risk configuration for a collateral token.
    ///         Returns a zero-initialised struct (enabled=false) for unregistered tokens.
    /// @param  token  ERC-20 token address to query.
    /// @return Full CollateralConfig struct for the token.
    function getConfig(address token) external view returns (CollateralConfig memory) {
        return collaterals[token];
    }

    /// @notice Return the ordered list of all collateral token addresses ever registered
    ///         (including disabled tokens). VaultEngine iterates this list to compute vault values.
    /// @return Array of collateral token addresses in registration order.
    function getCollateralList() external view returns (address[] memory) {
        return collateralList;
    }
}
