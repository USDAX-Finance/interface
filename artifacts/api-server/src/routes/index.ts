import { Router, type IRouter } from "express";
import healthRouter from "./health";
import protocolRouter from "./protocol";
import positionsRouter from "./positions";
import stakingRouter from "./staking";
import liquidationsRouter from "./liquidations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(protocolRouter);
router.use(positionsRouter);
router.use(stakingRouter);
router.use(liquidationsRouter);

export default router;
