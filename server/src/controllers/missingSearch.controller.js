import {
  listMissingSearches,
  recordMissingSearch,
  setMissingSearchResolution
} from "../services/missingSearch.service.js";
import {
  missingSearchCreateSchema,
  missingSearchListSchema
} from "../validators/missingSearch.schema.js";

export async function trackMissingSearch(req, res) {
  const { query } = missingSearchCreateSchema.parse(req.body);
  await recordMissingSearch(query);
  return res.status(202).json({ success: true });
}

export async function getMissingSearches(req, res) {
  const filters = missingSearchListSchema.parse(req.query);
  const result = await listMissingSearches(filters);
  return res.json({ success: true, ...result });
}

export async function resolveMissingSearch(req, res) {
  const record = await setMissingSearchResolution(req.params.id, true);
  return res.json({ success: true, record });
}

export async function reopenMissingSearch(req, res) {
  const record = await setMissingSearchResolution(req.params.id, false);
  return res.json({ success: true, record });
}
