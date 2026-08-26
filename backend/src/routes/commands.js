/**
 * routes/commands.js
 * POST /api/command/:truckId - Publish an AC control command to MQTT
 */
const express = require("express");
const { mqttPublish } = require("../mqtt/mqttClient");

const router = express.Router();

const VALID_LEVELS = {
  OFF: { mode: "MANUAL", level: 0 },
  LEVEL_1: { mode: "MANUAL", level: 1 },
  LEVEL_2: { mode: "MANUAL", level: 2 },
  LEVEL_3: { mode: "MANUAL", level: 3 },
  AUTO: { mode: "AUTO", level: 0 },
};

router.post("/:truckId", (req, res) => {
  const { truckId } = req.params;
  const { command } = req.body;

  if (!command || !VALID_LEVELS[command]) {
    return res.status(400).json({
      success: false,
      error: `Invalid command. Valid options: ${Object.keys(VALID_LEVELS).join(", ")}`,
    });
  }

  const payload = JSON.stringify(VALID_LEVELS[command]);
  const topic = `fleet/${truckId}/command`;

  try {
    mqttPublish(topic, payload);
    console.log(`[CMD] Sent "${command}" to ${truckId}`);
    res.json({ success: true, truckId, command, payload });
  } catch (err) {
    console.error("[API] POST /command/:truckId error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
