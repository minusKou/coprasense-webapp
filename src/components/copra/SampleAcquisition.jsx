import React, { useState } from "react";
import { Crosshair, FlaskConical, Plus, WifiOff, AlertTriangle } from "lucide-react";
import { Image } from "@/components/ui/image";
import { api } from "@/api/client";
import { colorLabel, textureLabel, moldLabel } from "@/lib/copraGrading";
import { useDevices } from "@/lib/devices";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };
const inset = { background: "#F6F5F0", border: "1px solid #E1DFD5", borderRadius: "12px" };

const COLOR_DESC = {
  standard: "light golden-brown",
  "slightly-dark": "medium dark-brown",
  dark: "dark roasted-brown",
};
const TEXTURE_DESC = {
  firm: "firm intact halves",
  soft: "soft slightly crumbly pieces",
  brittle: "brittle fragmented shards",
};
const copraPrompt = (color, texture, mold) =>
  `Close-up macro photograph of ${COLOR_DESC[color] || "dried"} dried coconut copra, ${TEXTURE_DESC[texture] || "pieces"}${mold ? ", with a few visible mold spots on the surface" : ""}, on a clean light inspection surface, even studio lighting, sharp realistic detail, food quality control context.`;

export default function SampleAcquisition({ batch, settings, onAddSample, onOpenSettings }) {
  const devices = useDevices();
  const camOk = devices.cam;
  const espOk = devices.esp;

  const [captured, setCaptured] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [moistureReading, setMoistureReading] = useState(null);
  const [reading, setReading] = useState(false);
  const [adding, setAdding] = useState(false);

  const nextNumber = (batch.sample_count || 0) + 1;
  const rejectMin = settings?.rejectMin ?? 6;
  const rejectMax = settings?.rejectMax ?? 13;
  const wouldReject = moistureReading != null && (moistureReading < rejectMin || moistureReading > rejectMax);
  const canAdd = captured && moistureReading != null && !adding;

  const capture = async () => {
    if (!camOk) return;
    setCapturing(true);
    setCaptured(null);
    const colors = ["standard", "standard", "standard", "slightly-dark", "slightly-dark", "dark"];
    const textures = ["firm", "firm", "firm", "soft", "brittle"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const texture = textures[Math.floor(Math.random() * textures.length)];
    const mold = Math.random() < 0.18;
    try {
      const res = await api.integrations.Core.GenerateImage({ prompt: copraPrompt(color, texture, mold) });
      setCaptured({ color, texture, mold, image: res.url });
    } catch {
      setCaptured({ color, texture, mold });
    } finally {
      setCapturing(false);
    }
  };

  const read = () => {
    if (!espOk) return;
    setReading(true);
    setMoistureReading(null);
    setTimeout(() => {
      setMoistureReading(+(4 + Math.random() * 10.5).toFixed(2));
      setReading(false);
    }, 950);
  };

  const acquiring = capturing || reading;
  const acquire = () => {
    if (!camOk || !espOk) return;
    capture();
    read();
  };

  const add = async () => {
    if (!canAdd) return;
    setAdding(true);
    try {
      await onAddSample(batch.batch_id, moistureReading, captured.color, captured.texture, captured.mold, captured.image);
      setCaptured(null);
      setMoistureReading(null);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-5" style={surfaceCard}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
          <Crosshair size={17} style={{ color: "#2F6E48" }} /> Sample acquisition
        </span>
        <span className="text-[12px]" style={{ color: "#8B978E" }}>Copra #{nextNumber}</span>
      </div>

      {(!camOk || !espOk) && (
        <div className="flex items-center gap-2 rounded-[12px] px-3.5 py-2.5 mb-3.5" style={{ background: "#F6E9CE", border: "1px solid #E9D9A8" }}>
          <AlertTriangle size={15} style={{ color: "#B8862E" }} />
          <span className="text-[12.5px]" style={{ color: "#7A5A1E" }}>
            {!camOk && !espOk ? "Camera and NIR sensor not connected."
              : !camOk ? "Camera not connected."
              : "NIR sensor not connected."}{" "}
            <button onClick={onOpenSettings} className="font-semibold" style={{ color: "#B8862E" }}>Probe in Settings →</button>
          </span>
        </div>
      )}

      <button onClick={acquire} disabled={acquiring || !camOk || !espOk}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full mb-3.5"
        style={{ background: "#1C3B29" }}>
        <Crosshair size={16} /> {acquiring ? "Acquiring camera + NIR…" : "Acquire sample (camera + NIR)"}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Camera capture */}
        <div className="rounded-[12px] p-4" style={inset}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><Crosshair size={14} style={{ color: "#B8862E" }} /> Camera capture</span>
            <span className="text-[11px]" style={{ color: "#8B978E" }}>color · texture · mold</span>
          </div>
          <button onClick={capture} disabled={capturing || !camOk}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full justify-center"
            style={{ background: "#1C3B29" }}>
            {camOk ? <Crosshair size={15} /> : <WifiOff size={15} />} {capturing ? "Capturing…" : "Capture sample"}
          </button>
          {captured ? (
            <div className="mt-3 text-[13px]" style={{ color: "#1B2A21" }}>
              {captured.image && (
                <div className="rounded-[10px] overflow-hidden mb-2.5" style={{ background: "#EFEEE8" }}>
                  <Image src={captured.image} alt="Captured copra" className="w-full h-[120px]" fittingType="fill" />
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}><span style={{ color: "#5B6B60" }}>Color</span><span className="font-medium">{colorLabel(captured.color)}</span></div>
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}><span style={{ color: "#5B6B60" }}>Texture</span><span className="font-medium">{textureLabel(captured.texture)}</span></div>
              <div className="flex justify-between py-1.5"><span style={{ color: "#5B6B60" }}>Mold</span>
                <span className="font-medium" style={{ color: captured.mold ? "#B4453B" : "#2F6E48" }}>{moldLabel(captured.mold)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>{capturing ? "Running inference…" : !camOk ? "Connect the camera to capture." : "Click to analyze the sample in frame."}</p>
          )}
        </div>

        {/* NIR moisture */}
        <div className="rounded-[12px] p-4" style={inset}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><FlaskConical size={14} style={{ color: "#2F6E48" }} /> NIR moisture</span>
            <span className="text-[11px]" style={{ color: "#8B978E" }}>moisture reading</span>
          </div>
          <button onClick={read} disabled={reading || !espOk}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full justify-center"
            style={{ background: "#2F6E48" }}>
            {espOk ? <FlaskConical size={15} /> : <WifiOff size={15} />} {reading ? "Reading…" : "Read moisture"}
          </button>
          {moistureReading != null ? (
            <div className="mt-3 text-[13px]" style={{ color: "#1B2A21" }}>
              <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}>
                <span style={{ color: "#5B6B60" }}>Moisture</span>
                <span className="font-semibold text-[15px]">{moistureReading.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span style={{ color: "#5B6B60" }}>Grade preview</span>
                <span className="font-semibold" style={{ color: wouldReject ? "#B4453B" : "#2F6E48" }}>
                  {wouldReject ? `Reject (outside ${rejectMin}–${rejectMax}%)` : "Within grade range"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>{reading ? "Sensing…" : !espOk ? "Connect the NIR sensor to read." : "Click to take a moisture reading."}</p>
          )}
        </div>
      </div>

      <button onClick={add} disabled={!canAdd}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full mt-3.5"
        style={{ background: "#1C3B29" }}>
        <Plus size={15} /> {adding ? "Adding…" : `Add copra #${nextNumber} to batch`}
      </button>
      {!canAdd && <p className="text-[12px] mt-2 text-center" style={{ color: "#8B978E" }}>Capture a sample and read moisture to add this copra.</p>}
    </div>
  );
}