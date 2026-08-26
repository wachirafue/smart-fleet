"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchVehicle, fetchTelemetry, fetchAlerts } from "../../../lib/api";
import { useSSE } from "../../../hooks/useSSE";
import TelemetryChart, { MultiTelemetryChart } from "../../../components/TelemetryChart";
import ACControlPanel from "../../../components/ACControlPanel";
import AlertLog from "../../../components/AlertLog";

const STATUS_COLORS = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  offline: "bg-slate-500",
};

function MetricCard({ icon, label, value, unit, sublabel, alert }) {
  const borderClass = alert
    ? "border-red-600 shadow-red-900/40 shadow-lg"
    : "border-slate-700";
  const textClass = alert ? "text-red-400" : "text-white";

  return (
    <div className={"bg-slate-800 rounded-xl border p-4 " + borderClass}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        {alert && (
          <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium">
            Alert
          </span>
        )}
      </div>
      <p className={"text-2xl font-bold leading-none " + textClass}>
        {value !== null && value !== undefined ? value : "—"}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function TruckDetailPage() {
  const { id: truckId } = useParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [liveData, setLiveData] = useState(null);

  const loadData = useCallback(async () => {
    if (!truckId) return;
    try {
      const [vRes, tRes, aRes] = await Promise.all([
        fetchVehicle(truckId),
        fetchTelemetry(truckId, 60),
        fetchAlerts(truckId, 20),
      ]);
      setVehicle(vRes.data);
      setTelemetry(tRes.data || []);
      setAlerts(aRes.data || []);
    } catch (err) {
      console.error("Failed to load truck data:", err);
    } finally {
      setLoading(false);
    }
  }, [truckId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useSSE({
    telemetry: useCallback(
      (data) => {
        if (data.truckId === truckId) {
          setLiveData(data);
          setTelemetry((prev) => {
            const newPoint = {
              ...data,
              id: Date.now(),
              accelX: 0,
              accelY: 0,
              accelZ: 0,
              light: 0,
            };
            return [...prev.slice(-59), newPoint];
          });
        }
      },
      [truckId]
    ),
    dms_alert: useCallback(
      (data) => {
        if (data.truckId === truckId) {
          setAlerts((prev) => [
            {
              id: Date.now(),
              truckId,
              alertType: "DMS",
              message: data.message,
              timestamp: data.timestamp,
            },
            ...prev,
          ]);
        }
      },
      [truckId]
    ),
  });

  const currentData = liveData || vehicle?.latestTelemetry;
  const isAlert =
    currentData &&
    (currentData.temperature >= 30 || currentData.doorStatus === 1);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-700 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-4xl mb-3">🔍</div>
        <p>
          Truck <strong>{truckId}</strong> not found.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-blue-400 hover:underline"
        >
          Back to Fleet
        </button>
      </div>
    );
  }

  const statusDot =
    STATUS_COLORS[vehicle.status] || "bg-slate-500";
  const pulseDot = vehicle.status === "active" ? "animate-pulse" : "";

  const tabs = [
    ["overview", "📊 Overview"],
    ["temperature", "🌡️ Temp"],
    ["speed", "💨 Speed"],
    ["alerts", "🚨 Alerts"],
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/")}
          className="mt-1 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{vehicle.name}</h1>
            <span className="text-sm text-slate-400">{vehicle.id}</span>
            <div className="flex items-center gap-1.5 ml-1">
              <span
                className={"w-2 h-2 rounded-full " + statusDot + " " + pulseDot}
              />
              <span className="text-xs text-slate-300 capitalize">
                {vehicle.status}
              </span>
            </div>
            {isAlert && (
              <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium border border-red-800 animate-pulse">
                ⚠️ Alert
              </span>
            )}
          </div>
          {liveData && (
            <p className="text-xs text-green-400 mt-0.5">
              ● Live data streaming
            </p>
          )}
        </div>
        <button
          onClick={loadData}
          className="text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon="🌡️"
          label="Temperature"
          value={currentData?.temperature?.toFixed(1)}
          unit="°C"
          alert={currentData?.temperature >= 30}
          sublabel="Cargo hold"
        />
        <MetricCard
          icon="💨"
          label="Speed"
          value={currentData?.speed?.toFixed(0)}
          unit="km/h"
          sublabel="Current"
        />
        <MetricCard
          icon="💧"
          label="Humidity"
          value={currentData?.humidity?.toFixed(0)}
          unit="%"
          sublabel="Relative"
        />
        <MetricCard
          icon={currentData?.doorStatus === 1 ? "🔓" : "🔒"}
          label="Door"
          value={currentData?.doorStatus === 1 ? "Open" : "Closed"}
          unit=""
          alert={currentData?.doorStatus === 1}
          sublabel="Cargo door"
        />
      </div>

      {/* Accelerometer */}
      {currentData && (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            icon="↔️"
            label="Accel X"
            value={currentData.accelX?.toFixed(2)}
            unit="g"
            sublabel="Lateral"
          />
          <MetricCard
            icon="↕️"
            label="Accel Y"
            value={currentData.accelY?.toFixed(2)}
            unit="g"
            sublabel="Longitudinal"
          />
          <MetricCard
            icon="⬆️"
            label="Accel Z"
            value={currentData.accelZ?.toFixed(2)}
            unit="g"
            sublabel="Vertical"
          />
        </div>
      )}

      {/* AC Control Panel */}
      <ACControlPanel truckId={truckId} />

      {/* Tab Selector */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
        {tabs.map(([tab, lbl]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "flex-1 py-2 text-xs font-medium rounded-lg transition-colors " +
              (activeTab === tab
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white")
            }
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        {activeTab === "overview" && (
          <>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              All Metrics — Last {telemetry.length} readings
            </h3>
            <MultiTelemetryChart data={telemetry} />
          </>
        )}
        {activeTab === "temperature" && (
          <>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Temperature History (°C)
            </h3>
            <TelemetryChart
              data={telemetry}
              dataKey="temperature"
              label="Temperature"
              color="#f97316"
              unit="°C"
            />
          </>
        )}
        {activeTab === "speed" && (
          <>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Speed History (km/h)
            </h3>
            <TelemetryChart
              data={telemetry}
              dataKey="speed"
              label="Speed"
              color="#22c55e"
              unit=" km/h"
              yDomain={[0, "auto"]}
            />
          </>
        )}
        {activeTab === "alerts" && (
          <>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Alert History
            </h3>
            <AlertLog alerts={alerts} />
          </>
        )}
      </div>

      {/* GPS Info */}
      {currentData?.lat != null && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">
            📍 Last Known Position
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-400">
              Lat:{" "}
              <strong className="text-white">
                {currentData.lat?.toFixed(5)}
              </strong>
            </span>
            <span className="text-slate-400">
              Lng:{" "}
              <strong className="text-white">
                {currentData.lng?.toFixed(5)}
              </strong>
            </span>
            {vehicle.destLat != null && (
              <>
                <span className="text-slate-400">
                  Dest Lat:{" "}
                  <strong className="text-slate-300">
                    {vehicle.destLat?.toFixed(5)}
                  </strong>
                </span>
                <span className="text-slate-400">
                  Dest Lng:{" "}
                  <strong className="text-slate-300">
                    {vehicle.destLng?.toFixed(5)}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}