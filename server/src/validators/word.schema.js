import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
  "phrase",
  "other"
]);

export const wordCreateSchema = z.object({
  englishWord: z.string().trim().min(1).max(160),
  somaliWord: z.string().trim().min(1).max(160),
  partOfSpeech: partOfSpeechSchema.default("other"),
  englishDefinition: z.string().trim().max(2000).default(""),
  somaliDefinition: z.string().trim().max(2000).default(""),
  englishExample: z.string().trim().max(1000).default(""),
  somaliExample: z.string().trim().max(1000).default(""),
  category: objectIdSchema.optional(),
  letter: z.string().trim().max(10).default(""),
  searchKeywords: z.array(z.string().trim().toLowerCase()).default([]),
  aiTranslation: z
    .object({
      provider: z.string().trim().nullable().optional(),
      model: z.string().trim().nullable().optional(),
      confidence: z.number().min(0).max(1).nullable().optional(),
      reviewedByHuman: z.boolean().optional(),
      suggestedEnglish: z.string().trim().optional(),
      suggestedSomali: z.string().trim().optional(),
      generatedAt: z.coerce.date().nullable().optional()
    })
    .default({}),
  voiceTranslation: z
    .object({
      englishAudioUrl: z.string().trim().optional(),
      somaliAudioUrl: z.string().trim().optional(),
      englishPhonetic: z.string().trim().optional(),
      somaliPhonetic: z.string().trim().optional(),
      voiceProvider: z.string().trim().optional()
    })
    .default({}),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  source: z.enum(["human", "import", "ai-assisted"]).default("human")
});

export const wordUpdateSchema = wordCreateSchema.partial();

export const searchSchema = z.object({
  q: z.string().trim().min(1),
  direction: z.enum(["english-to-somali", "somali-to-english", "auto"]).default("auto"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: objectIdSchema.optional(),
  status: z.enum(["draft", "published", "archived", "all"]).default("published"),
  partOfSpeech: partOfSpeechSchema.optional()
});

export const suggestionSchema = z.object({
  q: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(12).default(8)
});

export const wordListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  category: objectIdSchema.optional(),
  status: z.enum(["draft", "published", "archived", "all"]).default("published"),
  partOfSpeech: partOfSpeechSchema.optional(),
  sort: z.enum(["alphabetical", "popular", "newest", "updated"]).default("newest")
});

export const wordParamsSchema = z.object({
  id: objectIdSchema
});
