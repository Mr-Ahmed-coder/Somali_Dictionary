import { Category } from "../models/category.model.js";
import { Word } from "../models/word.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { adminLoginSchema } from "../validators/admin.schema.js";

export async function login(req, res, next) {
  const { apiKey } = adminLoginSchema.parse(req.body);

  if (apiKey !== env.ADMIN_API_KEY) {
    return next(new ApiError(401, "Invalid admin credentials"));
  }

  return res.json({
    admin: {
      role: "admin",
      authenticated: true
    },
    token: apiKey
  });
}

export async function me(_req, res) {
  return res.json({
    admin: {
      role: "admin",
      authenticated: true
    }
  });
}

export async function getStats(_req, res) {
  const [totalWords, publishedWords, draftWords, archivedWords, categoryCount, latestWords, popularWords] =
    await Promise.all([
      Word.countDocuments({ "sync.isDeleted": false }),
      Word.countDocuments({ status: "published", "sync.isDeleted": false }),
      Word.countDocuments({ status: "draft", "sync.isDeleted": false }),
      Word.countDocuments({ $or: [{ status: "archived" }, { "sync.isDeleted": true }] }),
      Category.countDocuments({ isActive: true }),
      Word.find({ "sync.isDeleted": false }).sort({ createdAt: -1 }).limit(5).select("englishWord somaliWord createdAt"),
      Word.find({ status: "published", "sync.isDeleted": false })
        .sort({ "popularity.score": -1, "popularity.searchCount": -1 })
        .limit(5)
        .select("englishWord somaliWord popularity")
    ]);

  return res.json({
    totals: {
      words: totalWords,
      published: publishedWords,
      drafts: draftWords,
      archived: archivedWords,
      categories: categoryCount
    },
    latestWords,
    popularWords
  });
}
