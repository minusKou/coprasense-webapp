import React from "react";
import { Printer, ShieldCheck, AlertTriangle } from "lucide-react";
import { GradeDoughnut, TrendChart } from "./Charts";
import { gradeColors, gradeRangeLabel } from "@/lib/copraGrading";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

function Kpi({ label, value, tone }) {
  const color = tone === "good" ? "#2F6E48" : "#1B2A21";
  return (
    <div className="p-[18px_20px]" style={surfaceCard}>
      <p className="text-[12.5px] mb-2" style={{ color: "#5B6B60" }}>{label}</p>
      <p className="text-[26px] font-semibold tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

export default function Reports({ batches, settings }) {
  const stats = batches.length
    ? (() => {
        const avg = batches.reduce((s, b) => s + (b.average_moisture || 0), 0) / batches.length;
        const passed = batches.filter((b) => b.status === "Passed").length;
        const counts = { 1: 0, 2: 0, 3: 0 };
        batches.forEach((b) => { if (b.status !== "Rejected") counts[b.grade] = (counts[b.grade] || 0) + 1; });
        const top = [1, 2, 3].sort((a, c) => counts[c] - counts[a])[0];
        return { total: batches.length, avg, passRate: passed / batches.length, counts, top };
      })()
    : null;

  const byDay = {};
  batches.forEach((b) => {
    const k = (b.created_date || "").slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  });

  const target = settings.complianceTarget / 100;
  const compliant = stats && stats.passRate >= target;

  return (
    <div>
      <h1 className="text-[19px] font-semibold m-0 mb-1">Reports</h1>
      <p className="text-[13px] m-0 mb-5" style={{ color: "#5B6B60" }}>Summary of grading performance and PNS/BAFS 43:2009 compliance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <Kpi label="Total batches" value={batches.length} />
        <Kpi label="Overall pass rate" value={stats ? Math.round(stats.passRate * 100) + "%" : "—"} tone="good" />
        <Kpi label="Average moisture" value={stats ? stats.avg.toFixed(1) + "%" : "—"} />
        <Kpi label="Most common grade" value={stats && stats.counts[stats.top] > 0 ? "Grade " + stats.top : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Grade breakdown</p>
          {!stats ? (
            <p className="text-[13px]" style={{ color: "#8B978E" }}>No data yet.</p>
          ) : [1, 2, 3].map((g) => {
            const count = stats.counts[g] || 0;
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={g} className="flex items-center gap-2.5 mb-3 text-[13px]">
                <span className="w-16 flex-shrink-0 font-semibold">Grade {g}</span>
                <span className="flex-1 rounded-lg h-2.5 overflow-hidden" style={{ background: "#EFEEE8" }}>
                  <span className="block h-full rounded-lg" style={{ width: pct + "%", background: gradeColors[g] }} />
                </span>
                <span className="w-11 text-right flex-shrink-0" style={{ color: "#5B6B60" }}>{pct}%</span>
              </div>
            );
          })}
          {stats && <p className="text-[11.5px] mt-2" style={{ color: "#8B978E" }}>Ranges: Grade 1 {gradeRangeLabel(1)} · Grade 2 {gradeRangeLabel(2)} · Grade 3 {gradeRangeLabel(3)}</p>}
        </div>
        <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Grade share</p>
          <GradeDoughnut counts={stats ? stats.counts : { 1: 0, 2: 0, 3: 0 }} />
        </div>
      </div>

      <div className="p-5 mb-3.5" style={surfaceCard}>
        <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Batches graded per day</p>
        <TrendChart byDay={byDay} />
      </div>

      <div className="flex items-center justify-between gap-2.5 rounded-[14px] px-5 py-3 mb-3.5"
        style={{ background: compliant ? "#DCEBE1" : stats ? "#F6E9CE" : "#DCEBE1" }}>
        <div className="flex items-center gap-2.5">
          {compliant || !stats ? <ShieldCheck size={18} style={{ color: "#2F6E48" }} /> : <AlertTriangle size={18} style={{ color: "#B8862E" }} />}
          <span className="text-[13.5px] font-semibold" style={{ color: compliant || !stats ? "#1C3B29" : "#7A5A1E" }}>
            {!stats ? "No data yet" : compliant ? "Compliant with PNS/BAFS 43:2009" : "Below target compliance — review flagged/rejected batches"}
          </span>
        </div>
        <span className="text-[12.5px]" style={{ color: "#5B6B60" }}>
          {stats ? `${Math.round(stats.passRate * 100)}% pass rate (target ${settings.complianceTarget}%)` : ""}
        </span>
      </div>

      <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold"
        style={{ background: "#EFEEE8", border: "1px solid #E1DFD5", color: "#1B2A21" }}>
        <Printer size={15} /> Print / Save as PDF
      </button>
    </div>
  );
}