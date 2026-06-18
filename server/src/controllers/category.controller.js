import { Category } from "../models/category.model.js";
import { Word } from "../models/word.model.js";
import { ApiError } from "../utils/apiError.js";
import { categoryCreateSchema, categoryUpdateSchema } from "../validators/category.schema.js";

const browseCategories = [
  "Education",
  "Medical",
  "Technology",
  "Food",
  "Animals",
  "Family",
  "Business",
  "Travel",
  "Sports",
  "General"
];

const categoryDescriptions = {
  Education: "School, learning, and academic vocabulary.",
  Medical: "Healthcare, symptoms, and medical vocabulary.",
  Technology: "Digital tools, devices, and technical terms.",
  Food: "Meals, ingredients, and everyday food words.",
  Animals: "Animals, nature, and living things.",
  Family: "Family relationships and household words.",
  Business: "Work, finance, and professional vocabulary.",
  Travel: "Transport, directions, and travel phrases.",
  Sports: "Games, fitness, and sports vocabulary.",
  General: "Common words used in everyday conversation."
};

export async function getCategories(_req, res) {
  const dbCategories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  const counts = await Word.aggregate([
    { $match: { status: "published", "sync.isDeleted": false, category: { $ne: null } } },
    { $group: { _id: "$category", wordCount: { $sum: 1 } } }
  ]);
  const countByCategory = new Map(counts.map((item) => [item._id.toString(), item.wordCount]));
  const byName = new Map(dbCategories.map((category) => [category.name.toLowerCase(), category]));
  const merged = [...dbCategories];

  browseCategories.forEach((name) => {
    if (!byName.has(name.toLowerCase())) {
      merged.push({
        _id: `virtual-${slugifyName(name)}`,
        name,
        slug: slugifyName(name),
        description: categoryDescriptions[name] || "",
        isActive: true,
        virtual: true
      });
    }
  });

  const items = merged
    .map((category) => ({
      ...category,
      description: category.description || categoryDescriptions[category.name] || "",
      wordCount: category.virtual ? 0 : countByCategory.get(category._id.toString()) || 0
    }))
    .sort((a, b) => browseSort(a.name) - browseSort(b.name) || a.name.localeCompare(b.name));

  res.json({ items });
}

export async function getCategory(req, res, next) {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true });

  if (!category) {
    const virtualName = browseCategories.find((name) => slugifyName(name) === req.params.slug);

    if (virtualName) {
      return res.json({
        item: {
          _id: `virtual-${req.params.slug}`,
          name: virtualName,
          slug: req.params.slug,
          description: categoryDescriptions[virtualName] || "",
          wordCount: 0,
          virtual: true
        },
        words: []
      });
    }

    return next(new ApiError(404, "Category not found"));
  }

  const words = await Word.find({
    category: category._id,
    status: "published",
    "sync.isDeleted": false
  })
    .populate("category", "name slug")
    .sort({ normalizedEnglish: 1 });
  return res.json({ item: { ...category.toObject(), wordCount: words.length }, words });
}

export async function createCategory(req, res) {
  const payload = categoryCreateSchema.parse(req.body);
  const category = await Category.create(payload);
  res.status(201).json({ item: category });
}

export async function updateCategory(req, res, next) {
  const payload = categoryUpdateSchema.parse(req.body);
  const category = await Category.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new ApiError(404, "Category not found"));
  }

  return res.json({ item: category });
}

export async function deleteCategory(req, res, next) {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new ApiError(404, "Category not found"));
  }

  return res.status(204).send();
}

function slugifyName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function browseSort(name) {
  const index = browseCategories.findIndex((category) => category.toLowerCase() === name.toLowerCase());
  return index === -1 ? browseCategories.length : index;
}
