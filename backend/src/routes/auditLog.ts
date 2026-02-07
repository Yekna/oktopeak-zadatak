import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auditLogListQuerySchema } from "../schemas/auditLog.js";

const router = Router();

router.get("/", async (req, res) => {
  const { entityType, page, limit } = auditLogListQuerySchema.parse(req.query);

  const where = entityType ? { entityType } : {};
  const skip = (page - 1) * limit;

  const data = await prisma.auditLog.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      performedBy: { select: { id: true, name: true, email: true } },
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
