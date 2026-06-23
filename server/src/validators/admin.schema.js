import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Valid admin email is required"),
  password: z.string().min(8, "Admin password is required")
});
