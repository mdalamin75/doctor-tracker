import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginBody } from "../validators/schemas.js";

const router = Router();

// Brute-force protection: 10 attempts / 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { message: "Too many login attempts, try again in a few minutes" } },
});

router.post("/login", loginLimiter, validate({ body: loginBody }), auth.login);
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.me);

export default router;
