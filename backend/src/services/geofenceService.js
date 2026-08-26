/**
 * geofenceService.js
 * Haversine formula geofencing logic
 */
const { sendPushNotification } = require("./notificationService");

// Track which trucks have already triggered geofence alert (prevent repeated triggers)
const geofenceAlerted = new Set();

/**
 * Haversine formula to calculate distance between two GPS points in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check geofence for a truck.
 * If within 1km of destination, publish pre-cooling command and send notification.
 *
 * @param {Object} vehicle - Vehicle record from DB (includes destLat, destLng)
 * @param {number} lat - Current truck latitude
 * @param {number} lng - Current truck longitude
 * @param {Function} mqttPublish - Callback to publish MQTT message
 * @param {Object} prisma - Prisma client instance
 */
async function checkGeofence(vehicle, lat, lng, mqttPublish, prisma) {
  if (
    vehicle.destLat == null ||
    vehicle.destLng == null ||
    lat == null ||
    lng == null
  ) {
    return;
  }

  // Skip if already alerted
  if (geofenceAlerted.has(vehicle.id)) return;

  const distance = haversineDistance(
    lat,
    lng,
    vehicle.destLat,
    vehicle.destLng
  );

  console.log(
    `[GEOFENCE] ${vehicle.id}: ${distance.toFixed(3)} km from destination`
  );

  if (distance <= 1.0) {
    console.log(
      `[GEOFENCE] ${vehicle.id} is within 1km! Triggering pre-cooling...`
    );

    // Mark as alerted
    geofenceAlerted.add(vehicle.id);

    // Publish MQTT command
    const topic = `fleet/${vehicle.id}/command`;
    const payload = JSON.stringify({ mode: "MANUAL", level: 3 });
    mqttPublish(topic, payload);

    // Log alert to DB
    await prisma.alertLog.create({
      data: {
        truckId: vehicle.id,
        alertType: "GEOFENCE",
        message: `${vehicle.name} is ${distance.toFixed(2)}km from destination. Pre-cooling initiated (Level 3).`,
      },
    });

    // Send push notification
    await sendPushNotification(
      `🚛 Pre-Cooling Activated — ${vehicle.name}`,
      `Truck is ${distance.toFixed(2)}km from destination. AC set to Level 3.`,
      { truckId: vehicle.id, type: "GEOFENCE" }
    );
  }
}

/**
 * Reset geofence alert for a truck (e.g., when it departs again)
 */
function resetGeofenceAlert(truckId) {
  geofenceAlerted.delete(truckId);
}

module.exports = { checkGeofence, haversineDistance, resetGeofenceAlert };
