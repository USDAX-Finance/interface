// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ChainlinkPriceOracle} from "../src/ChainlinkPriceOracle.sol";
import {VaultEngine} from "../src/VaultEngine.sol";
import {USDAxToken} from "../src/USDAxToken.sol";
import {USDAxSavings} from "../src/USDAxSavings.sol";
import {MockERC20} from "../src/MockERC20.sol";

/// @notice Full protocol redeploy with ChainlinkPriceOracle.
///         Reuses mock tokens + CollateralManager; redeploys oracle, USDAX, vault, savings.
///
/// Testnet (46630): No Chainlink feeds available — oracle uses admin-set fallback prices.
/// Mainnet (4663):  After deploying on mainnet, register live Chainlink feeds:
///                  ETH/USD:    0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9
///                  WBTC/USD:   0x62107b0d3adA75fc1697fD342d99eed947a3aA5E
///                  WSTETH/USD: 0x3F5040B50FB37934573B210fE54B53a6F1A792E8
///
/// Run:
///   forge script script/DeployChainlinkOracle.s.sol \
///     --rpc-url robinhood_testnet --broadcast --legacy --skip-simulation \
///     --private-key "0x$DEPLOYER_PRIVATE_KEY" -vvvv
contract DeployChainlinkOracle is Script {

    // ── Reused: mock tokens + CollateralManager (no state change needed) ───────
    address constant WETH_TOKEN  = 0x728a06069E7A7DBafe2a92bc1E3e4d48e8fC49Dc;
    address constant WBTC_TOKEN  = 0xBA4120eA7aA703cA1BBCdD03a1B4Ff15e15F2e34;
    address constant STETH_TOKEN = 0xE571b0C36B3EF817950f7Fe3Aa296F2a1fB7479e;
    address constant COLL_MGR    = 0x2472DCBA450e0AA2f81e69AaCD33f91528343854;

    // ── Testnet fallback prices (18 decimals) ──────────────────────────────────
    uint256 constant WETH_PRICE  = 3247_500000000000000000;  // $3247.50
    uint256 constant WBTC_PRICE  = 67823_000000000000000000; // $67823.00
    uint256 constant STETH_PRICE = 3190_000000000000000000;  // $3190.00

    // ── Savings params ────────────────────────────────────────────────────────
    uint256 constant APY_BPS     = 420;        // 4.20%
    uint256 constant MINT_USDAX  = 1_000e18;   // mint 1000 USDAX to seed rewards
    uint256 constant SEED_USDAX  = 900e18;     // 900 USDAX → reward pool

    function run() external {
        address deployer = msg.sender;
        console.log("Deployer   :", deployer);
        console.log("Balance    :", deployer.balance / 1e18, "ETH");

        vm.startBroadcast();

        // ── 1. ChainlinkPriceOracle ──────────────────────────────────────────
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(deployer);

        address[] memory toks = new address[](3);
        uint256[] memory pxs  = new uint256[](3);
        toks[0] = WETH_TOKEN;  pxs[0] = WETH_PRICE;
        toks[1] = WBTC_TOKEN;  pxs[1] = WBTC_PRICE;
        toks[2] = STETH_TOKEN; pxs[2] = STETH_PRICE;
        oracle.setFallbackPrices(toks, pxs);

        // ── 2. USDAxToken ────────────────────────────────────────────────────
        USDAxToken usdax = new USDAxToken(deployer);

        // ── 3. VaultEngine ───────────────────────────────────────────────────
        VaultEngine vault = new VaultEngine(
            address(usdax),
            COLL_MGR,
            address(oracle),
            deployer,   // feeRecipient
            deployer,
            500         // 5% APY stability fee
        );

        // Wire: USDAxToken → VaultEngine (mint/burn rights)
        usdax.setVaultEngine(address(vault));

        // ── 4. USDAxSavings ──────────────────────────────────────────────────
        USDAxSavings savings = new USDAxSavings(address(usdax), APY_BPS, deployer);

        // Seed reward pool: claim WETH → deposit → mint USDAX → fund savings
        MockERC20(WETH_TOKEN).faucet();
        IERC20(WETH_TOKEN).approve(address(vault), 1e18);
        vault.depositCollateral(WETH_TOKEN, 1e18);
        vault.mintUsdax(MINT_USDAX);               // receive 995 USDAX (0.5% fee)
        IERC20(address(usdax)).approve(address(savings), SEED_USDAX);
        savings.addRewards(SEED_USDAX);             // 900 USDAX into reward pool

        vm.stopBroadcast();

        // ── Summary ──────────────────────────────────────────────────────────
        console.log("\n===== CHAINLINK ORACLE - FULL REDEPLOY =====");
        console.log("Network    : Robinhood Chain Testnet (46630)");
        console.log("Deployer   :", deployer);
        console.log("---------------------------------------------");
        console.log("ChainlinkPriceOracle :", address(oracle));
        console.log("USDAxToken           :", address(usdax));
        console.log("VaultEngine          :", address(vault));
        console.log("USDAxSavings         :", address(savings));
        console.log("---------------------------------------------");
        console.log("Reused (unchanged):");
        console.log("  WETH    :", WETH_TOKEN);
        console.log("  WBTC    :", WBTC_TOKEN);
        console.log("  stETH   :", STETH_TOKEN);
        console.log("  CollMgr :", COLL_MGR);
        console.log("---------------------------------------------");
        console.log("Update your environment secrets:");
        console.log("  CONTRACT_ORACLE       =", address(oracle));
        console.log("  CONTRACT_USDAX        =", address(usdax));
        console.log("  CONTRACT_VAULT_ENGINE =", address(vault));
        console.log("  CONTRACT_SAVINGS      =", address(savings));
        console.log("=============================================");
        console.log("MAINNET: register feeds after deploy:");
        console.log("  oracle.registerFeed(WETH,  0x78F3556b67E17Df817D51Ef5a990cDaF09E8d3A9)");
        console.log("  oracle.registerFeed(WBTC,  0x62107b0d3adA75fc1697fD342d99eed947a3aA5E)");
        console.log("  oracle.registerFeed(stETH, 0x3F5040B50FB37934573B210fE54B53a6F1A792E8)");
    }
}
