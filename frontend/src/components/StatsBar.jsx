/**
 * src/components/StatsBar.jsx
 * Summary statistics bar for the fleet overview
 */
"use client";

export default function StatsBar({ vehicles }) {
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === "active").length;
  const alerts = vehicles.filter((v) => {
    const t = v.latestTelemetry;
    return t && (t.temperature >= 30 || t.doorStatus === 1);
  }).length;
  const offline = vehicles.filter((v) => v.status === "offline").length;

  const stats = [
    { label: "Total Trucks", value: total, icon: "🚛", color: "text-blue-400" },
    { label: "Active", value: active, icon: "✅", color: "text-green-400" },
    { label: "Alerts", value: alerts, icon: "⚠️", color: alerts > 0 ? "text-red-400" : "text-slate-400" },
    { label: "Offline", value: offline, icon: "📴", color: offline > 0 ? "text-yellow-400" : "text-slate-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, icon, color }) => (
        <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
