import { z } from "zod";

export const createTransactionSchema = z
  .object({
    medicationId: z.uuid("Invalid medication ID format"),
    nurseId: z.uuid("Invalid nurse ID format"),
    witnessId: z.uuid("Invalid witness ID format"),
    type: z.enum(["CHECKOUT", "RETURN", "WASTE"]),
    quantity: z.number().positive("Quantity must be a positive number"),
    notes: z.string().optional(),
  })
  .refine((data) => data.nurseId !== data.witnessId, {
    message: "Witness must be a different person than the nurse",
    path: ["witnessId"],
  })
  .refine(
    (data) => {
      if (data.type === "WASTE" && (!data.notes || data.notes.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Notes are required for WASTE transactions",
      path: ["notes"],
    },
  );

export const transactionListQuerySchema = z.object({
  type: z.enum(["CHECKOUT", "RETURN", "WASTE"]).optional(),
  medicationId: z.uuid("Invalid medication ID format").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
