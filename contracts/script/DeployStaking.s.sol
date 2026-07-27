// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {APXStaking}      from "../src/APXStaking.sol";

/// @dev Deploys APXStaking on Robinhood Chain Mainnet (4663).
///
///      APX token is already live at the address below.
///      The rewards pool is funded separately — owner must:
///        1. Approve APXStaking to spend APX
///        2. Call addRewards(amount)
///
///      Run:
///        forge script contracts/script/DeployStaking.s.sol \
///          --rpc-url https://rpc.mainnet.chain.robinhood.com/rpc \
///          --broadcast --legacy --skip-simulation \
///          --private-key "$STAKING_DEPLOYER_PRIVATE_KEY" -vvvv
contract DeployStaking is Script {
    // ── Robinhood Chain Mainnet (4663) ──────────────────────────────────────
    address constant APX_TOKEN = 0x42523E3e454B97ff8651926685aFAD61C950Ab2F;

    // ── Emission: 1,000,000 APX per year ────────────────────────────────────
    uint256 constant APX_PER_YEAR = 1_000_000 ether; // 1e6 × 1e18

    function run() external {
        address deployer = msg.sender;
        console.log("Deployer :", deployer);
        console.log("Balance  :", deployer.balance / 1e18, "ETH");

        vm.startBroadcast();

        APXStaking staking = new APXStaking(
            APX_TOKEN,
            APX_PER_YEAR,
            deployer        // owner = deployer wallet (transfer to multisig before mainnet)
        );

        vm.stopBroadcast();

        console.log("");
        console.log("======== APXStaking DEPLOYMENT COMPLETE ========");
        console.log("Network      : Robinhood Chain Mainnet (4663)");
        console.log("APXStaking   :", address(staking));
        console.log("APX Token    :", APX_TOKEN);
        console.log("Emission     : 1,000,000 APX / year");
        console.log("Cooldown     : 7 days");
        console.log("================================================");
        console.log("Next steps:");
        console.log("  1. Approve APXStaking to spend 10M APX from your wallet");
        console.log("  2. Call addRewards(10_000_000 ether) to fund the pool");
        console.log("  3. Set CONTRACT_APX_STAKING=<address> in your environment secrets");
        console.log("  4. Verify: forge verify-contract ...");
    }
}
