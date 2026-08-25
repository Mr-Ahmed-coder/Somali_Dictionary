import {
  convertApprovedSuggestion,
  getWordSuggestionById,
  listWordSuggestions,
  moderateWordSuggestion
} from "../services/wordSuggestion.service.js";
import { wordCreateSchema } from "../validators/word.schema.js";
import {
  wordSuggestionAdminListSchema,
  wordSuggestionConversionSchema,
  wordSuggestionStatusSchema
} from "../validators/wordSuggestion.schema.js";

export async function getAdminWordSuggestions(req, res) {
  const query = wordSuggestionAdminListSchema.parse(req.query);
  const result = await listWordSuggestions(query);
  return res.json({ success: true, ...result });
}

export async function getAdminWordSuggestion(req, res) {
  const suggestion = await getWordSuggestionById(req.params.id);
  return res.json({ success: true, suggestion });
}

export async function updateAdminWordSuggestionStatus(req, res) {
  const { status } = wordSuggestionStatusSchema.parse(req.body);
  const suggestion = await moderateWordSuggestion({
    id: req.params.id,
    status,
    adminId: req.admin._id
  });

  return res.json({
    success: true,
    message: status === "approved" ? "Suggestion approved." : "Suggestion rejected.",
    suggestion
  });
}

export async function createWordFromSuggestion(req, res) {
  const input = wordSuggestionConversionSchema.parse(req.body);
  const wordPayload = wordCreateSchema.parse({
    englishWord: input.english,
    somaliWord: input.somali,
    partOfSpeech: input.type,
    category: input.category,
    status: "published",
    source: "human"
  });
  const result = await convertApprovedSuggestion({
    id: req.params.id,
    wordPayload,
    adminId: req.admin._id
  });

  return res.status(201).json({
    success: true,
    message: "Word added to dictionary successfully.",
    ...result
  });
}
