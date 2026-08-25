import { z } from "zod";

const missingQuerySchema = z
  .string()
  .transform(collapseWhitespace)
  .pipe(
    z
      .string()
      .min(2, "Search query must contain at least 2 characters")
      .max(120, "Search query cannot exceed 120 characters")
      .regex(/\p{L}/u, "Search query must contain at least one letter")
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Search query contains invalid characters")
  );

export const missingSearchCreateSchema = z.object({ query: missingQuerySchema });

export const missingSearchListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().transform(collapseWhitespace).pipe(z.string().max(120)).optional().default(""),
  status: z.enum(["all", "missing", "resolved"]).default("all"),
  sort: z
    .enum(["most-searched", "least-searched", "most-recent", "oldest", "a-z", "z-a"])
    .default("most-searched")
});

function collapseWhitespace(value) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}
