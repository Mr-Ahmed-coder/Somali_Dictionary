import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { checkDatabaseHealth } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestContext } from "./middleware/requestContext.js";
import adminRoutes from "./routes/admin.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import suggestionRoutes from "./routes/suggestion.routes.js";
import wordRoutes from "./routes/word.routes.js";
import { ApiError } from "./utils/apiError.js";
import { asyncHandler } from "./utils/asyncHandler.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(env.CORS_ORIGINS);

  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const requestOrigin = origin.replace(/\/+$/, "");
        if (allowedOrigins.has(requestOrigin)) return callback(null, true);
        return callback(new ApiError(403, "Request origin is not allowed"));
      },
      credentials: true
    })
  );
  app.use((req, res, next) => {
    const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    const protectedPath =
      req.path.startsWith("/api/admin") ||
      req.path.startsWith("/api/words") ||
      req.path.startsWith("/api/analytics") ||
      req.path.startsWith("/api/suggestions");
    const origin = req.header("origin");

    if (!unsafeMethod || !protectedPath || !origin) return next();

    const requestOrigin = origin.replace(/\/+$/, "");
    if (allowedOrigins.has(requestOrigin)) return next();

    return next(new ApiError(403, "Request origin is not allowed"));
  });
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipGlobalRateLimit,
      message: {
        message: "Too many requests. Please wait a moment and try again."
      },
      handler(req, res, _next, options) {
        return res.status(options.statusCode).json({
          ...options.message,
          requestId: req.id
        });
      }
    })
  );
  app.use("/api/suggestions", suggestionRoutes);
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "dictionary-api",
      environment: env.NODE_ENV
    });
  });

  app.get(
    "/api/health",
    asyncHandler(async (_req, res) => {
      const database = await checkDatabaseHealth();
      const isReady = database.status === "ok";

      if (!isReady) res.setHeader("Retry-After", "2");

      res.status(isReady ? 200 : 503).json({
        status: isReady ? "ok" : "degraded",
        service: "dictionary-api",
        environment: env.NODE_ENV,
        database: {
          status: database.status,
          state: database.state
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    })
  );

  app.use("/api/words", wordRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

function skipGlobalRateLimit(req) {
  const path = req.path.replace(/\/+$/, "") || "/";

  return (
    path === "/" ||
    path === "/api/health" ||
    path === "/api/admin/login" ||
    path.startsWith("/api/analytics/") ||
    path === "/api/suggestions" ||
    path === "/api/words/search" ||
    path === "/api/words/suggestions"
  );
}
