import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid word identifier");

export const popularSearchCreateSchema = z
  .object({
    wordId: objectIdSchema
  })
  .strict();

export const popularSearchListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().transform(collapseWhitespace).pipe(z.string().max(120)).optional().default(""),
  sort: z
    .enum(["most-searched", "least-searched", "most-recent", "oldest", "a-z", "z-a"])
    .default("most-searched")
});

function collapseWhitespace(value) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}
