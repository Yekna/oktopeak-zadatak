import { vi } from "vitest";

vi.mock("../src/lib/prisma", () => {
  return import("../src/lib/__mocks__/prisma");
});
