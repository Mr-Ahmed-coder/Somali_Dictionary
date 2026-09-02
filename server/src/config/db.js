import mongoose from "mongoose";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import { env } from "./env.js";
import { Word } from "../models/word.model.js";
import { logger } from "../utils/logger.js";

const CONNECTION_STATES = ["disconnected", "connected", "connecting", "disconnecting"];
const HEALTH_CACHE_MS = 3000;
let monitoringConfigured = false;
let cachedHealthCheck = null;

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  mongoose.set("maxTimeMS", env.MONGODB_QUERY_TIMEOUT_MS);

  configureDnsServers();
  logMongoDiagnostics();
  configureConnectionMonitoring();

  let lastError;

  for (let attempt = 1; attempt <= env.MONGODB_CONNECT_MAX_ATTEMPTS; attempt += 1) {
    let stage = "dns.resolveSrv";

    try {
      logger.info("mongodb.connection.attempt", {
        attempt,
        maxAttempts: env.MONGODB_CONNECT_MAX_ATTEMPTS,
        stage
      });
      await validateSrvLookup();

      stage = "mongoose.connect";
      logger.info("mongodb.connection.stage", { attempt, stage });
      await mongoose.connect(env.MONGODB_URI, {
        autoIndex: env.NODE_ENV !== "production",
        serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        connectTimeoutMS: env.MONGODB_CONNECT_TIMEOUT_MS,
        socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS,
        maxPoolSize: 10,
        minPoolSize: 0,
        heartbeatFrequencyMS: 10000
      });

      logger.info("mongodb.connection.ready", {
        attempt,
        state: getDatabaseHealth().state
      });
      console.info("MongoDB connected successfully");
      await dropLegacyWordPairIndexesSafely();
      return;
    } catch (error) {
      lastError = error;
      logger.warn("mongodb.connection.attempt_failed", {
        attempt,
        maxAttempts: env.MONGODB_CONNECT_MAX_ATTEMPTS,
        stage,
        error
      });

      if (attempt < env.MONGODB_CONNECT_MAX_ATTEMPTS) {
        const retryDelayMs = Math.min(env.MONGODB_CONNECT_RETRY_MS * 2 ** (attempt - 1), 15000);
        logger.info("mongodb.connection.retry_scheduled", { attempt, retryDelayMs });
        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError;
}

export function getDatabaseHealth() {
  const readyState = mongoose.connection.readyState;

  return {
    status: readyState === 1 ? "ok" : "unavailable",
    state: CONNECTION_STATES[readyState] || "unknown",
    readyState
  };
}

export async function checkDatabaseHealth() {
  const connectionHealth = getDatabaseHealth();
  if (connectionHealth.status !== "ok") return connectionHealth;

  const now = Date.now();
  if (cachedHealthCheck && now - cachedHealthCheck.checkedAt < HEALTH_CACHE_MS) {
    return cachedHealthCheck.result;
  }

  try {
    await mongoose.connection.db.admin().command({ ping: 1 }, { timeoutMS: 2000 });
    cachedHealthCheck = { checkedAt: Date.now(), result: connectionHealth };
    return connectionHealth;
  } catch (error) {
    const result = {
      status: "unavailable",
      state: "unresponsive",
      readyState: mongoose.connection.readyState
    };
    cachedHealthCheck = { checkedAt: now, result };
    logger.warn("mongodb.health_check_failed", { error });
    return result;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

function configureConnectionMonitoring() {
  if (monitoringConfigured) return;
  monitoringConfigured = true;

  mongoose.connection.on("connected", () => {
    cachedHealthCheck = null;
    logger.info("mongodb.connection.state_changed", { state: "connected" });
  });
  mongoose.connection.on("reconnected", () => {
    cachedHealthCheck = null;
    logger.info("mongodb.connection.state_changed", { state: "reconnected" });
  });
  mongoose.connection.on("disconnected", () => {
    cachedHealthCheck = null;
    logger.warn("mongodb.connection.state_changed", { state: "disconnected" });
  });
  mongoose.connection.on("error", (error) => {
    logger.error("mongodb.connection.error", { error });
  });
}

function logMongoDiagnostics() {
  const parsedUri = parseMongoUri();

  logger.info("mongodb.startup.diagnostics", {
    uriExists: Boolean(env.MONGODB_URI),
    nodeVersion: process.version,
    mongooseVersion: mongoose.version,
    hostname: parsedUri?.hostname ?? "<invalid>"
  });
}

async function validateSrvLookup() {
  const parsedUri = parseMongoUri();

  if (parsedUri?.protocol !== "mongodb+srv:") return;

  const srvHostname = `_mongodb._tcp.${parsedUri.hostname}`;
  const resolver = new dnsPromises.Resolver({
    timeout: env.MONGODB_CONNECT_TIMEOUT_MS,
    tries: 1
  });
  if (env.MONGODB_DNS_SERVERS.length > 0) resolver.setServers(env.MONGODB_DNS_SERVERS);
  await resolver.resolveSrv(srvHostname);
}

function parseMongoUri() {
  try {
    return new URL(env.MONGODB_URI);
  } catch {
    return null;
  }
}

function configureDnsServers() {
  if (env.MONGODB_DNS_SERVERS.length === 0) return;

  dns.setServers(env.MONGODB_DNS_SERVERS);
  logger.info("mongodb.dns.custom_servers_configured", {
    serverCount: env.MONGODB_DNS_SERVERS.length
  });
}

async function dropLegacyWordPairIndexesSafely() {
  try {
    await dropLegacyWordPairIndexes();
  } catch (error) {
    logger.warn("mongodb.legacy_index_cleanup_failed", { error });
  }
}

async function dropLegacyWordPairIndexes() {
  let indexes = [];

  try {
    indexes = await Word.collection.indexes();
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") return;
    throw error;
  }

  const legacyIndexes = indexes.filter((index) => {
    const keys = Object.keys(index.key || {});
    return (
      index.unique === true &&
      keys.length === 2 &&
      keys.includes("english") &&
      keys.includes("somali")
    );
  });

  for (const index of legacyIndexes) {
    await Word.collection.dropIndex(index.name);
    logger.info("mongodb.legacy_index_dropped", { indexName: index.name });
  }
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
