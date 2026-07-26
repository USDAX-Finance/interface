import { Router, type IRouter } from "express";
import { CONTRACTS, CHAIN_ID, RPC_URL } from "../lib/contracts.js";
import { getStabilityFee } from "../lib/blockchain.js";

const router: IRouter = Router();

/**
 * GET /api/config
 * Returns public configuration for the frontend.
 * Includes deployed contract addresses and network info.
 */
router.get("/config", async (_req, res): Promise<void> => {
  // Fetch stability fee on-chain (best-effort; default 500 = 5% if unavailable)
  let stabilityFeePerYear = 500;
  try { stabilityFeePerYear = await getStabilityFee(); } catch { /* keep default */ }

  res.json({
    privyAppId:  process.env.PRIVY_APP_ID ?? "",
    chainId:     CHAIN_ID,
    rpcUrl:      RPC_URL,
    networkName: "Robinhood Chain Testnet",
    explorerUrl: "https://explorer.testnet.chain.robinhood.com",
    stabilityFeeApy: stabilityFeePerYear / 100,  // e.g. 500 BPS → 5.0
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
