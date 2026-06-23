import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/apiError.js";

export async function attachAdmin(req, _res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload?.role !== "admin" || !payload?.sub) return next();

    const admin = await Admin.findOne({ _id: payload.sub, role: "admin", isActive: true }).select("_id email name role");
    if (admin) {
      req.admin = admin;
    }
  } catch {
    req.adminAuthError = new ApiError(401, "Admin session expired. Please sign in again.");
  }

  return next();
}

export async function requireAdmin(req, res, next) {
  await attachAdmin(req, res, (error) => {
    if (error) return next(error);

    if (req.adminAuthError) {
      return next(req.adminAuthError);
    }

    if (!req.admin || req.admin.role !== "admin") {
      return next(new ApiError(401, "Admin authentication is required"));
    }

    return next();
  });
}

function getBearerToken(req) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}
