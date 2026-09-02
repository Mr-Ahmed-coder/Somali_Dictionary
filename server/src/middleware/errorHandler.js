import { ZodError } from "zod";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const isProduction = env.NODE_ENV === "production";

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.flatten(),
      requestId: req.id
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource identifier",
      requestId: req.id
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate dictionary entry",
      details: isProduction ? undefined : error.keyValue,
      requestId: req.id
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      details: Object.values(error.errors).map((item) => item.message),
      requestId: req.id
    });
  }

  if (error.name === "MulterError") {
    const isFileSizeError = error.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      message: isFileSizeError ? "Import file is too large" : "File upload failed",
      details: isProduction ? undefined : error.message,
      requestId: req.id
    });
  }

  const statusCode = isTransientDatabaseError(error) ? 503 : error.statusCode || 500;
  const message = statusCode >= 500 && isProduction ? "Internal server error" : error.message || "Internal server error";
  const publicMessage = statusCode === 503 ? "Dictionary service is temporarily unavailable" : message;

  if (statusCode >= 500) {
    logger.error("http.request.failed", {
      requestId: req.id,
      method: req.method,
      path: (req.originalUrl || req.path || "/").split("?")[0],
      statusCode,
      error
    });
  }

  if (statusCode === 503) {
    res.setHeader("Retry-After", "2");
  }

  return res.status(statusCode).json({
    message: publicMessage,
    details: isProduction ? undefined : error.details || undefined,
    stack: isProduction ? undefined : error.stack,
    requestId: req.id
  });
}

function isTransientDatabaseError(error) {
  const transientNames = new Set([
    "MongoNetworkError",
    "MongoNetworkTimeoutError",
    "MongoServerSelectionError",
    "MongoTopologyClosedError",
    "MongooseServerSelectionError"
  ]);
  const transientCodes = new Set([
    50,
    "ETIMEOUT",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ECONNRESET",
    "ENETUNREACH",
    "EAI_AGAIN",
    "ENOTFOUND",
    "ESERVFAIL",
    "EREFUSED"
  ]);

  return (
    transientNames.has(error?.name) ||
    transientCodes.has(error?.code) ||
    /buffering timed out|server selection timed out|connection (?:is )?closed|before initial connection is complete/i.test(
      error?.message || ""
    )
  );
}
