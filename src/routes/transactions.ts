import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  createTransactionSchema,
  transactionListQuerySchema,
} from "../schemas/transaction.js";
import { AppError } from "../middleware/errorHandler.js";
import { TransactionWhereInput } from "../../generated/prisma/models.js";

const router = Router();

router.post("/", async (req, res) => {
  const { medicationId, nurseId, quantity, type, witnessId, notes } =
    createTransactionSchema.parse(req.body);

  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
  });
  if (!medication) {
    throw new AppError(404, "Medication not found");
  }

  const nurse = await prisma.user.findUnique({
    where: { id: nurseId },
  });
  if (!nurse) {
    throw new AppError(404, "Nurse not found");
  }

  const witness = await prisma.user.findUnique({
    where: { id: witnessId },
  });
  if (!witness) {
    throw new AppError(404, "Witness not found");
  }

  if (type === "CHECKOUT" && medication.stockQuantity < quantity) {
    throw new AppError(
      400,
      `Insufficient stock. Available: ${medication.stockQuantity} ${medication.unit}`,
    );
  }

  const data = await prisma.$transaction(async (tx) => {
    if (type === "CHECKOUT") {
      await tx.medication.update({
        where: { id: medicationId },
        data: { stockQuantity: { decrement: quantity } },
      });
    } else if (type === "RETURN") {
      await tx.medication.update({
        where: { id: medicationId },
        data: { stockQuantity: { increment: quantity } },
      });
    }

    const transaction = await tx.transaction.create({
      data: {
        medicationId,
        nurseId,
        witnessId,
        type,
        quantity,
        notes,
      },
      include: {
        medication: true,
        nurse: { select: { id: true, name: true, email: true } },
        witness: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.auditLog.create({
      data: {
        action: `TRANSACTION_${type}`,
        entityType: "Transaction",
        entityId: transaction.id,
        performedById: nurseId,
        details: {
          transactionType: type,
          medicationId,
          medicationName: medication.name,
          quantity,
          unit: medication.unit,
          witnessId: witnessId,
          notes: notes || null,
        },
      },
    });

    return transaction;
  });

  res.status(201).json({ data });
});

router.get("/", async (req, res) => {
  const { limit, page, medicationId, type } = transactionListQuerySchema.parse(
    req.query,
  );

  const where: TransactionWhereInput = {};
  if (type) where.type = type;
  if (medicationId) where.medicationId = medicationId;

  const skip = (page - 1) * limit;

  const data = await prisma.transaction.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      medication: true,
      nurse: { select: { id: true, name: true, email: true } },
      witness: { select: { id: true, name: true, email: true } },
    },
  });

  const total = data.length;

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export default router;
