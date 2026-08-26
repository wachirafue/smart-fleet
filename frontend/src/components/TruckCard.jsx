/**
 * src/components/TruckCard.jsx
 * Fleet overview card for a single truck
 */
"use client";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
  active: { color: "bg-green-500", label: "Active" },
  idle: { color: "bg-yellow-500", label: "Idle" },
  offline: { color: "bg-slate-500", label: "Offline" },
};

function MetricBlock({ icon, label, value, unit, alert }) {
  return (
    <div className={`flex flex-col items-center p-2 rounded-lg ${alert ? "bg-red-900/40" : "bg-slate-700/40"}`}>
      <span className="text-base mb-0.5">{icon}</span>
      <span className={`text-lg font-bold leading-none ${alert ? "text-red-400" : "text-white"}`}>
        {value !== null && value !== undefined ? value : "—"}
        <span className="text-xs font-normal ml-0.5 text-slate-400">{unit}</span>
      </span>
      <span className="text-xs text-slate-400 mt-0.5">{label}</span>
    </div>
  );
}

export default function TruckCard({ vehicle, liveData }) {
  const router = useRouter();
  const telemetry = liveData || vehicle.latestTelemetry;
  const statusCfg = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.offline;

  const temp = telemetry?.temperature ?? null;
  const speed = telemetry?.speed ?? null;
  const humidity = telemetry?.humidity ?? null;
  const doorOpen = telemetry?.doorStatus === 1;
  const isAlert = (temp !== null && temp >= 30) || doorOpen;

  return (
    <div
      onClick={() => router.push(`/truck/${vehicle.id}`)}
      className={`
        relative bg-slate-800 rounded-xl border-2 p-4 cursor-pointer
        transition-all duration-200 hover:scale-[1.02] hover:bg-slate-750
        ${isAlert ? "card-alert" : "border-slate-700 hover:border-slate-500"}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/truck/${vehicle.id}`)}
      aria-label={`View details for ${vehicle.name}`}
    >
      {/* Alert Overlay Banner */}
      {isAlert && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/90 text-white text-xs font-bold text-center py-1 rounded-t-xl tracking-wide uppercase">
          ⚠️ Alert Active
        </div>
      )}

      {/* Header */}
      <div className={`flex items-start justify-between mb-3 ${isAlert ? "mt-5" : ""}`}>
        <div>
          <h2 className="text-base font-bold text-white leading-tight">{vehicle.name}</h2>
          <p className="text-xs text-slate-400">{vehicle.id}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${vehicle.status === "active" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-slate-300">{statusCfg.label}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      {telemetry ? (
        <div className="grid grid-cols-3 gap-2">
          <MetricBlock
            icon="🌡️"
            label="Temp"
            value={temp?.toFixed(1)}
            unit="°C"
            alert={temp !== null && temp >= 30}
          />
          <MetricBlock
            icon="💨"
            label="Speed"
            value={speed?.toFixed(0)}
            unit="km/h"
          />
          <MetricBlock
            icon="💧"
            label="Humidity"
            value={humidity?.toFixed(0)}
            unit="%"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-16 text-slate-500 text-sm">
          No telemetry data yet
        </div>
      )}

      {/* Door Status */}
      {telemetry && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${doorOpen ? "bg-red-900/50 text-red-400" : "bg-slate-700/40 text-slate-400"}`}>
          <span>{doorOpen ? "🔓" : "🔒"}</span>
          <span>Door: {doorOpen ? "Open" : "Closed"}</span>
          {telemetry.timestamp && (
            <span className="ml-auto text-slate-500">
              {new Date(telemetry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* Click hint */}
      <div className="mt-2 text-xs text-slate-600 text-center">
        Tap to view details →
      </div>
    </div>
  );
}
