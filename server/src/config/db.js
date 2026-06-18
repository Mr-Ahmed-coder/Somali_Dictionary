import mongoose from "mongoose";
import { env } from "./env.js";
import { Word } from "../models/word.model.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });

  console.info("MongoDB connected");
  await dropLegacyWordPairIndexes();
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
