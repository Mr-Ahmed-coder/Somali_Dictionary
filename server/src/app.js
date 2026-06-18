import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import adminRoutes from "./routes/admin.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wordRoutes from "./routes/word.routes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(env.CORS_ORIGINS);

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        if (env.NODE_ENV !== "production" && allowedOrigins.size === 0) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "dictionary-api",
      environment: env.NODE_ENV
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "dictionary-api",
      environment: env.NODE_ENV
    });
  });

  app.use("/api/words", wordRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
