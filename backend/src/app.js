import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoose from "mongoose";
import api from "./routes/api.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (req.body == null) req.body = {};
  next();
});
app.use(cookieParser());
app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected"
  });
});
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "The CivicPulse API is running, but MongoDB is not connected. Check MONGODB_URI, Atlas Network Access, and database credentials."
    });
  }
  next();
});
app.use("/api", api);
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));
app.use(errorHandler);

export default app;
