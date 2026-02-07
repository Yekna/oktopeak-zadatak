import express from "express";
import medicationRoutes from "./routes/medications.js";
import transactionRoutes from "./routes/transactions.js";
import auditLogRoutes from "./routes/auditLog.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, writeLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(express.json());
app.get("/api/{*path}", apiLimiter);
app.post("/api/{*path}", writeLimiter);

app.use("/api/medications", medicationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit-log", auditLogRoutes);

app.use(errorHandler);

export default app;
