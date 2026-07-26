// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IUSDAxOracle
/// @notice Common interface for USDAX protocol price oracles.
///         Both MockPriceOracle and ChainlinkPriceOracle implement this interface
///         so VaultEngine can swap between them without code changes.
interface IUSDAxOracle {
    /// @notice Get USD price for a token.
    /// @dev Reverts if price is unavailable or stale.
    /// @param token  ERC-20 token address
    /// @return price      USD price, 18 decimals (e.g. $2000 = 2000e18)
    /// @return updatedAt  block.timestamp of last price update
    function getPrice(address token) external view returns (uint256 price, uint256 updatedAt);

    /// @notice Get price without staleness check (read-only helper / UI).
    /// @dev Should NOT be used in liquidation or mint logic.
    function getPriceUnsafe(address token) external view returns (uint256 price, uint256 updatedAt);
}
