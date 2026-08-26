/**
 * src/components/ACControlPanel.jsx
 * Remote AC control buttons for a truck
 */
"use client";
import { useState } from "react";
import { sendCommand } from "../lib/api";

const AC_COMMANDS = [
  { id: "OFF", label: "OFF", icon: "⏹️", desc: "Off", color: "bg-slate-700 hover:bg-slate-600 border-slate-600" },
  { id: "LEVEL_1", label: "L1", icon: "❄️", desc: "Low", color: "bg-blue-900/50 hover:bg-blue-800/60 border-blue-700" },
  { id: "LEVEL_2", label: "L2", icon: "❄️❄️", desc: "Med", color: "bg-blue-800/60 hover:bg-blue-700/70 border-blue-600" },
  { id: "LEVEL_3", label: "L3", icon: "❄️❄️❄️", desc: "High", color: "bg-blue-700/70 hover:bg-blue-600/80 border-blue-500" },
  { id: "AUTO", label: "AUTO", icon: "🤖", desc: "Auto", color: "bg-purple-900/50 hover:bg-purple-800/60 border-purple-700" },
];

export default function ACControlPanel({ truckId }) {
  const [activeCommand, setActiveCommand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCommand = async (command) => {
    if (loading) return;
    setLoading(true);
    setFeedback(null);

    try {
      await sendCommand(truckId, command);
      setActiveCommand(command);
      setFeedback({ type: "success", message: `AC command "${command}" sent successfully.` });
    } catch (err) {
      setFeedback({ type: "error", message: `Failed to send command: ${err.message}` });
    } finally {
      setLoading(false);
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎛️</span>
        <h3 className="text-sm font-semibold text-white">Remote AC Control</h3>
        {loading && (
          <span className="ml-auto text-xs text-slate-400 animate-pulse">Sending...</span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {AC_COMMANDS.map(({ id, label, icon, desc, color }) => (
          <button
            key={id}
            onClick={() => handleCommand(id)}
            disabled={loading}
            className={`
              flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${color}
              ${activeCommand === id
                ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-95"
                : "active:scale-95"
              }
            `}
            aria-label={`Set AC to ${label}`}
            aria-pressed={activeCommand === id}
          >
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-xs font-bold text-white leading-none">{label}</span>
            <span className="text-[9px] text-slate-400 leading-none">{desc}</span>
          </button>
        ))}
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
            feedback.type === "success"
              ? "bg-green-900/50 text-green-400 border border-green-800"
              : "bg-red-900/50 text-red-400 border border-red-800"
          }`}
        >
          {feedback.type === "success" ? "✅" : "❌"} {feedback.message}
        </div>
      )}

      {/* Status indicator */}
      {activeCommand && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Current: <span className="text-white font-medium">{activeCommand.replace("_", " ")}</span>
        </div>
      )}
    </div>
  );
}
