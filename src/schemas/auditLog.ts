import { z } from "zod";

export const auditLogListQuerySchema = z.object({
  entityType: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
