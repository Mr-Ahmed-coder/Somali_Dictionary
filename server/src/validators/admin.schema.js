import { z } from "zod";

export const adminLoginSchema = z.object({
  apiKey: z.string().trim().min(12, "Admin key is required")
});
