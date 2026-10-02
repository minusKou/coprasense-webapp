import React from "react";
import { Leaf } from "lucide-react";

const NAV = [
  { key: "dashboard", label: "Dashboard" },
  { key: "history", label: "Grading history" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

export default function Topbar({ view, onNavigate, orgName }) {
  return (
    <div
      className="flex items-center justify-between rounded-[14px] px-5 py-3.5 mb-6"
      style={{ background: "#12261B" }}
    >
      <div className="flex items-center gap-2.5 text-white font-semibold text-base">
        <Leaf size={20} style={{ color: "#B8862E" }} />
        <span>{orgName || "CopraSense"}</span>
      </div>
      <nav className="hidden md:flex gap-6 text-[13.5px]" style={{ color: "#B7C4BB" }}>
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => onNavigate(n.key)}
            className="pb-0.5 border-b-2 transition-colors"
            style={{
              color: view === n.key ? "#fff" : undefined,
              borderColor: view === n.key ? "#B8862E" : "transparent",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#fff")}
            onMouseLeave={(e) => (e.target.style.color = view === n.key ? "#fff" : "#B7C4BB")}
          >
            {n.label}
          </button>
        ))}
      </nav>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
        style={{ background: "#2F6E48" }}
      >
        H
      </div>
    </div>
  );
}