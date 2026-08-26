/**
 * src/lib/api.js
 * API helper functions for communicating with the backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API request failed");
  return data;
}

// ── Vehicles ─────────────────────────────────────────────────────────────────
export async function fetchVehicles() {
  return apiFetch("/api/vehicles");
}

export async function fetchVehicle(truckId) {
  return apiFetch(`/api/vehicles/${truckId}`);
}

// ── Telemetry ────────────────────────────────────────────────────────────────
export async function fetchTelemetry(truckId, limit = 50) {
  return apiFetch(`/api/telemetry/${truckId}?limit=${limit}`);
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export async function fetchAlerts(truckId, limit = 20) {
  return apiFetch(`/api/alerts/${truckId}?limit=${limit}`);
}

// ── Commands ─────────────────────────────────────────────────────────────────
export async function sendCommand(truckId, command) {
  return apiFetch(`/api/command/${truckId}`, {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

// ── Push Subscriptions ───────────────────────────────────────────────────────
export async function getVapidPublicKey() {
  return apiFetch("/api/subscribe/vapid-public-key");
}

export async function savePushSubscription(subscription) {
  return apiFetch("/api/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

export { API_BASE };
