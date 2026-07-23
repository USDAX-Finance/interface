import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * GET /api/config
 * Returns public configuration for the frontend.
 * PRIVY_APP_ID is the public app identifier — safe to expose to clients.
 */
router.get("/config", (_req, res): void => {
  res.json({
    privyAppId: process.env.PRIVY_APP_ID ?? "",
    chainId: 46630,
    networkName: "Robinhood Chain Testnet",
  });
});

export default router;
