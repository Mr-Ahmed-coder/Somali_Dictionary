import { MissingSearch } from "../models/missingSearch.model.js";
import { Word } from "../models/word.model.js";
import { ApiError } from "../utils/apiError.js";
import { escapeMissingSearchRegExp, normalizeMissingQuery } from "../utils/missingSearch.js";

const sortStrategies = {
  "most-searched": { count: -1, lastSearchedAt: -1 },
  "least-searched": { count: 1, lastSearchedAt: -1 },
  "most-recent": { lastSearchedAt: -1 },
  oldest: { lastSearchedAt: 1 },
  "a-z": { normalizedQuery: 1 },
  "z-a": { normalizedQuery: -1 }
};

export async function recordMissingSearch(query) {
  const normalizedQuery = normalizeMissingQuery(query);
  const existingWord = await Word.exists({
    status: "published",
    "sync.isDeleted": false,
    $or: [{ normalizedEnglish: normalizedQuery }, { normalizedSomali: normalizedQuery }]
  });

  if (existingWord) return;

  const now = new Date();
  const filter = { normalizedQuery };
  const update = {
    $setOnInsert: {
      query,
      normalizedQuery,
      firstSearchedAt: now
    },
    $set: { lastSearchedAt: now, resolved: false, resolvedAt: null },
    $inc: { count: 1 }
  };

  try {
    await MissingSearch.updateOne(filter, update, {
      upsert: true,
      setDefaultsOnInsert: false
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await MissingSearch.updateOne(filter, {
      $set: { lastSearchedAt: now, resolved: false, resolvedAt: null },
      $inc: { count: 1 }
    });
  }
}

export async function listMissingSearches({ page, limit, q, status, sort }) {
  const filter = {};

  if (status === "missing") filter.resolved = false;
  if (status === "resolved") filter.resolved = true;
  if (q) {
    const normalized = normalizeMissingQuery(q);
    filter.normalizedQuery = new RegExp(`^${escapeMissingSearchRegExp(normalized)}`);
  }

  const skip = (page - 1) * limit;
  const sortBy = sortStrategies[sort] || sortStrategies["most-searched"];
  const [records, totalRecords, countSummary] = await Promise.all([
    MissingSearch.find(filter).sort(sortBy).skip(skip).limit(limit).lean(),
    MissingSearch.countDocuments(filter),
    MissingSearch.aggregate([
      { $match: filter },
      { $group: { _id: null, totalSearches: { $sum: "$count" } } }
    ])
  ]);

  return {
    records,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    totalRecords,
    totalSearches: countSummary[0]?.totalSearches || 0,
    limit
  };
}

export async function setMissingSearchResolution(id, resolved) {
  const record = await MissingSearch.findByIdAndUpdate(
    id,
    { $set: { resolved, resolvedAt: resolved ? new Date() : null } },
    { new: true, runValidators: true }
  ).lean();

  if (!record) throw new ApiError(404, "Missing search record not found");
  return record;
}
