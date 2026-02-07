import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prismaMock } from "../src/lib/__mocks__/prisma.js";

const validMedicationBody = {
  name: "Morphine Sulfate",
  schedule: "II",
  slug: "morphine-sulfate",
  unit: "mg",
};

const mockMedication = {
  id: "00000000-0000-4000-8000-000000000001",
  ...validMedicationBody,
  stockQuantity: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /api/medications", () => {
  it("should create a medication and return 201", async () => {
    prismaMock.medication.create.mockResolvedValue(mockMedication as any);

    const res = await request(app)
      .post("/api/medications")
      .send(validMedicationBody)
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe("Morphine Sulfate");
    expect(res.body.data.slug).toBe("morphine-sulfate");
    expect(res.body.data.schedule).toBe("II");
    expect(res.body.data.unit).toBe("mg");
  });

  it("should create a medication with custom stockQuantity", async () => {
    const body = { ...validMedicationBody, stockQuantity: 100 };
    prismaMock.medication.create.mockResolvedValue({
      ...mockMedication,
      stockQuantity: 100,
    } as any);

    const res = await request(app)
      .post("/api/medications")
      .send(body)
      .expect(201);

    expect(res.body.data.stockQuantity).toBe(100);
  });

  it("should reject missing required fields (400)", async () => {
    const res = await request(app)
      .post("/api/medications")
      .send({})
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("should reject missing name (400)", async () => {
    const { name, ...body } = validMedicationBody;

    const res = await request(app)
      .post("/api/medications")
      .send(body)
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
    expect(res.body.details.some((d: any) => d.path === "name")).toBe(true);
  });

  it("should reject invalid schedule (400)", async () => {
    const res = await request(app)
      .post("/api/medications")
      .send({ ...validMedicationBody, schedule: "VI" })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
  });

  it("should reject invalid unit (400)", async () => {
    const res = await request(app)
      .post("/api/medications")
      .send({ ...validMedicationBody, unit: "kg" })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
  });

  it("should reject non-positive stockQuantity (400)", async () => {
    const res = await request(app)
      .post("/api/medications")
      .send({ ...validMedicationBody, stockQuantity: -10 })
      .expect(400);

    expect(res.body.error).toBe("Validation Error");
  });
});
