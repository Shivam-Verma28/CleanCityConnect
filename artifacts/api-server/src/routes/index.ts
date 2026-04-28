import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import meRouter from "./me";
import reportsRouter from "./reports";
import adminRouter from "./admin";
import rewardsRouter from "./rewards";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(meRouter);
router.use(reportsRouter);
router.use("/admin", adminRouter);
router.use(rewardsRouter);
router.use(statsRouter);

export default router;
