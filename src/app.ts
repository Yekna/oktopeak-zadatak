import express from "express";
import medicationRoutes from "./routes/medications.js";
import transactionRoutes from "./routes/transactions.js";
import auditLogRoutes from "./routes/auditLog.js";

const app = express();

app.use(express.json());

app.use("/api/medications", medicationRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit-log", auditLogRoutes);

export default app;
