import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prismaMock } from "../src/lib/__mocks__/prisma.js";

// Shared test data - use valid UUIDs for Zod validation
const MED_ID = "00000000-0000-4000-8000-000000000001";
const NURSE_ID = "00000000-0000-4000-8000-000000000002";
const WITNESS_ID = "00000000-0000-4000-8000-000000000003";

const mockMedication = {
  id: MED_ID,
  name: "Morphine Sulfate",
  slug: "morphine-sulfate",
  schedule: "II" as const,
  unit: "mg" as const,
  stockQuantity: 500,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNurse = {
  id: NURSE_ID,
  email: "nurse@hospital.com",
  name: "Jane Smith",
  role: "NURSE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWitness = {
  id: WITNESS_ID,
  email: "witness@hospital.com",
  name: "John Doe",
  role: "WITNESS" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validCheckoutBody = {
  medicationId: MED_ID,
  nurseId: NURSE_ID,
  witnessId: WITNESS_ID,
  type: "CHECKOUT",
  quantity: 50,
};

describe("POST /api/transactions", () => {
  beforeEach(() => {
    // Default mocks for entity lookups
    prismaMock.medication.findUnique.mockResolvedValue(mockMedication);
    prismaMock.user.findUnique.mockImplementation((args: any) => {
      if (args.where.id === mockNurse.id) return Promise.resolve(mockNurse) as any;
      if (args.where.id === mockWitness.id) return Promise.resolve(mockWitness) as any;
      return Promise.resolve(null) as any;
    });
  });

  describe("Successful transaction creation", () => {
    it("should create a CHECKOUT transaction and return 201", async () => {
      const mockTransaction = {
        id: "txn-1",
        ...validCheckoutBody,
        notes: null,
        createdAt: new Date(),
        medication: mockMedication,
        nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
        witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const txClient = {
          medication: { update: prismaMock.medication.update },
          transaction: { create: prismaMock.transaction.create },
          auditLog: { create: prismaMock.auditLog.create },
        };
        prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);
        prismaMock.auditLog.create.mockResolvedValue({} as any);
        prismaMock.medication.update.mockResolvedValue({
          ...mockMedication,
          stockQuantity: 450,
        });
        return cb(txClient);
      });

      const res = await request(app)
        .post("/api/transactions")
        .send(validCheckoutBody)
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe("txn-1");
      expect(res.body.data.type).toBe("CHECKOUT");
    });

    it("should create a RETURN transaction and return 201", async () => {
      const returnBody = { ...validCheckoutBody, type: "RETURN", quantity: 20 };
      const mockTransaction = {
        id: "txn-2",
        ...returnBody,
        notes: null,
        createdAt: new Date(),
        medication: mockMedication,
        nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
        witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const txClient = {
          medication: { update: prismaMock.medication.update },
          transaction: { create: prismaMock.transaction.create },
          auditLog: { create: prismaMock.auditLog.create },
        };
        prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);
        prismaMock.auditLog.create.mockResolvedValue({} as any);
        prismaMock.medication.update.mockResolvedValue({
          ...mockMedication,
          stockQuantity: 520,
        });
        return cb(txClient);
      });

      const res = await request(app)
        .post("/api/transactions")
        .send(returnBody)
        .expect(201);

      expect(res.body.data.type).toBe("RETURN");
    });

    it("should create a WASTE transaction with notes and return 201", async () => {
      const wasteBody = {
        ...validCheckoutBody,
        type: "WASTE",
        quantity: 10,
        notes: "Substance contaminated during preparation",
      };
      const mockTransaction = {
        id: "txn-3",
        ...wasteBody,
        createdAt: new Date(),
        medication: mockMedication,
        nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
        witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        const txClient = {
          medication: { update: prismaMock.medication.update },
          transaction: { create: prismaMock.transaction.create },
          auditLog: { create: prismaMock.auditLog.create },
        };
        prismaMock.transaction.create.mockResolvedValue(mockTransaction as any);
        prismaMock.auditLog.create.mockResolvedValue({} as any);
        return cb(txClient);
      });

      const res = await request(app)
        .post("/api/transactions")
        .send(wasteBody)
        .expect(201);

      expect(res.body.data.type).toBe("WASTE");
      expect(res.body.data.notes).toBe("Substance contaminated during preparation");
    });
  });

  describe("Failure cases", () => {
    it("should reject CHECKOUT when insufficient stock (400)", async () => {
      prismaMock.medication.findUnique.mockResolvedValue({
        ...mockMedication,
        stockQuantity: 10,
      });

      const res = await request(app)
        .post("/api/transactions")
        .send({ ...validCheckoutBody, quantity: 50 })
        .expect(400);

      expect(res.body.error).toMatch(/insufficient stock/i);
    });

    it("should reject when nurse and witness are the same person (400)", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .send({ ...validCheckoutBody, witnessId: validCheckoutBody.nurseId })
        .expect(400);

      expect(res.body.details).toBeDefined();
      expect(res.body.details.some((d: any) => d.message.match(/different person/i))).toBe(
        true
      );
    });

    it("should reject WASTE without notes (400)", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .send({ ...validCheckoutBody, type: "WASTE" })
        .expect(400);

      expect(res.body.details).toBeDefined();
      expect(res.body.details.some((d: any) => d.message.match(/notes.*required/i))).toBe(
        true
      );
    });

    it("should reject when medication not found (404)", async () => {
      prismaMock.medication.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/transactions")
        .send(validCheckoutBody)
        .expect(404);

      expect(res.body.error).toMatch(/medication not found/i);
    });
  });
});

