import { Router } from "express";
import { getStats } from "../controllers/dashboard.controller.js";
import { validate } from "../middleware/validate.js";
import { dashboardQuery } from "../validators/schemas.js";

const router = Router();
router.get("/stats", validate({ query: dashboardQuery }), getStats);
export default router;
