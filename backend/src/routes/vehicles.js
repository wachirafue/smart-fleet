/**
 * routes/vehicles.js
 * GET /api/vehicles - Returns all vehicles with their latest telemetry
 */
const express = require("express");
const { prisma } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { id: "asc" },
    });

    // Fetch latest telemetry for each vehicle
    const vehiclesWithTelemetry = await Promise.all(
      vehicles.map(async (vehicle) => {
        const latest = await prisma.telemetryData.findFirst({
          where: { truckId: vehicle.id },
          orderBy: { timestamp: "desc" },
        });
        return { ...vehicle, latestTelemetry: latest };
      })
    );

    res.json({ success: true, data: vehiclesWithTelemetry });
  } catch (err) {
    console.error("[API] GET /vehicles error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, error: "Vehicle not found" });
    }

    const latest = await prisma.telemetryData.findFirst({
      where: { truckId: vehicle.id },
      orderBy: { timestamp: "desc" },
    });

    res.json({ success: true, data: { ...vehicle, latestTelemetry: latest } });
  } catch (err) {
    console.error("[API] GET /vehicles/:id error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
