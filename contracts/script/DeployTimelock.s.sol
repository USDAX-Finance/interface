// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DeployTimelock
 * @notice Deploys an OZ TimelockController and transfers ownership of all core
 *         USDAX Finance contracts to it.
 *
 * Security model:
 *  - Deployer becomes the sole proposer and executor during testnet phase.
 *  - A 24-hour min delay is enforced before any admin action executes.
 *  - ChainlinkPriceOracle is intentionally excluded: its owner must call
 *    setFallbackPrices() frequently (keeper does this every 30 min on testnet).
 *    On mainnet, the oracle admin role should be separated from the timelock owner.
 *
 * Usage:
 *   forge script contracts/script/DeployTimelock.s.sol \
 *     --rpc-url $RPC_URL \
 *     --private-key "0x$DEPLOYER_PRIVATE_KEY" \
 *     --legacy --skip-simulation --broadcast
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY, CONTRACT_VAULT_ENGINE, CONTRACT_USDAX,
 *   CONTRACT_SAVINGS, CONTRACT_COLLATERAL_MANAGER
 */
contract DeployTimelock is Script {

    // Admin functions on Ownable contracts
    bytes32 constant PROPOSER_ROLE  = keccak256("PROPOSER_ROLE");
    bytes32 constant EXECUTOR_ROLE  = keccak256("EXECUTOR_ROLE");
    bytes32 constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");

    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");

        // ── Existing contract addresses ──────────────────────────────────────
        address vaultEngine       = vm.envAddress("CONTRACT_VAULT_ENGINE");
        address usdaxToken        = vm.envAddress("CONTRACT_USDAX");
        address usdaxSavings      = vm.envAddress("CONTRACT_SAVINGS");
        address collMgr           = vm.envAddress("CONTRACT_COLLATERAL_MANAGER");
        // ChainlinkPriceOracle excluded — needs frequent owner calls from keeper

        // Uses --private-key passed on the CLI (never read the key in script)
        vm.startBroadcast();

        // ── 1. Deploy TimelockController ─────────────────────────────────────
        // Min delay: 24 hours
        // Proposers: deployer only (APX governance multisig post-launch)
        // Executors: deployer only (open execution possible post-audit review)
        // Admin: address(0) — renounced immediately, timelock governs itself
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;

        TimelockController timelock = new TimelockController(
            24 hours,    // minDelay
            proposers,
            executors,
            address(0)   // self-governed (no separate admin)
        );

        console.log("TimelockController deployed:", address(timelock));
        console.log("  minDelay   : 24 hours");
        console.log("  proposer   :", deployer);
        console.log("  executor   :", deployer);

        // ── 2. Transfer ownership of core contracts to timelock ──────────────
        // Each contract uses OZ Ownable — transferOwnership(newOwner)

        // VaultEngine
        (bool ok1,) = vaultEngine.call(
            abi.encodeWithSignature("transferOwnership(address)", address(timelock))
        );
        require(ok1, "VaultEngine transferOwnership failed");
        console.log("VaultEngine  ownership -> timelock");

        // USDAxToken
        (bool ok2,) = usdaxToken.call(
            abi.encodeWithSignature("transferOwnership(address)", address(timelock))
        );
        require(ok2, "USDAxToken transferOwnership failed");
        console.log("USDAxToken   ownership -> timelock");

        // USDAxSavings
        (bool ok3,) = usdaxSavings.call(
            abi.encodeWithSignature("transferOwnership(address)", address(timelock))
        );
        require(ok3, "USDAxSavings transferOwnership failed");
        console.log("USDAxSavings ownership -> timelock");

        // CollateralManager
        (bool ok4,) = collMgr.call(
            abi.encodeWithSignature("transferOwnership(address)", address(timelock))
        );
        require(ok4, "CollateralManager transferOwnership failed");
        console.log("CollMgr      ownership -> timelock");

        vm.stopBroadcast();

        console.log("");
        console.log("=== TIMELOCK DEPLOYMENT COMPLETE ===");
        console.log("TimelockController :", address(timelock));
        console.log("Contracts now owned by timelock:");
        console.log("  VaultEngine       :", vaultEngine);
        console.log("  USDAxToken        :", usdaxToken);
        console.log("  USDAxSavings      :", usdaxSavings);
        console.log("  CollateralManager :", collMgr);
        console.log("ChainlinkPriceOracle: owner unchanged (keeper dependency)");
        console.log("Save the timelock address to CONTRACT_TIMELOCK env var.");
    }
}
