import { Router, type IRouter } from "express";
import healthRouter from "./health";
import protocolRouter from "./protocol";
import positionsRouter from "./positions";
import stakingRouter from "./staking";
import liquidationsRouter from "./liquidations";
import yieldRouter from "./yield";
import configRouter from "./config";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(adminRouter);
router.use(protocolRouter);
router.use(positionsRouter);
router.use(stakingRouter);
router.use(liquidationsRouter);
router.use(yieldRouter);

export default router;
