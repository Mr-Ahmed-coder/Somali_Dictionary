import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function requireAdmin(req, _res, next) {
  const apiKey = req.header("x-admin-key");

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return next(new ApiError(401, "Admin API key is required"));
  }

  return next();
}
