import { Router, type IRouter } from "express";
import { CONTRACTS, CHAIN_ID, RPC_URL } from "../lib/contracts.js";

const router: IRouter = Router();

/**
 * GET /api/config
 * Returns public configuration for the frontend.
 * Includes deployed contract addresses and network info.
 */
router.get("/config", (_req, res): void => {
  res.json({
    privyAppId:  process.env.PRIVY_APP_ID ?? "",
    chainId:     CHAIN_ID,
    rpcUrl:      RPC_URL,
    networkName: "Robinhood Chain Testnet",
    explorerUrl: "https://explorer.testnet.chain.robinhood.com",
    contracts: {
      weth:              CONTRACTS.WETH,
      wbtc:              CONTRACTS.WBTC,
      steth:             CONTRACTS.stETH,
      oracle:            CONTRACTS.oracle,
      collateralManager: CONTRACTS.collateralManager,
      usdax:             CONTRACTS.usdax,
      vaultEngine:       CONTRACTS.vaultEngine,
      savings:           CONTRACTS.savings,
    },
  });
});

export default router;
