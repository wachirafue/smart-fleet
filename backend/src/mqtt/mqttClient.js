/**
 * mqttClient.js
 * MQTT client - subscribes to fleet telemetry and DMS alert topics
 */
const mqtt = require("mqtt");
const { prisma } = require("../db");
const { saveTelemetry, checkPredictiveMaintenance, checkThresholdAlerts } = require("../services/telemetryService");
const { checkGeofence } = require("../services/geofenceService");
const { sendPushNotification } = require("../services/notificationService");
const { broadcast } = require("../sseManager");

let mqttClientInstance = null;

function getMqttClient() {
  return mqttClientInstance;
}

/**
 * Publish a message to the MQTT broker
 */
function mqttPublish(topic, payload) {
  if (!mqttClientInstance) {
    console.error("[MQTT] Client not connected, cannot publish.");
    return;
  }
  mqttClientInstance.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`[MQTT] Publish error to ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] Published to ${topic}: ${payload}`);
    }
  });
}

/**
 * Connect to the MQTT broker and set up subscriptions
 */
function connectMqtt() {
  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";

  const options = {
    clientId: `smart-fleet-backend-${Math.random().toString(16).slice(2)}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  };

  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME;
    options.password = process.env.MQTT_PASSWORD;
  }

  console.log(`[MQTT] Connecting to broker: ${brokerUrl}`);
  const client = mqtt.connect(brokerUrl, options);
  mqttClientInstance = client;

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker.");

    // Subscribe to telemetry and DMS alert topics
    client.subscribe("fleet/+/data", { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error (data):", err.message);
      else console.log("[MQTT] Subscribed to fleet/+/data");
    });

    client.subscribe("fleet/+/dms_alert", { qos: 1 }, (err) => {
      if (err) console.error("[MQTT] Subscribe error (dms_alert):", err.message);
      else console.log("[MQTT] Subscribed to fleet/+/dms_alert");
    });
  });

  client.on("message", async (topic, messageBuffer) => {
    const message = messageBuffer.toString();
    console.log(`[MQTT] Message on ${topic}: ${message}`);

    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.warn(`[MQTT] Invalid JSON on topic ${topic}`);
      return;
    }

    // Extract truck ID from topic  fleet/<truckId>/data
    const topicParts = topic.split("/");
    if (topicParts.length < 3) return;

    const truckId = topicParts[1];
    const topicType = topicParts[2];

    try {
      if (topicType === "data") {
        await handleTelemetryMessage(truckId, data);
      } else if (topicType === "dms_alert") {
        await handleDmsAlertMessage(truckId, data);
      }
    } catch (err) {
      console.error(`[MQTT] Error processing message on ${topic}:`, err.message);
    }
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting to broker...");
  });

  client.on("offline", () => {
    console.warn("[MQTT] Client offline.");
  });

  client.on("error", (err) => {
    console.error("[MQTT] Connection error:", err.message);
  });

  return client;
}

/**
 * Handle telemetry data message (fleet/+/data)
 */
async function handleTelemetryMessage(truckId, data) {
  // 1. Save telemetry to DB
  const record = await saveTelemetry(prisma, truckId, data);

  // 2. Fetch vehicle for geofence destination
  const vehicle = await prisma.vehicle.findUnique({ where: { id: truckId } });

  // 3. Geofence check
  if (vehicle && data.lat != null && data.lng != null) {
    await checkGeofence(vehicle, parseFloat(data.lat), parseFloat(data.lng), mqttPublish, prisma);
  }

  // 4. Predictive maintenance check
  await checkPredictiveMaintenance(prisma, truckId, parseFloat(data.temperature ?? 0));

  // 5. Threshold alerts (temp >= 30, door open)
  await checkThresholdAlerts(prisma, truckId, data);

  // 6. Broadcast via SSE to frontend clients
  broadcast("telemetry", {
    truckId,
    temperature: parseFloat(data.temperature ?? 0),
    humidity: parseFloat(data.humidity ?? 0),
    speed: parseFloat(data.speed ?? 0),
    doorStatus: parseInt(data.door_status ?? data.doorStatus ?? 0),
    lat: data.lat != null ? parseFloat(data.lat) : null,
    lng: data.lng != null ? parseFloat(data.lng) : null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle DMS (Driver Monitoring System) alert message (fleet/+/dms_alert)
 */
async function handleDmsAlertMessage(truckId, data) {
  const alertType = data.type || data.alert_type || "UNKNOWN";
  const message = `DMS Alert: ${alertType}${data.confidence ? ` (${(data.confidence * 100).toFixed(0)}% confidence)` : ""}`;

  // Log alert to DB
  await prisma.alertLog.create({
    data: {
      truckId,
      alertType: "DMS",
      message,
    },
  });

  // Send immediate push notification
  await sendPushNotification(
    `🚨 Driver Alert — Truck ${truckId}`,
    message,
    { truckId, type: "DMS", alertType }
  );

  // Broadcast via SSE
  broadcast("dms_alert", {
    truckId,
    alertType,
    message,
    timestamp: new Date().toISOString(),
  });

  console.log(`[DMS] Alert for ${truckId}: ${message}`);
}

module.exports = { connectMqtt, mqttPublish, getMqttClient };
