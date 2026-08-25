import { z } from "zod";
import { cleanSuggestionText } from "../utils/wordSuggestion.js";
import { objectIdSchema, partOfSpeechSchema, wordCreateSchema } from "./word.schema.js";

const suggestionTypes = ["noun", "verb", "adjective", "adverb", "phrase", "other"];

const requiredWord = (label) =>
  z
    .string({ required_error: `${label} is required` })
    .transform(cleanSuggestionText)
    .pipe(
      z
        .string()
        .min(2, `${label} must contain at least 2 characters`)
        .max(120, `${label} cannot exceed 120 characters`)
        .regex(/\p{L}/u, `${label} must contain at least one letter`)
        .refine((value) => !/[<>]/.test(value), `${label} cannot contain HTML`)
        .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), `${label} contains invalid characters`)
    );

const optionalNote = z
  .string()
  .transform(cleanSuggestionText)
  .pipe(
    z
      .string()
      .max(500, "Note cannot exceed 500 characters")
      .refine((value) => !/[<>]/.test(value), "Note cannot contain HTML")
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Note contains invalid characters")
  )
  .optional()
  .default("");

export const wordSuggestionCreateSchema = z
  .object({
    english: requiredWord("English word"),
    somali: requiredWord("Somali translation"),
    type: z.enum(suggestionTypes).optional().default("other"),
    note: optionalNote
  })
  .strict();

export const wordSuggestionAdminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().transform(cleanSuggestionText).pipe(z.string().max(120)).optional().default(""),
  status: z.enum(["all", "pending", "approved", "rejected"]).default("pending"),
  type: z.enum(["all", ...suggestionTypes]).default("all"),
  sort: z.enum(["newest", "oldest"]).default("newest")
});

export const wordSuggestionStatusSchema = z
  .object({
    status: z.enum(["approved", "rejected"])
  })
  .strict();

export const wordSuggestionConversionSchema = z
  .object({
    english: wordCreateSchema.shape.englishWord,
    somali: wordCreateSchema.shape.somaliWord,
    type: partOfSpeechSchema,
    category: objectIdSchema
  })
  .strict();
