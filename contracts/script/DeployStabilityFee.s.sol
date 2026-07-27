// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VaultEngine} from "../src/VaultEngine.sol";
import {USDAxToken} from "../src/USDAxToken.sol";
import {USDAxSavings} from "../src/USDAxSavings.sol";
import {MockERC20} from "../src/MockERC20.sol";

/// @notice Deploy new VaultEngine v1.2 with stability fee.
///         Reuses existing oracle, USDAX token, CollateralManager, and mock tokens.
///         Migrates USDAX minting rights to new VaultEngine via updateVaultEngine().
///
/// Run:
///   forge script script/DeployStabilityFee.s.sol \
///     --rpc-url robinhood_testnet --broadcast --legacy --skip-simulation \
///     --private-key "0x$DEPLOYER_PRIVATE_KEY" -vvvv
contract DeployStabilityFee is Script {

    // ── Existing (unchanged) contracts ────────────────────────────────────────
    address constant ORACLE   = 0xfE07515418B6f7239e9b4ecE21f49a75656Ba1a3;
    address constant USDAX    = 0x1988D89F5E7339394C20f93e982188c70eC4e5D3;
    address constant COLL_MGR = 0x2472DCBA450e0AA2f81e69AaCD33f91528343854;
    address constant WETH     = 0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc;
    address constant WBTC     = 0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34;
    address constant STETH    = 0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e;

    // ── Savings contract (redeploy to point at new VaultEngine indirectly) ────
    // USDAxSavings only holds USDAX — it doesn't depend on VaultEngine address.
    // We reuse the existing savings contract; only vault needs to change.
    address constant OLD_SAVINGS = 0x24121228c54916CCa8651D6B4770e7A23030c476;

    // ── Stability fee ─────────────────────────────────────────────────────────
    uint256 constant STABILITY_FEE_BPS = 500; // 5% APY

    // ── Savings re-seed ───────────────────────────────────────────────────────
    uint256 constant MINT_USDAX = 1_000e18;
    uint256 constant SEED_USDAX = 900e18;
    uint256 constant APY_BPS    = 420; // 4.20%

    function run() external {
        address deployer = msg.sender;
        console.log("Deployer   :", deployer);
        console.log("Balance    :", deployer.balance / 1e18, "ETH");

        vm.startBroadcast();

        // ── 1. Deploy new VaultEngine v1.2 ───────────────────────────────────
        VaultEngine newVault = new VaultEngine(
            USDAX,
            COLL_MGR,
            ORACLE,
            deployer,    // feeRecipient
            deployer,    // owner
            STABILITY_FEE_BPS
        );

        // ── 2. Migrate: grant new vault mint/burn rights on USDAxToken ────────
        USDAxToken(USDAX).updateVaultEngine(address(newVault));

        // ── 3. Deploy fresh USDAxSavings (points to same USDAX token) ─────────
        USDAxSavings newSavings = new USDAxSavings(USDAX, APY_BPS, deployer);

        // ── 4. Seed reward pool via new vault ─────────────────────────────────
        MockERC20(WETH).faucet();
        IERC20(WETH).approve(address(newVault), 1e18);
        newVault.depositCollateral(WETH, 1e18);
        newVault.mintUsdax(MINT_USDAX);              // receive 995 USDAX (0.5% fee)
        IERC20(USDAX).approve(address(newSavings), SEED_USDAX);
        newSavings.addRewards(SEED_USDAX);

        vm.stopBroadcast();

        // ── Summary ───────────────────────────────────────────────────────────
        console.log("\n===== STABILITY FEE UPGRADE - VaultEngine v1.2 =====");
        console.log("Network         : Robinhood Chain Testnet (46630)");
        console.log("Deployer        :", deployer);
        console.log("---------------------------------------------------");
        console.log("NEW VaultEngine :", address(newVault));
        console.log("NEW USDAxSavings:", address(newSavings));
        console.log("Stability fee   : 5% APY (500 BPS)");
        console.log("---------------------------------------------------");
        console.log("Reused (unchanged):");
        console.log("  Oracle  :", ORACLE);
        console.log("  USDAX   :", USDAX);
        console.log("  CollMgr :", COLL_MGR);
        console.log("  WETH    :", WETH);
        console.log("  WBTC    :", WBTC);
        console.log("  stETH   :", STETH);
        console.log("---------------------------------------------------");
        console.log("Update your environment secrets:");
        console.log("  CONTRACT_VAULT_ENGINE =", address(newVault));
        console.log("  CONTRACT_SAVINGS      =", address(newSavings));
        console.log("===================================================");
    }
}
