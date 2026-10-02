import React, { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { GradePill, StatusBadge } from "./Badges";
import { fmtDate } from "@/lib/copraGrading";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

export default function History({ batches, onOpenBatch, onDeleteBatch }) {
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  let list = [...batches];
  const q = search.trim().toLowerCase();
  if (q) list = list.filter((b) => b.batch_id.toLowerCase().includes(q));
  if (grade !== "all") list = list.filter((b) => String(b.grade) === grade);
  if (status !== "all") list = list.filter((b) => b.status === status);
  switch (sort) {
    case "oldest": list.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); break;
    case "moisture-desc": list.sort((a, b) => (b.average_moisture || 0) - (a.average_moisture || 0)); break;
    case "moisture-asc": list.sort((a, b) => (a.average_moisture || 0) - (b.average_moisture || 0)); break;
    default: list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }

  const exportCsv = () => {
    if (!list.length) return;
    const header = "batch,grade,average_moisture,sample_count,status,created_date";
    const rows = list.map((b) => [b.batch_id, b.grade, b.average_moisture, b.sample_count, b.status, b.created_date].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "copra_grading_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fieldCls = "rounded-lg px-2.5 py-2 text-[13.5px] focus:outline-none";
  const fieldStyle = { border: "1px solid #E1DFD5", background: "#EFEEE8", color: "#1B2A21" };

  return (
    <div>
      <h1 className="text-[19px] font-semibold m-0 mb-1">Grading history</h1>
      <p className="text-[13px] m-0 mb-5" style={{ color: "#5B6B60" }}>Full record of graded batches. Search, filter, and export.</p>

      <div className="p-5 mb-3.5" style={surfaceCard}>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2.5 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Search batch ID</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. CP-0231" className={fieldCls} style={fieldStyle} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className={fieldCls} style={fieldStyle}>
              <option value="all">All grades</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
              <option value="3">Grade 3</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldCls} style={fieldStyle}>
              <option value="all">All statuses</option>
              <option value="Passed">Passed</option>
              <option value="Flagged">Flagged</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Sort by</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={fieldCls} style={fieldStyle}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="moisture-desc">Moisture (high–low)</option>
              <option value="moisture-asc">Moisture (low–high)</option>
            </select>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap"
            style={{ background: "#EFEEE8", border: "1px solid #E1DFD5", color: "#1B2A21" }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
        <p className="text-[12.5px] mt-2.5" style={{ color: "#8B978E" }}>{list.length} of {batches.length} batch{batches.length === 1 ? "" : "es"} shown</p>
      </div>

      <div className="p-5" style={surfaceCard}>
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#5B6B60" }}>
                {["Batch", "Grade", "Avg moisture", "Samples", "Status", "Date", ""].map((h, i) => (
                  <th key={i} className="text-left font-medium px-2 pb-2.5 border-b" style={{ borderColor: "#E1DFD5" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!list.length ? (
                <tr><td colSpan={7} className="py-3 text-[13px]" style={{ color: "#8B978E" }}>No batches match these filters.</td></tr>
              ) : list.map((b) => (
                <tr key={b.id} className="border-b" style={{ borderColor: "#E1DFD5" }}>
                  <td className="px-2 py-2.5"><button onClick={() => onOpenBatch(b)} className="font-semibold" style={{ color: "#2F6E48" }}>{b.batch_id}</button></td>
                  <td className="px-2 py-2.5"><GradePill grade={b.grade} status={b.status} /></td>
                  <td className="px-2 py-2.5">{(b.average_moisture || 0).toFixed(1)}%</td>
                  <td className="px-2 py-2.5">{b.sample_count || 0}</td>
                  <td className="px-2 py-2.5"><StatusBadge status={b.status} /></td>
                  <td className="px-2 py-2.5">{fmtDate(b.created_date)}</td>
                  <td className="px-2 py-2.5">
                    <button onClick={() => onDeleteBatch(b)} className="p-1" style={{ color: "#8B978E" }}><Trash2 size={15} /></button>
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