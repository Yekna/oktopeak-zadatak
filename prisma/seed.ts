import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.user.deleteMany();

  const nurse = await prisma.user.create({
    data: {
      email: "nurse@hospital.com",
      name: "Jane Smith",
      role: "NURSE",
    },
  });

  const witness = await prisma.user.create({
    data: {
      email: "witness@hospital.com",
      name: "John Doe",
      role: "WITNESS",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@hospital.com",
      name: "Alice Johnson",
      role: "ADMIN",
    },
  });

  const medications = await Promise.all([
    prisma.medication.create({
      data: {
        name: "Morphine Sulfate",
        schedule: "II",
        unit: "mg",
        stockQuantity: 500,
        slug: "morphine-sulfate",
      },
    }),
    prisma.medication.create({
      data: {
        name: "Fentanyl",
        schedule: "II",
        unit: "mcg",
        stockQuantity: 1000,
        slug: "fentanyl",
      },
    }),
    prisma.medication.create({
      data: {
        name: "Codeine",
        schedule: "III",
        unit: "mg",
        stockQuantity: 300,
        slug: "codein",
      },
    }),
    prisma.medication.create({
      data: {
        name: "Diazepam",
        schedule: "IV",
        unit: "mg",
        stockQuantity: 200,
        slug: "diazepam",
      },
    }),
    prisma.medication.create({
      data: {
        name: "Pregabalin",
        schedule: "V",
        unit: "mg",
        stockQuantity: 750,
        slug: "pregabalin",
      },
    }),
  ]);

  console.log("Seed completed:");
  console.log(`Users: ${nurse.name}, ${witness.name}, ${admin.name}`);
  console.log(`Medications: ${medications.map((m) => m.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
