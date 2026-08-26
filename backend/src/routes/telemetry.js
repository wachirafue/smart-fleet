/**
 * routes/telemetry.js
 * GET /api/telemetry/:truckId - Returns historical telemetry data
 */
const express = require("express");
const { prisma } = require("../db");

const router = express.Router();

router.get("/:truckId", async (req, res) => {
  try {
    const { truckId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const records = await prisma.telemetryData.findMany({
      where: { truckId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Return in chronological order for charts
    res.json({ success: true, data: records.reverse() });
  } catch (err) {
    console.error("[API] GET /telemetry/:truckId error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
