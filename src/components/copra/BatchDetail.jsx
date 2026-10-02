import React, { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { GradePill, StatusBadge } from "./Badges";
import LiveCamera from "./LiveCamera";
import SampleAcquisition from "./SampleAcquisition";
import CopraDetail from "./CopraDetail";
import { colorLabel, textureLabel, moldLabel, gradeRangeLabel } from "@/lib/copraGrading";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

export default function BatchDetail({ batch, samples, settings, onAddSample, onDeleteSample, onBack, onNavigate }) {
  const openSettings = () => onNavigate && onNavigate("settings");
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-4" style={{ color: "#2F6E48" }}>
        <ArrowLeft size={15} /> Back to dashboard
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: batch.status === "Rejected" ? "#3A2722" : batch.status === "Flagged" ? "#F6DEDB" : "#DCEBE1" }}
        >
          <span style={{ color: batch.status === "Rejected" ? "#FFD9D2" : batch.status === "Flagged" ? "#B4453B" : "#2F6E48" }}>
            {batch.status === "Rejected" ? "✕" : batch.status === "Flagged" ? "⚑" : "✓"}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-[19px] font-semibold m-0">Batch #{batch.batch_id}</h1>
          <p className="text-[13px] m-0 mt-0.5" style={{ color: "#5B6B60" }}>
            {batch.status === "Rejected" ? "Rejected — moisture outside 6–13%" : `Grade ${batch.grade} (${gradeRangeLabel(batch.grade)})`} · {samples?.length || 0} copra samples
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GradePill grade={batch.grade} status={batch.status} />
          <StatusBadge status={batch.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 mb-4">
        <LiveCamera onOpenSettings={openSettings} />
        <SampleAcquisition batch={batch} settings={settings} onAddSample={onAddSample} onOpenSettings={openSettings} />
      </div>

      <div className="p-5" style={surfaceCard}>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[12.5px]" style={{ color: "#5B6B60" }}>Copra samples in this batch</p>
          <span className="text-[12.5px]" style={{ color: "#8B978E" }}>Avg moisture {(batch.average_moisture || 0).toFixed(1)}%</span>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#5B6B60" }}>
                {["Copra #", "Moisture", "Color", "Texture", "Mold", ""].map((h, i) => (
                  <th key={i} className="text-left font-medium px-2 pb-2.5 border-b" style={{ borderColor: "#E1DFD5" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!samples || !samples.length) ? (
                <tr><td colSpan={6} className="py-3 text-[13px]" style={{ color: "#8B978E" }}>No copra samples yet — capture and read the first one above.</td></tr>
              ) : [...samples].sort((a, b) => (a.copra_number || 0) - (b.copra_number || 0)).map((s) => (
                <tr key={s.id} className="border-b cursor-pointer" style={{ borderColor: "#E1DFD5" }} onClick={() => setSelected(s)}>
                  <td className="px-2 py-2.5 font-medium" style={{ color: "#2F6E48" }}>#{s.copra_number}</td>
                  <td className="px-2 py-2.5">{s.moisture.toFixed(1)}%</td>
                  <td className="px-2 py-2.5">{colorLabel(s.color)}</td>
                  <td className="px-2 py-2.5">{textureLabel(s.texture)}</td>
                  <td className="px-2 py-2.5" style={{ color: s.mold ? "#B4453B" : "#5B6B60" }}>{s.mold ? moldLabel(s.mold) : "—"}</td>
                  <td className="px-2 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); onDeleteSample(s.id, batch.batch_id); }} className="p-1" style={{ color: "#8B978E" }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <CopraDetail sample={selected} batch={batch} onClose={() => setSelected(null)} />}
    </div>
  );
}