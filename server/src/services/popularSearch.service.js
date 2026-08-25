import { Word } from "../models/word.model.js";
import { ApiError } from "../utils/apiError.js";

const activeWordFilter = {
  status: "published",
  "sync.isDeleted": false
};

const sortStrategies = {
  "most-searched": { "popularity.searchCount": -1, "popularity.lastSearchedAt": -1, _id: 1 },
  "least-searched": { "popularity.searchCount": 1, "popularity.lastSearchedAt": -1, _id: 1 },
  "most-recent": { "popularity.lastSearchedAt": -1, "popularity.searchCount": -1, _id: 1 },
  oldest: { "popularity.firstSearchedAt": 1, "popularity.searchCount": -1, _id: 1 },
  "a-z": { normalizedEnglish: 1, _id: 1 },
  "z-a": { normalizedEnglish: -1, _id: 1 }
};

export async function incrementPopularSearch(wordId) {
  const searchedAt = new Date();
  const result = await Word.updateOne(
    { _id: wordId, ...activeWordFilter },
    [
      {
        $set: {
          popularity: {
            $mergeObjects: [
              { $ifNull: ["$popularity", {}] },
              {
                searchCount: { $add: [{ $ifNull: ["$popularity.searchCount", 0] }, 1] },
                firstSearchedAt: { $ifNull: ["$popularity.firstSearchedAt", searchedAt] },
                lastSearchedAt: searchedAt
              }
            ]
          }
        }
      }
    ],
    { timestamps: false }
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, "Published word not found");
  }
}

export async function listPopularSearches({ page = 1, limit = 25, q = "", sort = "most-searched" }) {
  const query = {
    ...activeWordFilter,
    "popularity.searchCount": { $gt: 0 }
  };
  const normalizedQuery = normalizeText(q);

  if (normalizedQuery) {
    const prefix = new RegExp(`^${escapeRegExp(normalizedQuery)}`);
    query.$or = [{ normalizedEnglish: prefix }, { normalizedSomali: prefix }];
  }

  const currentPage = Number(page);
  const pageLimit = Number(limit);
  const skip = (currentPage - 1) * pageLimit;
  const [words, totalRecords] = await Promise.all([
    Word.find(query)
      .sort(sortStrategies[sort] || sortStrategies["most-searched"])
      .skip(skip)
      .limit(pageLimit)
      .select("englishWord somaliWord popularity.searchCount popularity.firstSearchedAt popularity.lastSearchedAt")
      .lean(),
    Word.countDocuments(query)
  ]);

  return {
    records: words.map((word, index) => ({
      rank: skip + index + 1,
      wordId: word._id,
      english: word.englishWord,
      somali: word.somaliWord,
      count: word.popularity?.searchCount || 0,
      firstSearchedAt: word.popularity?.firstSearchedAt || null,
      lastSearchedAt: word.popularity?.lastSearchedAt || null
    })),
    currentPage,
    totalPages: Math.max(1, Math.ceil(totalRecords / pageLimit)),
    totalRecords,
    limit: pageLimit
  };
}

export async function getPopularSearchSummary() {
  const [summary] = await Word.aggregate([
    {
      $match: {
        ...activeWordFilter,
        "popularity.searchCount": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalSuccessfulSearches: { $sum: "$popularity.searchCount" },
        popularWordsTracked: { $sum: 1 }
      }
    }
  ]);

  return {
    totalSuccessfulSearches: summary?.totalSuccessfulSearches || 0,
    popularWordsTracked: summary?.popularWordsTracked || 0
  };
}

function normalizeText(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
