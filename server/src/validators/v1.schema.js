import { z } from "zod";
import { objectIdSchema, partOfSpeechSchema } from "./word.schema.js";

const pageSchema = z.coerce.number().int().min(1).default(1);
const searchLimitSchema = z.coerce.number().int().min(1).max(50).default(20);
const entryLimitSchema = z.coerce.number().int().min(1).max(100).default(20);
const categoryLimitSchema = z.coerce.number().int().min(1).max(100).default(50);
const categorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug");

export const v1SearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(160),
    language: z.enum(["auto", "en", "so"]).default("auto"),
    page: pageSchema,
    limit: searchLimitSchema
  })
  .strict();

export const v1EntryListQuerySchema = z
  .object({
    page: pageSchema,
    limit: entryLimitSchema,
    letter: z.string().trim().regex(/^[a-zA-Z]$/, "Letter must be A-Z").optional(),
    category: categorySlugSchema.optional(),
    partOfSpeech: partOfSpeechSchema.optional(),
    sort: z.enum(["english_asc", "english_desc", "newest", "oldest"]).default("english_asc")
  })
  .strict();

export const v1EntryParamsSchema = z.object({ id: objectIdSchema }).strict();

export const v1TermParamsSchema = z
  .object({ term: z.string().trim().min(1).max(160) })
  .strict();

export const v1TermQuerySchema = z
  .object({
    page: pageSchema,
    limit: searchLimitSchema
  })
  .strict();

export const v1CategoryListQuerySchema = z
  .object({
    page: pageSchema,
    limit: categoryLimitSchema
  })
  .strict();

export const v1CategoryParamsSchema = z.object({ slug: categorySlugSchema }).strict();
