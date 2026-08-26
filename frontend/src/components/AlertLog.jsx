/**
 * src/components/AlertLog.jsx
 * Alert log table for a truck
 */
"use client";
import { formatDistanceToNow } from "date-fns";

const ALERT_CONFIG = {
  GEOFENCE: { icon: "📍", color: "text-blue-400 bg-blue-900/30 border-blue-800", label: "Geofence" },
  PREDICTIVE: { icon: "⚠️", color: "text-yellow-400 bg-yellow-900/30 border-yellow-800", label: "Predictive" },
  DMS: { icon: "🚨", color: "text-red-400 bg-red-900/30 border-red-800", label: "Driver Alert" },
  TEMP: { icon: "🌡️", color: "text-orange-400 bg-orange-900/30 border-orange-800", label: "High Temp" },
  DOOR: { icon: "🔓", color: "text-purple-400 bg-purple-900/30 border-purple-800", label: "Door Open" },
};

function AlertItem({ alert }) {
  const cfg = ALERT_CONFIG[alert.alertType] || { icon: "ℹ️", color: "text-slate-400 bg-slate-800 border-slate-700", label: alert.alertType };
  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }); }
    catch { return ""; }
  })();

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${cfg.color} text-sm`}>
      <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-xs uppercase tracking-wide">{cfg.label}</span>
          <span className="text-xs opacity-60 ml-auto flex-shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs opacity-80 leading-snug break-words">{alert.message}</p>
      </div>
    </div>
  );
}

export default function AlertLog({ alerts, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-slate-700/40 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
        <div className="text-center">
          <div className="text-2xl mb-2">✅</div>
          <p>No alerts — all systems nominal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
