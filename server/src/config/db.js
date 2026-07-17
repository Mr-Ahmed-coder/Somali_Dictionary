import mongoose from "mongoose";
import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import { env } from "./env.js";
import { Word } from "../models/word.model.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  let stage = "startup";

  configureDnsServers();
  logMongoDiagnostics();

  try {
    stage = "dns.resolveSrv";
    await validateSrvLookup();

    stage = "mongoose.connect";
    console.info(`MongoDB connection stage: ${stage}`);
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production"
    });
  } catch (error) {
    console.error(`MongoDB connection failed at stage: ${stage}`);
    throw error;
  }

  console.info("MongoDB connected successfully");
  await dropLegacyWordPairIndexes();
}

function logMongoDiagnostics() {
  const parsedUri = parseMongoUri();

  console.info("MongoDB startup diagnostics");
  console.info(`MongoDB URI exists: ${Boolean(env.MONGODB_URI)}`);
  console.info(`Node.js version: ${process.version}`);
  console.info(`Mongoose version: ${mongoose.version}`);
  console.info(`MongoDB URI hostname: ${parsedUri?.hostname ?? "<invalid>"}`);
}

async function validateSrvLookup() {
  const parsedUri = parseMongoUri();

  if (parsedUri?.protocol !== "mongodb+srv:") return;

  const srvHostname = `_mongodb._tcp.${parsedUri.hostname}`;
  console.info("MongoDB connection stage: dns.resolveSrv");
  await dnsPromises.resolveSrv(srvHostname);
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
    console.info(`Dropped legacy word index: ${index.name}`);
  }
}
