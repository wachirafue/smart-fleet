/**
 * routes/sse.js
 * GET /api/sse - Server-Sent Events endpoint for real-time dashboard updates
 */
const express = require("express");
const { addClient, removeClient } = require("../sseManager");

const router = express.Router();

router.get("/", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering

  // Send initial connection confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "SSE connected" })}\n\n`);

  // Register this client
  addClient(res);

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

module.exports = router;
