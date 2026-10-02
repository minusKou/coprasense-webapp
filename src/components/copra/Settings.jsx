import React, { useState } from "react";
import { Save, RefreshCw, Database, Trash2 } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/lib/copraGrading";
import Probing from "./Probing";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };
const fieldCls = "rounded-lg px-2.5 py-2 text-[13.5px] focus:outline-none";
const fieldStyle = { border: "1px solid #E1DFD5", background: "#EFEEE8", color: "#1B2A21" };

export default function Settings({ settings, onSave, onReset, batches, onClearAll, onLoadSample, samplesByBatch, onRecomputeAll }) {
  const [form, setForm] = useState(settings);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const nums = ["grade1Max", "grade2Max", "grade3Max", "flagAt", "complianceTarget"];
    if (nums.some((n) => isNaN(parseFloat(form[n])))) return;
    onSave({
      ...form,
      grade1Max: parseFloat(form.grade1Max),
      grade2Max: parseFloat(form.grade2Max),
      grade3Max: parseFloat(form.grade3Max),
      flagAt: parseFloat(form.flagAt),
      complianceTarget: parseFloat(form.complianceTarget),
    });
  };

  return (
    <div>
      <h1 className="text-[19px] font-semibold m-0 mb-1">Settings</h1>
      <p className="text-[13px] m-0 mb-5" style={{ color: "#5B6B60" }}>Configure grading thresholds, branding, and manage system data.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#5B6B60" }}>Grading thresholds</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Organization / system name</label>
              <input value={form.orgName} onChange={(e) => set("orgName", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Grade 1 max moisture (%)</label>
              <input type="number" step="0.1" min="0" max="40" value={form.grade1Max} onChange={(e) => set("grade1Max", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Grade 2 max moisture (%)</label>
              <input type="number" step="0.1" min="0" max="40" value={form.grade2Max} onChange={(e) => set("grade2Max", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Grade 3 max moisture (%)</label>
              <input type="number" step="0.1" min="0" max="40" value={form.grade3Max} onChange={(e) => set("grade3Max", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Flag above moisture (%)</label>
              <input type="number" step="0.1" min="0" max="40" value={form.flagAt} onChange={(e) => set("flagAt", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px]" style={{ color: "#5B6B60" }}>Compliance target (%)</label>
              <input type="number" step="1" min="1" max="100" value={form.complianceTarget} onChange={(e) => set("complianceTarget", e.target.value)} className={fieldCls} style={fieldStyle} />
            </div>
          </div>
          <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>
            Defaults: Grade 1 (6.0–7.9%), Grade 2 (8.0–10.9%), Grade 3 (11.0–13.0%). Moisture below 6% or above 13% is rejected. Dark color, brittle texture, or detected mold flags an otherwise-passing batch. Use "Recompute all" to re-grade existing records.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white" style={{ background: "#1C3B29" }}>
              <Save size={15} /> Save settings
            </button>
            <button onClick={onReset} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold" style={{ background: "#EFEEE8", border: "1px solid #E1DFD5", color: "#1B2A21" }}>
              <RefreshCw size={15} /> Reset to defaults
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Probing />
          <div className="p-5" style={surfaceCard}>
          <p className="text-[12.5px] mb-1" style={{ color: "#5B6B60" }}>Data management</p>
          <p className="text-[12.5px] mb-3.5" style={{ color: "#8B978E" }}>Load demo data or re-grade existing batches under the current thresholds.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onLoadSample} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold" style={{ background: "#EFEEE8", border: "1px solid #E1DFD5", color: "#1B2A21" }}>
              <Database size={15} /> Load sample data
            </button>
            <button onClick={onRecomputeAll} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold" style={{ background: "#EFEEE8", border: "1px solid #E1DFD5", color: "#1B2A21" }}>
              <RefreshCw size={15} /> Recompute all batches
            </button>
          </div>

          <div className="rounded-[14px] p-4 mt-4" style={{ border: "1px solid #F6DEDB" }}>
            <p className="text-[12.5px] font-medium m-0" style={{ color: "#5B6B60" }}>Danger zone</p>
            <p className="text-[12.5px] m-0 mt-1 mb-3" style={{ color: "#5B6B60" }}>Permanently remove every recorded batch and its copra samples. Settings are kept.</p>
            <button onClick={onClearAll} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold" style={{ background: "#F6DEDB", border: "1px solid #F6DEDB", color: "#B4453B" }}>
              <Trash2 size={14} /> Clear all batch data
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}