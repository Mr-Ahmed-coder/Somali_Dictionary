import { ZodError } from "zod";
import { env } from "../config/env.js";
import { isTransientDatabaseError } from "./errorHandler.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export function v1NotFound(req, _res, next) {
  next(new ApiError(404, "API route not found"));
}

export function v1ErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const validationError = error instanceof ZodError;
  const invalidIdentifier = error?.name === "CastError";
  const transientDatabaseError = isTransientDatabaseError(error);
  const statusCode = validationError || invalidIdentifier
    ? 400
    : transientDatabaseError
      ? 503
      : error.statusCode || 500;
  const code = getErrorCode(statusCode);
  const hideMessage = statusCode >= 500 && env.NODE_ENV === "production";
  const message = transientDatabaseError
    ? "Dictionary service is temporarily unavailable"
    : hideMessage
      ? "Internal server error"
      : error.message || "Internal server error";

  if (statusCode >= 500) {
    logger.error("api.v1.request.failed", {
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
    success: false,
    error: {
      code,
      message,
      ...(validationError ? { details: error.flatten().fieldErrors } : {})
    },
    meta: { requestId: req.id }
  });
}

function getErrorCode(statusCode) {
  if (statusCode === 400) return "invalid_request";
  if (statusCode === 403) return "forbidden";
  if (statusCode === 404) return "not_found";
  if (statusCode === 429) return "rate_limited";
  if (statusCode === 503) return "service_unavailable";
  return "internal_error";
}
