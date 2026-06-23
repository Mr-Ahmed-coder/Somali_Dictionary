import {
  createWord as createWordRecord,
  deleteWordById,
  getWordSuggestions,
  getWordById,
  listWordsByCategory,
  listWords,
  replaceWord,
  searchWords,
  updateWordById
} from "../services/word.service.js";
import { searchSchema, suggestionSchema, wordCreateSchema, wordListSchema, wordUpdateSchema } from "../validators/word.schema.js";

export async function getWords(req, res) {
  const query = wordListSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";

  if (!isAdminRequest) {
    query.status = "published";
  }

  const result = await listWords(query);
  res.json({
    success: true,
    count: result.items.length,
    words: result.items,
    items: result.items,
    pagination: result.pagination
  });
}

export async function search(req, res) {
  const query = searchSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";
  const result = await searchWords({ ...query, includeDrafts: isAdminRequest });
  res.json(result);
}

export async function suggestions(req, res) {
  const query = suggestionSchema.parse(req.query);
  const isAdminRequest = req.admin?.role === "admin";
  const result = await getWordSuggestions({ ...query, includeDrafts: isAdminRequest });
  res.json(result);
}

export async function getWord(req, res) {
  const word = await getWordById(req.params.id);
  return res.json({ item: word });
}

export async function getWordsByCategory(req, res) {
  const result = await listWordsByCategory(req.params.category);
  return res.json({
    success: true,
    category: result.category,
    count: result.count,
    words: result.words,
    items: result.words
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
