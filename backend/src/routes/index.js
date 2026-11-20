import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { invalidateOnWrite } from "../utils/cache.js";
import authRoutes from "./auth.routes.js";
import doctorRoutes from "./doctor.routes.js";
import patientRoutes from "./patient.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Everything below requires a signed-in admin.
router.use(requireAuth, requireRole("admin"), invalidateOnWrite);
router.use("/dashboard", dashboardRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);

export default router;
