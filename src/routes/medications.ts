import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  medicationListQuerySchema,
  medicationSlugParamSchema,
} from "../schemas/medication.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", async (req, res) => {
  const { schedule, limit, page } = medicationListQuerySchema.parse(req.query);

  const where = schedule ? { schedule } : {};
  const skip = (page - 1) * limit;

  const data = await prisma.medication.findMany({
    where,
    skip,
    take: limit,
    orderBy: { name: "asc" }
  })

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

router.get("/:slug", async (req, res) => {
  const { slug } = medicationSlugParamSchema.parse(req.params);

  const data = await prisma.medication.findUnique({
    where: { slug },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          nurse: { select: { id: true, name: true, email: true } },
          witness: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!data) {
    throw new AppError(404, "Medication not found");
  }

  res.json({ data });
});

export default router;
