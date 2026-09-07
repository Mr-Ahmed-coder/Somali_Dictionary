import { Category } from "../models/category.model.js";
import { Word } from "../models/word.model.js";
import { ApiError } from "../utils/apiError.js";

const publishedWordFilter = {
  status: "published",
  "sync.isDeleted": false
};

export async function listPublicCategories({ page = 1, limit = 50 }) {
  const skip = (Number(page) - 1) * Number(limit);
  const [categories, total] = await Promise.all([
    Category.find({ isActive: true })
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Category.countDocuments({ isActive: true })
  ]);

  const categoryIds = categories.map((category) => category._id);
  const counts = categoryIds.length
    ? await Word.aggregate([
        {
          $match: {
            ...publishedWordFilter,
            category: { $in: categoryIds }
          }
        },
        { $group: { _id: "$category", wordCount: { $sum: 1 } } }
      ])
    : [];
  const countByCategory = new Map(
    counts.map((item) => [String(item._id), Number(item.wordCount)])
  );

  return {
    items: categories.map((category) => ({
      category,
      wordCount: countByCategory.get(String(category._id)) || 0
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  };
}

export async function getActiveCategoryBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
}

export async function getPublicCategoryBySlug(slug) {
  const category = await getActiveCategoryBySlug(slug);
  const wordCount = await Word.countDocuments({
    ...publishedWordFilter,
    category: category._id
  });

  return { category, wordCount };
}
