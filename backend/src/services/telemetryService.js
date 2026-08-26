/**
 * telemetryService.js
 * Handles saving telemetry data and predictive maintenance logic
 */
const { sendPushNotification } = require("./notificationService");

// Rolling buffer: truckId => [temp1, temp2, temp3] (last 3 readings)
const tempBuffers = new Map();

/**
 * Save incoming telemetry data to the database.
 * Also updates the vehicle status and last GPS coordinates.
 */
async function saveTelemetry(prisma, truckId, data) {
  // Ensure vehicle exists (upsert)
  await prisma.vehicle.upsert({
    where: { id: truckId },
    update: {
      status: "active",
    },
    create: {
      id: truckId,
      name: `Truck ${truckId}`,
      status: "active",
    },
  });

  // Save telemetry record
  const record = await prisma.telemetryData.create({
    data: {
      truckId,
      temperature: parseFloat(data.temperature ?? 0),
      humidity: parseFloat(data.humidity ?? 0),
      light: parseFloat(data.light ?? 0),
      accelX: parseFloat(data.accel_x ?? data.accelX ?? 0),
      accelY: parseFloat(data.accel_y ?? data.accelY ?? 0),
      accelZ: parseFloat(data.accel_z ?? data.accelZ ?? 0),
      speed: parseFloat(data.speed ?? 0),
      doorStatus: parseInt(data.door_status ?? data.doorStatus ?? 0),
      lat: data.lat != null ? parseFloat(data.lat) : null,
      lng: data.lng != null ? parseFloat(data.lng) : null,
    },
  });

  return record;
}

/**
 * Run predictive maintenance check.
 * If temperature increases for 3 consecutive readings, fire a predictive alert.
 */
async function checkPredictiveMaintenance(prisma, truckId, temperature, sseClients) {
  if (!tempBuffers.has(truckId)) {
    tempBuffers.set(truckId, []);
  }

  const buffer = tempBuffers.get(truckId);
  buffer.push(temperature);

  // Keep only last 3 readings
  if (buffer.length > 3) buffer.shift();

  // Only check if we have exactly 3 readings
  if (buffer.length === 3) {
    const [t1, t2, t3] = buffer;
    if (t3 > t2 && t2 > t1) {
      console.log(
        `[PREDICTIVE] ${truckId}: Rising temp trend detected (${t1}°→${t2}°→${t3}°)`
      );

      const message = `Rising temperature trend detected: ${t1}°C → ${t2}°C → ${t3}°C. Please check the compressor.`;

      // Log alert
      await prisma.alertLog.create({
        data: {
          truckId,
          alertType: "PREDICTIVE",
          message,
        },
      });

      // Send push notification
      await sendPushNotification(
        `⚠️ Predictive Alert — Truck ${truckId}`,
        message,
        { truckId, type: "PREDICTIVE" }
      );

      // Reset buffer to avoid repeated alerts for the same trend
      buffer.length = 0;
    }
  }
}

/**
 * Check door/temp threshold alerts
 */
async function checkThresholdAlerts(prisma, truckId, data) {
  const temp = parseFloat(data.temperature ?? 0);
  const door = parseInt(data.door_status ?? data.doorStatus ?? 0);

  if (temp >= 30) {
    const message = `High temperature alert: ${temp}°C (threshold: 30°C)`;
    console.log(`[THRESHOLD] ${truckId}: ${message}`);

    await prisma.alertLog.create({
      data: {
        truckId,
        alertType: "TEMP",
        message,
      },
    });

    await sendPushNotification(
      `🌡️ High Temperature — Truck ${truckId}`,
      message,
      { truckId, type: "TEMP" }
    );
  }

  if (door === 1) {
    const message = "Door opened unexpectedly while in transit.";
    console.log(`[THRESHOLD] ${truckId}: ${message}`);

    await prisma.alertLog.create({
      data: {
        truckId,
        alertType: "DOOR",
        message,
      },
    });

    await sendPushNotification(
      `🚪 Door Open Alert — Truck ${truckId}`,
      message,
      { truckId, type: "DOOR" }
    );
  }
}

module.exports = { saveTelemetry, checkPredictiveMaintenance, checkThresholdAlerts };
