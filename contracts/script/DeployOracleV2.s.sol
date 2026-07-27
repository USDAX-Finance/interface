// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ChainlinkPriceOracle} from "../src/ChainlinkPriceOracle.sol";

/**
 * @title  DeployOracleV2
 * @notice Deploys the v1.5 ChainlinkPriceOracle (with updater role), seeds fallback
 *         prices for all testnet collateral tokens, and assigns the deployer as the
 *         initial updater so the keeper can continue pushing CoinGecko prices.
 *
 *         After deployment:
 *         1. Save the printed address to CONTRACT_ORACLE env var.
 *         2. Submit a TimelockController proposal to call VaultEngine.setOracle(newOracle).
 *            (VaultEngine is owned by the timelock — the 24h delay must elapse before execution.)
 *         3. Once executed, oracle ownership may be transferred to the timelock via
 *            oracle.transferOwnership(timelock) so admin functions require governance.
 *
 * Usage:
 *   forge script contracts/script/DeployOracleV2.s.sol \
 *     --rpc-url $RPC_URL \
 *     --private-key "0x$DEPLOYER_PRIVATE_KEY" \
 *     --legacy --skip-simulation --broadcast
 */
contract DeployOracleV2 is Script {

    // Testnet collateral token addresses (chain 46630)
    address constant WETH  = 0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc;
    address constant WBTC  = 0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34;
    address constant STETH = 0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e;

    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy new oracle (deployer = owner)
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(deployer);
        console.log("ChainlinkPriceOracle v1.5 deployed:", address(oracle));

        // 2. Assign updater role to deployer (same address as ORACLE_UPDATER_KEY / keeper oracle key)
        //    On mainnet: replace with a dedicated hot-wallet or keeper EOA
        oracle.setUpdater(deployer);
        console.log("Updater role assigned to:", deployer);

        // 3. Seed fallback prices (will be overwritten by keeper's first 30-min refresh)
        //    Using round numbers — keeper updates immediately on startup
        address[] memory tokens = new address[](3);
        uint256[] memory prices = new uint256[](3);
        tokens[0] = WETH;  prices[0] = 2_000e18;
        tokens[1] = WBTC;  prices[1] = 65_000e18;
        tokens[2] = STETH; prices[2] = 2_000e18;
        oracle.setFallbackPrices(tokens, prices);
        console.log("Fallback prices seeded (WETH/WBTC/stETH)");

        vm.stopBroadcast();

        console.log("");
        console.log("=== ORACLE V1.5 DEPLOYMENT COMPLETE ===");
        console.log("New oracle  :", address(oracle));
        console.log("Owner       :", deployer);
        console.log("Updater     :", deployer);
        console.log("");
        console.log("Next steps:");
        console.log("  1. Set CONTRACT_ORACLE =", address(oracle));
        console.log("  2. Schedule TimelockController proposal:");
        console.log("     target  = CONTRACT_VAULT_ENGINE");
        console.log("     data    = VaultEngine.setOracle(", address(oracle), ")");
        console.log("     delay   = 24h");
        console.log("  3. Execute proposal after 24h");
        console.log("  4. Transfer oracle ownership to timelock (optional, after mainnet go-live)");
    }
}
