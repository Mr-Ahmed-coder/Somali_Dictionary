import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DNS_SERVERS: z.string().optional(),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  CORS_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  ADMIN_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  ADMIN_NAME: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  MONGODB_CONNECT_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  MONGODB_CONNECT_RETRY_MS: z.coerce.number().int().min(100).max(30000).default(1000),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  MONGODB_QUERY_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  AI_PROVIDER: z.string().default("disabled"),
  AI_API_KEY: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

const productionFrontendOrigins = [
  "https://somali-dictionary.com",
  "https://www.somali-dictionary.com"
];

export const env = {
  ...parsedEnv,
  MONGODB_DNS_SERVERS: parseList(parsedEnv.MONGODB_DNS_SERVERS),
  CORS_ORIGINS: buildCorsOrigins(parsedEnv)
};

function buildCorsOrigins({ CORS_ORIGINS, FRONTEND_URL, NODE_ENV }) {
  const configuredOrigins = [
    ...parseOrigins(FRONTEND_URL),
    ...parseOrigins(CORS_ORIGINS)
  ];
  const developmentOrigins = NODE_ENV === "production" ? [] : ["http://localhost:3000"];

  return [...new Set([...configuredOrigins, ...productionFrontendOrigins, ...developmentOrigins])];
}

function parseOrigins(value = "") {
  return parseList(value).map(normalizeOrigin).filter(Boolean);
}

function parseList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrigin(origin = "") {
  return origin.trim().replace(/\/+$/, "");
}
