import express from "express";
import { serve, setup } from "swagger-ui-express";
import medicationRoutes from "./routes/medications.js";
import transactionRoutes from "./routes/transactions.js";
import auditLogRoutes from "./routes/auditLog.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, writeLimiter } from "./middleware/rateLimiter.js";
import { swaggerSpec } from "./swagger.js";

const app = express();

app.use(express.json());
app.get("/api/{*path}", apiLimiter);
app.post("/api/{*path}", writeLimiter);

if(process.env.NODE_ENV !== "production") {
  app.use("/api-docs", serve, setup(swaggerSpec));
}

app.use("/api/medications", medicationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit-log", auditLogRoutes);

app.use(errorHandler);

export default app;
