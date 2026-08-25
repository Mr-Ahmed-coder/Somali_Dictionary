import { createWordSuggestion } from "../services/wordSuggestion.service.js";
import { wordSuggestionCreateSchema } from "../validators/wordSuggestion.schema.js";

export async function submitWordSuggestion(req, res) {
  const payload = wordSuggestionCreateSchema.parse(req.body);
  await createWordSuggestion(payload);

  return res.status(201).json({
    success: true,
    message: "Suggestion submitted for review."
  });
}
