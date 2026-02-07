import { z } from "zod";

export const medicationListQuerySchema = z.object({
  schedule: z.enum(["II", "III", "IV", "V"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const medicationSlugParamSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});
