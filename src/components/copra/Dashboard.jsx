import React, { useState } from "react";
import { Plus, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { GradePill, StatusBadge } from "./Badges";
import { GradeBarChart } from "./Charts";
import { colorLabel, textureLabel, nextBatchId, fmtDate } from "@/lib/copraGrading";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

function Kpi({ label, value, tone }) {
  const color = tone === "good" ? "#2F6E48" : tone === "warn" ? "#B8862E" : tone === "bad" ? "#B4453B" : "#1B2A21";
  return (
    <div className="p-[18px_20px]" style={surfaceCard}>
      <p className="text-[12.5px] mb-2" style={{ color: "#5B6B60" }}>{label}</p>
      <p className="text-[26px] font-semibold tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

export default function Dashboard({ batches, samplesByBatch, settings, onCreateBatch, onOpenBatch, onNavigate }) {
  const [batchId, setBatchId] = useState("");

  const stats = batches.length
    ? (() => {
        const avg = batches.reduce((s, b) => s + (b.average_moisture || 0), 0) / batches.length;
        const passed = batches.filter((b) => b.status === "Passed").length;
        const counts = { 1: 0, 2: 0, 3: 0 };
        batches.forEach((b) => { if (b.status !== "Rejected") counts[b.grade] = (counts[b.grade] || 0) + 1; });
        return { total: batches.length, avg, passed, flagged: batches.length - passed, passRate: passed / batches.length, counts };
      })()
    : null;

  const handleCreate = (e) => {
    e.preventDefault();
    const id = batchId.trim() || nextBatchId(batches);
    onCreateBatch(id);
    setBatchId("");
  };

  const target = settings.complianceTarget / 100;
  const compliant = stats && stats.passRate >= target;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <Kpi label="Batches graded" value={batches.length} />
        <Kpi label="Average moisture content" value={stats ? stats.avg.toFixed(1) + "%" : "—"} />
        <Kpi label="Pass rate" value={stats ? Math.round(stats.passRate * 100) + "%" : "—"} tone="good" />
        <Kpi label="Flagged / rejected" value={stats ? stats.flagged : 0} tone="warn" />
      </div>

      <div className="p-5 mb-3.5" style={surfaceCard}>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[12.5px] font-medium" style={{ color: "#5B6B60" }}>Start a new batch</p>
          <span className="text-[11.5px]" style={{ color: "#8B978E" }}>Enter a batch ID, then add copra samples (1 → ∞)</span>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-[1.1fr_auto] gap-2.5 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Batch ID</label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder={`Auto (e.g. ${nextBatchId(batches)})`}
              className="rounded-lg px-2.5 py-2 text-[13.5px] focus:outline-none"
              style={{ border: "1px solid #E1DFD5", background: "#EFEEE8", color: "#1B2A21" }}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white whitespace-nowrap"
            style={{ background: "#1C3B29" }}
          >
            <Plus size={15} /> Create batch
          </button>
        </form>
        <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>
          Adjust grading thresholds in{" "}
          <button onClick={() => onNavigate("settings")} className="font-semibold" style={{ color: "#2F6E48" }}>Settings</button>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-3.5 mb-3.5">
        <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Most recent batch</p>
          {!batches.length ? (
            <p className="text-[13px] py-2" style={{ color: "#8B978E" }}>No batches yet — create one above.</p>
          ) : (
            <RecentBatch batch={batches[0]} samples={samplesByBatch[batches[0].batch_id] || []} onOpen={() => onOpenBatch(batches[0])} />
          )}
        </div>
        <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Grade distribution</p>
          <GradeBarChart counts={stats ? stats.counts : { 1: 0, 2: 0, 3: 0 }} />
          <div className="flex gap-4 mt-2.5 text-xs" style={{ color: "#5B6B60" }}>
            {[1, 2, 3].map((g) => (
              <span key={g} className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ["#2F6E48", "#B8862E", "#B4453B"][g - 1] }} />
                Grade {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-2.5 rounded-[14px] px-5 py-3 mb-3.5"
        style={{ background: compliant ? "#DCEBE1" : stats ? "#F6E9CE" : "#DCEBE1" }}
      >
        <div className="flex items-center gap-2.5">
          {compliant || !stats ? <ShieldCheck size={18} style={{ color: "#2F6E48" }} /> : <AlertTriangle size={18} style={{ color: "#B8862E" }} />}
          <span className="text-[13.5px] font-semibold" style={{ color: compliant || !stats ? "#1C3B29" : "#7A5A1E" }}>
            {!stats ? "No data yet" : compliant ? "Compliant with PNS/BAFS 43:2009" : "Below target compliance — review flagged/rejected batches"}
          </span>
        </div>
        <span className="text-[12.5px]" style={{ color: "#5B6B60" }}>
          {stats ? `${stats.passed} of ${stats.total} batches passed (${Math.round(stats.passRate * 100)}%, target ${settings.complianceTarget}%)` : "Add batches to check compliance"}
        </span>
      </div>

      <div className="p-5" style={surfaceCard}>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[12.5px]" style={{ color: "#5B6B60" }}>Recent batches</p>
          <button onClick={() => onNavigate("history")} className="text-[13px] font-semibold inline-flex items-center gap-1" style={{ color: "#2F6E48" }}>
            View all in Grading history <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#5B6B60" }}>
                {["Batch", "Grade", "Avg moisture", "Samples", "Status", "Date", ""].map((h, i) => (
                  <th key={i} className="text-left font-medium px-2 pb-2.5 border-b" style={{ borderColor: "#E1DFD5" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!batches.length ? (
                <tr><td colSpan={7} className="py-3 text-[13px]" style={{ color: "#8B978E" }}>No batches recorded yet.</td></tr>
              ) : batches.slice(0, 5).map((b) => (
                <tr key={b.id} className="border-b" style={{ borderColor: "#E1DFD5" }}>
                  <td className="px-2 py-2.5">{b.batch_id}</td>
                  <td className="px-2 py-2.5"><GradePill grade={b.grade} status={b.status} /></td>
                  <td className="px-2 py-2.5">{(b.average_moisture || 0).toFixed(1)}%</td>
                  <td className="px-2 py-2.5">{b.sample_count || 0}</td>
                  <td className="px-2 py-2.5"><StatusBadge status={b.status} /></td>
                  <td className="px-2 py-2.5">{fmtDate(b.created_date)}</td>
                  <td className="px-2 py-2.5">
                    <button onClick={() => onOpenBatch(b)} className="text-[13px] font-semibold" style={{ color: "#2F6E48" }}>Open →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RecentBatch({ batch, samples, onOpen }) {
  const rejected = batch.status === "Rejected";
  const flagged = batch.status === "Flagged";
  const tone = rejected
    ? { bg: "#3A2722", fg: "#FFD9D2", icon: "✕" }
    : flagged
    ? { bg: "#F6DEDB", fg: "#B4453B", icon: "⚑" }
    : { bg: "#DCEBE1", fg: "#2F6E48", icon: "✓" };
  return (
    <div>
      <div className="flex items-center gap-3 mb-3.5">
        <div
          className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: tone.bg }}
        >
          <span style={{ color: tone.fg }}>{tone.icon}</span>
        </div>
        <div>
          <p className="text-[15px] font-semibold m-0">Batch #{batch.batch_id}</p>
          <p className="text-[12.5px] m-0 mt-0.5" style={{ color: "#5B6B60" }}>Grade {batch.grade} · {batch.sample_count || 0} copra samples</p>
        </div>
      </div>
      <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
        <tbody>
          <tr><td style={{ color: "#5B6B60" }}>Avg moisture</td><td className="text-right font-medium">{(batch.average_moisture || 0).toFixed(1)}%</td></tr>
          <tr className="border-t" style={{ borderColor: "#E1DFD5" }}><td className="py-1.5" style={{ color: "#5B6B60" }}>Colors</td><td className="text-right font-medium py-1.5">{[...new Set(samples.map((s) => colorLabel(s.color)))].join(", ") || "—"}</td></tr>
          <tr className="border-t" style={{ borderColor: "#E1DFD5" }}><td className="py-1.5" style={{ color: "#5B6B60" }}>Textures</td><td className="text-right font-medium py-1.5">{[...new Set(samples.map((s) => textureLabel(s.texture)))].join(", ") || "—"}</td></tr>
          <tr className="border-t" style={{ borderColor: "#E1DFD5" }}><td className="py-1.5" style={{ color: "#5B6B60" }}>Status</td><td className="text-right font-medium py-1.5">{batch.status}</td></tr>
        </tbody>
      </table>
      <button onClick={onOpen} className="mt-3 text-[13px] font-semibold" style={{ color: "#2F6E48" }}>Open batch →</button>
    </div>
  );
}