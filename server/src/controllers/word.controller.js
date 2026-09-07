import {
  createWord as createWordRecord,
  deleteWordById,
  findWordOfTheDay,
  getWordSuggestions,
  getWordById,
  getPublishedWordById,
  getPublishedWordByIdentifier,
  listSeoWords,
  listWordsByCategory,
  listWords,
  replaceWord,
  searchWords,
  updateWordById
} from "../services/word.service.js";
import {
  searchSchema,
  seoWordListSchema,
  suggestionSchema,
  wordCreateSchema,
  wordListSchema,
  wordLookupSchema,
  wordOfTheDaySchema,
  wordUpdateSchema
} from "../validators/word.schema.js";
import {
  toPublicCategoryDto,
  toPublicWordDto,
  toPublicWordDtos
} from "../serializers/publicWord.serializer.js";
import { categoryWordListSchema } from "../validators/category.schema.js";
import { ApiError } from "../utils/apiError.js";

export async function getWords(req, res) {
  const query = wordListSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";

  if (!isAdminRequest) {
    query.status = "published";
  }

  const result = await listWords(query);
  const items = isAdminRequest ? result.items : toPublicWordDtos(result.items);
  res.json({
    success: true,
    count: items.length,
    words: items,
    items,
    pagination: result.pagination
  });
}

export async function getWordOfTheDay(req, res) {
  const { date } = wordOfTheDaySchema.parse(req.query);
  const word = await findWordOfTheDay(date);

  res.set("Cache-Control", "public, max-age=300, s-maxage=3600");
  return res.json({ success: true, word });
}

export async function search(req, res) {
  const query = searchSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";
  const result = await searchWords({ ...query, includeDrafts: isAdminRequest });
  return res.json({
    ...result,
    items: isAdminRequest ? result.items : toPublicWordDtos(result.items)
  });
}

export async function suggestions(req, res) {
  const query = suggestionSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";
  const result = await getWordSuggestions({ ...query, includeDrafts: isAdminRequest });
  res.json(result);
}

export async function getWord(req, res) {
  const word = await getPublishedWordById(req.params.id);
  return res.json({ item: toPublicWordDto(word) });
}

export async function getAdminWord(req, res) {
  const word = await getWordById(req.params.id);
  return res.json({ item: word });
}

export async function getWordLookup(req, res) {
  const { identifier } = wordLookupSchema.parse(req.params);
  const word = await getPublishedWordByIdentifier(identifier);

  if (!word) {
    throw new ApiError(404, "Word not found");
  }

  res.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
  return res.json({ item: toPublicWordDto(word) });
}

export async function getSeoWords(req, res) {
  const query = seoWordListSchema.parse(req.query);
  const result = await listSeoWords(query);

  res.set("Cache-Control", "private, no-store");
  return res.json({ success: true, items: result.items, pagination: result.pagination });
}

export async function getWordsByCategory(req, res) {
  const pagination = categoryWordListSchema.parse(req.query);
  const result = await listWordsByCategory(req.params.category, pagination);
  const words = toPublicWordDtos(result.words);
  return res.json({
    success: true,
    category: result.category ? toPublicCategoryDto(result.category, { wordCount: result.count }) : null,
    count: result.count,
    words,
    items: words,
    pagination: result.pagination
  });
}

export async function createWord(req, res) {
  const payload = wordCreateSchema.parse(req.body);
  const word = await createWordRecord(payload);
  res.status(201).json({ item: word });
}

export async function putWord(req, res) {
  const payload = wordCreateSchema.parse(req.body);
  const word = await replaceWord(req.params.id, payload);
  return res.json({ item: word });
}

export async function updateWord(req, res) {
  const payload = wordUpdateSchema.parse(req.body);
  const word = await updateWordById(req.params.id, payload);
  return res.json({ item: word });
}

export async function deleteWord(req, res) {
  await deleteWordById(req.params.id);
  return res.status(204).send();
}
