/**
 * routes/alerts.js
 * GET /api/alerts/:truckId - Returns alert logs for a truck
 */
const express = require("express");
const { prisma } = require("../db");

const router = express.Router();

router.get("/:truckId", async (req, res) => {
  try {
    const { truckId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const alerts = await prisma.alertLog.findMany({
      where: { truckId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.json({ success: true, data: alerts });
  } catch (err) {
    console.error("[API] GET /alerts/:truckId error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
