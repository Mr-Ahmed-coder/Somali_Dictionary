import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  ADMIN_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_NAME: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AI_PROVIDER: z.string().default("disabled"),
  AI_API_KEY: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parseOrigins(parsedEnv.FRONTEND_URL)
};

function parseOrigins(value = "") {
  return value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function normalizeOrigin(origin = "") {
  return origin.trim().replace(/\/+$/, "");
}
