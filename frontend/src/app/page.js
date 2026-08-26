/**
 * src/app/page.js - Fleet Overview (Home Page)
 */
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import TruckCard from "../components/TruckCard";
import StatsBar from "../components/StatsBar";
import { fetchVehicles } from "../lib/api";
import { useSSE, usePushNotifications } from "../hooks/useSSE";

export default function FleetOverviewPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Store live telemetry updates from SSE keyed by truckId
  const [liveTelemetry, setLiveTelemetry] = useState({});

  // Register service worker and push notifications
  usePushNotifications();

  // Load all vehicles from API
  const loadVehicles = useCallback(async () => {
    try {
      const res = await fetchVehicles();
      setVehicles(res.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load fleet data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    // Refresh full data every 30 seconds as fallback
    const interval = setInterval(loadVehicles, 30000);
    return () => clearInterval(interval);
  }, [loadVehicles]);

  // SSE: receive live telemetry updates
  useSSE({
    telemetry: useCallback((data) => {
      setLiveTelemetry((prev) => ({
        ...prev,
        [data.truckId]: data,
      }));
      setLastUpdated(new Date());
    }, []),
    dms_alert: useCallback((data) => {
      // Could show a toast here in the future
      console.log("[DMS] Alert received:", data);
    }, []),
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Fleet Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lastUpdated
              ? `Last update: ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for live data..."}
          </p>
        </div>
        <button
          onClick={loadVehicles}
          className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-4 mb-4 text-sm">
          <strong>⚠️ Connection Error:</strong> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-xl h-44 animate-pulse border border-slate-700" />
          ))}
        </div>
      )}

      {/* Stats bar */}
      {!loading && vehicles.length > 0 && <StatsBar vehicles={vehicles} />}

      {/* Empty state */}
      {!loading && vehicles.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <span className="text-5xl mb-4">🚛</span>
          <p className="text-lg font-medium">No trucks registered yet</p>
          <p className="text-sm mt-1">Run the database seed or wait for MQTT messages</p>
          <code className="mt-3 text-xs bg-slate-800 px-3 py-1.5 rounded">npm run db:seed</code>
        </div>
      )}

      {/* Truck grid */}
      {!loading && vehicles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <TruckCard
              key={vehicle.id}
              vehicle={vehicle}
              liveData={liveTelemetry[vehicle.id] || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
