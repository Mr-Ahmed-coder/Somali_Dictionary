import {
  getPublishedWordById,
  listPublishedWordsByExactTerm,
  listWords,
  searchWords
} from "../services/word.service.js";
import {
  getActiveCategoryBySlug,
  getPublicCategoryBySlug,
  listPublicCategories
} from "../services/category.service.js";
import {
  toV1CategoryDto,
  toV1EntryDto,
  toV1EntryDtos,
  toV1Pagination
} from "../serializers/v1.serializer.js";
import {
  v1CategoryListQuerySchema,
  v1CategoryParamsSchema,
  v1EntryListQuerySchema,
  v1EntryParamsSchema,
  v1SearchQuerySchema,
  v1TermParamsSchema,
  v1TermQuerySchema
} from "../validators/v1.schema.js";
import { ApiError } from "../utils/apiError.js";

const searchDirections = {
  auto: "auto",
  en: "english-to-somali",
  so: "somali-to-english"
};

const listSorts = {
  english_asc: "v1-english-asc",
  english_desc: "v1-english-desc",
  newest: "v1-newest",
  oldest: "v1-oldest"
};

export async function searchV1(req, res) {
  const query = v1SearchQuerySchema.parse(req.query);
  const result = await searchWords({
    q: query.q,
    direction: searchDirections[query.language],
    page: query.page,
    limit: query.limit,
    includeDrafts: false,
    stableSort: true,
    status: "published"
  });

  return sendCollection(res, req, toV1EntryDtos(result.items), result.pagination);
}

export async function listEntriesV1(req, res) {
  const query = v1EntryListQuerySchema.parse(req.query);
  const category = query.category
    ? await getActiveCategoryBySlug(query.category)
    : null;
  const result = await listWords({
    page: query.page,
    limit: query.limit,
    letter: query.letter,
    category: category?._id,
    partOfSpeech: query.partOfSpeech,
    sort: listSorts[query.sort],
    status: "published"
  });

  return sendCollection(res, req, toV1EntryDtos(result.items), result.pagination);
}

export async function getEntryV1(req, res) {
  const { id } = v1EntryParamsSchema.parse(req.params);
  let word;

  try {
    word = await getPublishedWordById(id);
  } catch (error) {
    if (error?.statusCode === 404) {
      throw new ApiError(404, "Dictionary entry not found");
    }
    throw error;
  }

  return sendResource(res, req, toV1EntryDto(word));
}

export async function listTermEntriesV1(req, res) {
  const { term } = v1TermParamsSchema.parse(req.params);
  const pagination = v1TermQuerySchema.parse(req.query);
  const result = await listPublishedWordsByExactTerm(term, pagination);

  return sendCollection(res, req, toV1EntryDtos(result.items), result.pagination);
}

export async function listCategoriesV1(req, res) {
  const query = v1CategoryListQuerySchema.parse(req.query);
  const result = await listPublicCategories(query);
  const items = result.items.map(({ category, wordCount }) =>
    toV1CategoryDto(category, { wordCount })
  );

  return sendCollection(res, req, items, result.pagination);
}

export async function getCategoryV1(req, res) {
  const { slug } = v1CategoryParamsSchema.parse(req.params);
  const { category, wordCount } = await getPublicCategoryBySlug(slug);

  return sendResource(res, req, toV1CategoryDto(category, { wordCount }));
}

function sendResource(res, req, data) {
  return res.json({
    success: true,
    data,
    meta: { requestId: req.id }
  });
}

function sendCollection(res, req, data, pagination) {
  return res.json({
    success: true,
    data,
    pagination: toV1Pagination(pagination),
    meta: { requestId: req.id }
  });
}
