import jwt from "jsonwebtoken";
import { Category } from "../models/category.model.js";
import { Word } from "../models/word.model.js";
import { Admin } from "../models/admin.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { adminLoginSchema } from "../validators/admin.schema.js";

export async function login(req, res, next) {
  const { email, password } = adminLoginSchema.parse(req.body);
  const admin = await Admin.findOne({ email: email.toLowerCase(), role: "admin", isActive: true }).select("+passwordHash");

  if (!admin || !(await admin.comparePassword(password))) {
    return next(new ApiError(401, "Invalid admin credentials"));
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = jwt.sign(
    {
      role: admin.role,
      email: admin.email
    },
    env.JWT_SECRET,
    {
      subject: admin._id.toString(),
      expiresIn: env.JWT_EXPIRES_IN
    }
  );

  return res.json({
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: "admin",
      authenticated: true
    },
    token
  });
}

export async function me(req, res) {
  return res.json({
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      authenticated: true
    }
  });
}

export async function getStats(_req, res) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalWords,
    publishedWords,
    draftWords,
    archivedWords,
    categoryCount,
    recentlyAddedToday,
    wordTypes,
    alphabetCounts,
    categoryCounts,
    latestWords,
    popularWords
  ] =
    await Promise.all([
      Word.countDocuments({ "sync.isDeleted": false }),
      Word.countDocuments({ status: "published", "sync.isDeleted": false }),
      Word.countDocuments({ status: "draft", "sync.isDeleted": false }),
      Word.countDocuments({ $or: [{ status: "archived" }, { "sync.isDeleted": true }] }),
      Category.countDocuments({ isActive: true }),
      Word.countDocuments({ createdAt: { $gte: today }, "sync.isDeleted": false }),
      Word.distinct("partOfSpeech", { "sync.isDeleted": false }),
      Word.aggregate([
        { $match: { "sync.isDeleted": false, letter: { $ne: "" } } },
        { $group: { _id: "$letter", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Word.aggregate([
        { $match: { "sync.isDeleted": false, category: { $ne: null } } },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),
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
      categories: categoryCount,
      wordTypes: wordTypes.length,
      recentlyAddedToday,
      alphabetGroups: alphabetCounts.length
    },
    alphabetCounts: alphabetCounts.map((item) => ({ letter: item._id, count: item.count })),
    categoryCounts: categoryCounts.map((item) => ({ category: item._id, count: item.count })),
    latestWords,
    popularWords
  });
}
