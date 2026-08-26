/**
 * server.js - Smart Fleet Management Backend
 * Express server with MQTT, Prisma, SSE, and Web Push
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectMqtt } = require("./mqtt/mqttClient");

// Route imports
const vehiclesRouter = require("./routes/vehicles");
const telemetryRouter = require("./routes/telemetry");
const alertsRouter = require("./routes/alerts");
const commandsRouter = require("./routes/commands");
const subscribeRouter = require("./routes/subscribe");
const sseRouter = require("./routes/sse");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/command", commandsRouter);
app.use("/api/subscribe", subscribeRouter);
app.use("/api/sse", sseRouter);

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Express] Unhandled error:", err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Smart Fleet Backend running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);

  // Connect to MQTT broker
  connectMqtt();
});

module.exports = app;
