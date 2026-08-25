import {
  incrementPopularSearch,
  listPopularSearches
} from "../services/popularSearch.service.js";
import {
  popularSearchCreateSchema,
  popularSearchListSchema
} from "../validators/popularSearch.schema.js";

export async function trackPopularSearch(req, res) {
  const { wordId } = popularSearchCreateSchema.parse(req.body);
  await incrementPopularSearch(wordId);
  return res.status(204).send();
}

export async function getPopularSearches(req, res) {
  const query = popularSearchListSchema.parse(req.query);
  const result = await listPopularSearches(query);
  return res.json(result);
}
