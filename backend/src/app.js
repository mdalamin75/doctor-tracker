import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { config } from "./config.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // correct client IP for rate limiting behind the Next.js proxy / load balancer
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (config.env !== "test") app.use(morgan(config.isProd ? "combined" : "dev"));

  app.get("/health", (_req, res) =>
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "up" : "down" })
  );
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
