import { Word } from "../models/word.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/apiError.js";

const directionFields = {
  "english-to-somali": "normalizedEnglish",
  "somali-to-english": "normalizedSomali"
};

const sortStrategies = {
  alphabetical: { normalizedEnglish: 1 },
  popular: { "popularity.score": -1, normalizedEnglish: 1 },
  newest: { createdAt: -1 },
  updated: { updatedAt: -1, createdAt: -1 }
};

export async function listWords({ page = 1, limit = 24, category, status = "published", partOfSpeech, sort = "newest" }) {
  const query = { "sync.isDeleted": false };

  if (status !== "all") {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (partOfSpeech) {
    query.partOfSpeech = partOfSpeech;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortBy = sortStrategies[sort] || sortStrategies.newest;
  const [items, total] = await Promise.all([
    Word.find(query)
      .populate("category", "name slug")
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit)),
    Word.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
}

export async function searchWords({
  q,
  direction,
  page = 1,
  limit,
  includeDrafts = false,
  category,
  status = "published",
  partOfSpeech
}) {
  const normalized = normalizeText(q);
  const categoryIds = await findMatchingCategoryIds(normalized);
  const matchingPartsOfSpeech = findMatchingPartsOfSpeech(normalized);
  const field = directionFields[direction];
  const baseQuery = includeDrafts ? { "sync.isDeleted": false } : { status: "published", "sync.isDeleted": false };

  if (includeDrafts && status !== "all") {
    baseQuery.status = status;
  }

  if (category) {
    baseQuery.category = category;
  }

  if (partOfSpeech) {
    baseQuery.partOfSpeech = partOfSpeech;
  }

  const query = buildSearchQuery({ baseQuery, field, normalized, categoryIds, matchingPartsOfSpeech });

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Word.aggregate([
      { $match: query },
      {
        $addFields: {
          searchRank: {
            $switch: {
              branches: [
                { case: { $eq: ["$normalizedEnglish", normalized] }, then: 100 },
                { case: { $eq: ["$normalizedSomali", normalized] }, then: 100 },
                { case: { $regexMatch: { input: "$normalizedEnglish", regex: `^${escapeRegExp(normalized)}` } }, then: 80 },
                { case: { $regexMatch: { input: "$normalizedSomali", regex: `^${escapeRegExp(normalized)}` } }, then: 80 },
                { case: { $in: ["$partOfSpeech", matchingPartsOfSpeech] }, then: 60 },
                { case: { $in: ["$category", categoryIds] }, then: 50 }
              ],
              default: 20
            }
          }
        }
      },
      { $sort: { searchRank: -1, "popularity.score": -1, normalizedEnglish: 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
    ]),
    Word.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getWordSuggestions({ q, limit = 8, includeDrafts = false }) {
  const normalized = normalizeText(q);
  const categoryIds = await findMatchingCategoryIds(normalized);
  const matchingPartsOfSpeech = findMatchingPartsOfSpeech(normalized);
  const baseQuery = includeDrafts ? { "sync.isDeleted": false } : { status: "published", "sync.isDeleted": false };
  const query = buildSearchQuery({ baseQuery, normalized, categoryIds, matchingPartsOfSpeech });

  const words = await Word.aggregate([
    { $match: query },
    ...buildSearchRankStages({ normalized, categoryIds, matchingPartsOfSpeech }),
    { $sort: { searchRank: -1, "popularity.score": -1, normalizedEnglish: 1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } }
  ]);

  const suggestions = words.map((word) => ({
    id: word._id,
    type: "word",
    label: `${word.englishWord} - ${word.somaliWord}`,
    englishWord: word.englishWord,
    somaliWord: word.somaliWord,
    partOfSpeech: word.partOfSpeech,
    category: word.category
  }));

  return {
    success: true,
    query: q.trim(),
    count: suggestions.length,
    suggestions
  };
}

export async function listWordsByCategory(categoryValue) {
  const category = await Category.findOne({
    isActive: true,
    $or: [
      { slug: categoryValue },
      { name: new RegExp(`^${escapeRegExp(categoryValue)}$`, "i") }
    ]
  });

  if (!category) {
    return {
      category: null,
      count: 0,
      words: []
    };
  }

  const words = await Word.find({
    category: category._id,
    status: "published",
    "sync.isDeleted": false
  })
    .populate("category", "name slug")
    .sort({ normalizedEnglish: 1 });

  return {
    category,
    count: words.length,
    words
  };
}

export async function getWordById(id) {
  const word = await Word.findOne({ _id: id, "sync.isDeleted": false }).populate("category", "name slug");

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  return word;
}

export async function createWord(payload) {
  if (payload.category) {
    await assertCategoryExists(payload.category);
  }
  return Word.create(payload);
}

export async function replaceWord(id, payload) {
  if (payload.category) {
    await assertCategoryExists(payload.category);
  }

  const word = await Word.findOne({ _id: id, "sync.isDeleted": false });

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  word.set(payload);
  await word.save();
  return word.populate("category", "name slug");
}

export async function updateWordById(id, payload) {
  if (payload.category) {
    await assertCategoryExists(payload.category);
  }

  const word = await Word.findOne({ _id: id, "sync.isDeleted": false });

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  word.set(payload);
  await word.save();
  return word.populate("category", "name slug");
}

export async function deleteWordById(id) {
  const word = await Word.findOne({ _id: id, "sync.isDeleted": false });

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  word.status = "archived";
  word.sync.isDeleted = true;
  word.sync.deletedAt = new Date();
  await word.save();
}

async function assertCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId, isActive: true });

  if (!exists) {
    throw new ApiError(400, "Category does not exist or is inactive");
  }
}

function buildSearchQuery({ baseQuery, field, normalized, categoryIds = [], matchingPartsOfSpeech = [] }) {
  const escaped = escapeRegExp(normalized);

  if (field) {
    return {
      ...baseQuery,
      [field]: new RegExp(`^${escaped}`)
    };
  }

  const filters = [
    { normalizedEnglish: new RegExp(`^${escaped}`) },
    { normalizedSomali: new RegExp(`^${escaped}`) },
    { normalizedEnglish: new RegExp(escaped) },
    { normalizedSomali: new RegExp(escaped) },
    { searchKeywords: new RegExp(escaped, "i") }
  ];

  if (categoryIds.length > 0) {
    filters.push({ category: { $in: categoryIds } });
  }

  if (matchingPartsOfSpeech.length > 0) {
    filters.push({ partOfSpeech: { $in: matchingPartsOfSpeech } });
  }

  return {
    ...baseQuery,
    $or: filters
  };
}

function buildSearchRankStages({ normalized, categoryIds = [], matchingPartsOfSpeech = [] }) {
  return [
    {
      $addFields: {
        searchRank: {
          $switch: {
            branches: [
              { case: { $eq: ["$normalizedEnglish", normalized] }, then: 100 },
              { case: { $eq: ["$normalizedSomali", normalized] }, then: 100 },
              { case: { $regexMatch: { input: "$normalizedEnglish", regex: `^${escapeRegExp(normalized)}` } }, then: 80 },
              { case: { $regexMatch: { input: "$normalizedSomali", regex: `^${escapeRegExp(normalized)}` } }, then: 80 },
              { case: { $in: ["$partOfSpeech", matchingPartsOfSpeech] }, then: 60 },
              { case: { $in: ["$category", categoryIds] }, then: 50 }
            ],
            default: 20
          }
        }
      }
    }
  ];
}

async function findMatchingCategoryIds(normalized) {
  const escaped = escapeRegExp(normalized);
  const categories = await Category.find({
    isActive: true,
    $or: [
      { name: new RegExp(escaped, "i") },
      { slug: new RegExp(escaped, "i") }
    ]
  }).select("_id");

  return categories.map((category) => category._id);
}

function findMatchingPartsOfSpeech(normalized) {
  return [
    "noun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "pronoun",
    "conjunction",
    "interjection",
    "phrase",
    "other"
  ].filter((part) => part.includes(normalized));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}
