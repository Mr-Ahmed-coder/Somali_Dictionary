import { ZodError } from "zod";
import { env } from "../config/env.js";

export function errorHandler(error, _req, res, _next) {
  const isProduction = env.NODE_ENV === "production";

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.flatten()
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource identifier"
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate dictionary entry",
      details: isProduction ? undefined : error.keyValue
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      details: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.name === "MulterError") {
    const isFileSizeError = error.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({
      message: isFileSizeError ? "Import file is too large" : "File upload failed",
      details: isProduction ? undefined : error.message
    });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 && isProduction ? "Internal server error" : error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("Unhandled server error", error);
  }

  return res.status(statusCode).json({
    message,
    details: isProduction ? undefined : error.details || undefined,
    stack: isProduction ? undefined : error.stack
  });
}
