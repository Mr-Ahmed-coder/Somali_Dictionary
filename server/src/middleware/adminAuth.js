import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Admin } from "../models/admin.model.js";
import { ApiError } from "../utils/apiError.js";

export async function attachAdmin(req, _res, next) {
  const token = getAdminToken(req);

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload?.role !== "admin" || !payload?.sub) return next();

    const admin = await Admin.findOne({ _id: payload.sub, role: "admin", isActive: true }).select(
      "_id email name role tokenVersion passwordChangedAt"
    );

    if (!isCurrentAdminSession(payload, admin)) {
      req.adminAuthError = new ApiError(401, "Admin session expired. Please sign in again.");
      return next();
    }

    if (admin) {
      req.admin = admin;
    }
  } catch (error) {
    if (!isJwtError(error)) {
      return next(error);
    }

    req.adminAuthError = new ApiError(401, "Admin session expired. Please sign in again.");
  }

  return next();
}

function isJwtError(error) {
  return ["TokenExpiredError", "JsonWebTokenError", "NotBeforeError"].includes(error?.name);
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

function getAdminToken(req) {
  return getCookieToken(req) || getBearerToken(req);
}

function getBearerToken(req) {
  const header = req.header("authorization") || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}

function getCookieToken(req) {
  const cookieHeader = req.header("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const adminCookie = cookies.find((cookie) => cookie.startsWith("dictionary_admin_session="));

  if (!adminCookie) return "";

  return decodeURIComponent(adminCookie.split("=").slice(1).join("="));
}

function isCurrentAdminSession(payload, admin) {
  if (!admin) return false;
  if (payload.tokenVersion !== admin.tokenVersion) return false;
  if (!admin.passwordChangedAt || !payload.iat) return true;

  const issuedAtMs = payload.iat * 1000;
  return issuedAtMs >= admin.passwordChangedAt.getTime();
}
