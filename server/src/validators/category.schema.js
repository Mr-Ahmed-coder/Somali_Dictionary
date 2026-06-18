import { z } from "zod";

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  isActive: z.boolean().default(true)
});

export const categoryUpdateSchema = categoryCreateSchema.partial();
