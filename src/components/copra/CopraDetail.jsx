import React from "react";
import { X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { colorLabel, textureLabel, moldLabel, gradeRangeLabel, fmtDate } from "@/lib/copraGrading";

const DEFAULT_COPRA_IMG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23EFEDE4'/%3E%3Cellipse cx='200' cy='150' rx='110' ry='70' fill='%23C9A66B'/%3E%3Cellipse cx='200' cy='150' rx='80' ry='45' fill='%23E8D5A8'/%3E%3C/svg%3E";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b" style={{ borderColor: "#E1DFD5" }}>
      <span className="text-[12.5px]" style={{ color: "#5B6B60" }}>{label}</span>
      <span className="text-[13px] font-medium text-right">{value}</span>
    </div>
  );
}

export default function CopraDetail({ sample, batch, onClose }) {
  if (!sample) return null;
  const img = sample.image || DEFAULT_COPRA_IMG;
  const moisturePct = (sample.moisture || 0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,26,21,0.55)" }} onClick={onClose}>
      <div className="w-full max-w-[680px] max-h-[90vh] overflow-y-auto" style={surfaceCard} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#E1DFD5" }}>
          <div>
            <h2 className="text-[16px] font-semibold m-0">Copra #{sample.copra_number}</h2>
            <p className="text-[12px] m-0 mt-0.5" style={{ color: "#5B6B60" }}>Batch {sample.batch_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#5B6B60" }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-5">
          <div className="rounded-[12px] overflow-hidden" style={{ background: "#EFEEE8" }}>
            <Image src={img} alt={`Copra #${sample.copra_number}`} className="w-full h-[260px]" fittingType="fill" />
          </div>
          <div>
            <Row label="Copra number" value={`#${sample.copra_number}`} />
            <Row label="Batch ID" value={sample.batch_id} />
            <Row label="Moisture" value={`${moisturePct}%`} />
            <Row label="Color" value={colorLabel(sample.color)} />
            <Row label="Texture" value={textureLabel(sample.texture)} />
            <Row label="Mold detected" value={sample.mold ? "Yes" : "No"} />
            {batch && <Row label="Batch grade" value={`Grade ${batch.grade} (${gradeRangeLabel(batch.grade)})`} />}
            <Row label="Recorded" value={fmtDate(sample.created_date)} />
          </div>
        </div>
      </div>
    </div>
  );
}