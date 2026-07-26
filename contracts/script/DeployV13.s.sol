// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Deploy VaultEngine v1.3 (adds debt ceiling + emergency pause).
///         Reuses all existing contracts; only VaultEngine + USDAxSavings are redeployed.
///
/// Usage:
///   forge script contracts/script/DeployV13.s.sol \
///     --rpc-url https://rpc.testnet.chain.robinhood.com/rpc \
///     --private-key "0x$DEPLOYER_PRIVATE_KEY" \
///     --broadcast --legacy --skip-simulation -vvvv

import {Script, console} from "forge-std/Script.sol";
import {VaultEngine}    from "../src/VaultEngine.sol";
import {USDAxToken}     from "../src/USDAxToken.sol";
import {USDAxSavings}   from "../src/USDAxSavings.sol";

contract DeployV13 is Script {
    // ── Existing contract addresses ─────────────────────────────────────────
    address constant USDAX             = 0x1988D89F5E7339394C20f93e982188c70eC4e5D3;
    address constant COLLATERAL_MANAGER= 0x2472DCBA450e0AA2f81e69AaCD33f91528343854;
    address constant ORACLE            = 0xfE07515418B6f7239e9b4ecE21f49a75656Ba1a3;

    // ── Params ──────────────────────────────────────────────────────────────
    uint256 constant STABILITY_FEE_BPS = 500;   // 5% APY
    uint256 constant SAVINGS_SEED_USDAX = 900e18; // seed 900 USDAX to savings pool
    uint256 constant DEBT_CEILING       = 0;    // 0 = uncapped (set via setDebtCeiling later)

    function run() external {
        address deployer = msg.sender;
        console.log("Deployer:", deployer);

        vm.startBroadcast();

        // 1. Deploy new VaultEngine v1.3
        VaultEngine vault = new VaultEngine(
            USDAX,
            COLLATERAL_MANAGER,
            ORACLE,
            deployer,    // feeRecipient
            deployer,    // owner
            STABILITY_FEE_BPS
        );
        console.log("VaultEngine v1.3:", address(vault));

        // 2. Point USDAX token at new VaultEngine (owner-only)
        USDAxToken(USDAX).updateVaultEngine(address(vault));
        console.log("USDAxToken.updateVaultEngine done");

        // 3. Deploy new USDAxSavings (constructor: usdax, apyBps, owner)
        //    4.20% APY savings rate — consistent with what the UI displays
        USDAxSavings savings = new USDAxSavings(USDAX, 420, deployer);
        console.log("USDAxSavings (new):", address(savings));

        vm.stopBroadcast();

        console.log("---");
        console.log("Update env vars:");
        console.log("  CONTRACT_VAULT_ENGINE=", address(vault));
        console.log("  CONTRACT_SAVINGS=", address(savings));
    }
}
