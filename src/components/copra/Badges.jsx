import React from "react";
import { gradeBg, gradeColors } from "@/lib/copraGrading";

export function GradePill({ grade, status }) {
  if (status === "Rejected") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-md text-[10px] font-bold px-1.5 h-[22px]"
        style={{ background: "#3A2722", color: "#FFD9D2" }}
      >
        REJ
      </span>
    );
  }
  return (
    <span
      className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-md text-xs font-bold"
      style={{ background: gradeBg[grade], color: gradeColors[grade] }}
    >
      {grade}
    </span>
  );
}

export function StatusBadge({ status }) {
  const passed = status === "Passed";
  const rejected = status === "Rejected";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{
        background: passed ? "#DCEBE1" : rejected ? "#3A2722" : "#F6DEDB",
        color: passed ? "#1C3B29" : rejected ? "#FFD9D2" : "#B4453B",
      }}
    >
      {passed ? "✓" : rejected ? "✕" : "⚑"} {status}
    </span>
  );
}