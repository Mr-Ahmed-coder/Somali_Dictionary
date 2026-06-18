import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  FRONTEND_URL: z.string().optional(),
  ADMIN_API_KEY: z.string().min(12, "ADMIN_API_KEY must be at least 12 characters"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AI_PROVIDER: z.string().default("disabled"),
  AI_API_KEY: z.string().optional()
}).superRefine((value, context) => {
  if (value.NODE_ENV === "production" && !value.FRONTEND_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["FRONTEND_URL"],
      message: "FRONTEND_URL is required in production"
    });
  }
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  CORS_ORIGINS: parseOrigins(parsedEnv.FRONTEND_URL || "")
};

function parseOrigins(value = "") {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