describe("Stock calculation", () => {
  beforeEach(() => {
    prismaMock.medication.findUnique.mockResolvedValue(mockMedication);
    prismaMock.user.findUnique.mockImplementation((args: any) => {
      if (args.where.id === mockNurse.id) return Promise.resolve(mockNurse) as any;
      if (args.where.id === mockWitness.id) return Promise.resolve(mockWitness) as any;
      return Promise.resolve(null) as any;
    });
  });

  it("CHECKOUT should call medication.update with decrement", async () => {
    let updateArgs: any;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const txClient = {
        medication: {
          update: async (args: any) => {
            updateArgs = args;
            return { ...mockMedication, stockQuantity: 450 };
          },
        },
        transaction: {
          create: async () => ({
            id: "txn-stock-1",
            ...validCheckoutBody,
            notes: null,
            createdAt: new Date(),
            medication: mockMedication,
            nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
            witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
          }),
        },
        auditLog: { create: async () => ({}) },
      };
      return cb(txClient);
    });

    await request(app)
      .post("/api/transactions")
      .send(validCheckoutBody)
      .expect(201);

    expect(updateArgs).toBeDefined();
    expect(updateArgs.data.stockQuantity).toEqual({ decrement: 50 });
  });

  it("RETURN should call medication.update with increment", async () => {
    let updateArgs: any;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const txClient = {
        medication: {
          update: async (args: any) => {
            updateArgs = args;
            return { ...mockMedication, stockQuantity: 520 };
          },
        },
        transaction: {
          create: async () => ({
            id: "txn-stock-2",
            ...validCheckoutBody,
            type: "RETURN",
            quantity: 20,
            notes: null,
            createdAt: new Date(),
            medication: mockMedication,
            nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
            witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
          }),
        },
        auditLog: { create: async () => ({}) },
      };
      return cb(txClient);
    });

    await request(app)
      .post("/api/transactions")
      .send({ ...validCheckoutBody, type: "RETURN", quantity: 20 })
      .expect(201);

    expect(updateArgs).toBeDefined();
    expect(updateArgs.data.stockQuantity).toEqual({ increment: 20 });
  });

  it("WASTE should not call medication.update", async () => {
    let medicationUpdateCalled = false;
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const txClient = {
        medication: {
          update: async () => {
            medicationUpdateCalled = true;
            return mockMedication;
          },
        },
        transaction: {
          create: async () => ({
            id: "txn-stock-3",
            ...validCheckoutBody,
            type: "WASTE",
            quantity: 10,
            notes: "Contaminated",
            createdAt: new Date(),
            medication: mockMedication,
            nurse: { id: mockNurse.id, name: mockNurse.name, email: mockNurse.email },
            witness: { id: mockWitness.id, name: mockWitness.name, email: mockWitness.email },
          }),
        },
        auditLog: { create: async () => ({}) },
      };
      return cb(txClient);
    });

    await request(app)
      .post("/api/transactions")
      .send({
        ...validCheckoutBody,
        type: "WASTE",
        quantity: 10,
        notes: "Contaminated",
      })
      .expect(201);

    expect(medicationUpdateCalled).toBe(false);
  });
});

describe("Input validation", () => {
  it("should reject missing required fields (400)", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({})
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("should reject invalid UUID formats (400)", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        medicationId: "not-a-uuid",
        nurseId: "also-invalid",
        witnessId: "bad-uuid",
        type: "CHECKOUT",
        quantity: 50,
      })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details.some((d: any) => d.path === "medicationId")).toBe(true);
  });

  it("should reject invalid transaction type (400)", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        ...validCheckoutBody,
        type: "INVALID_TYPE",
      })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
  });

  it("should reject non-positive quantity (400)", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        ...validCheckoutBody,
        quantity: -5,
      })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details.some((d: any) => d.path === "quantity")).toBe(true);
  });

  it("should reject zero quantity (400)", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        ...validCheckoutBody,
        quantity: 0,
      })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
  });
});
