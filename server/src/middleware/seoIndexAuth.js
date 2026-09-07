import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function requireSeoIndexToken(req, _res, next) {
  const expectedToken = env.SEO_INDEX_TOKEN || "";
  const suppliedToken = req.header("x-seo-index-token") || "";

  if (!expectedToken) {
    return next(new ApiError(503, "SEO index is not configured"));
  }

  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  const isValid = expected.length === supplied.length && timingSafeEqual(expected, supplied);

  if (!isValid) {
    return next(new ApiError(404, "Resource not found"));
  }

  return next();
}
