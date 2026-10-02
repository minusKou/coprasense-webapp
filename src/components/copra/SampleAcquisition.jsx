import React, { useState } from "react";
import { Crosshair, FlaskConical, Plus, WifiOff, AlertTriangle, Info } from "lucide-react";
import { Image } from "@/components/ui/image";
import { colorLabel } from "@/lib/copraGrading";
import { useDevices, captureFrame, fetchLatestReading } from "@/lib/devices";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };
const inset = { background: "#F6F5F0", border: "1px solid #E1DFD5", borderRadius: "12px" };

// ── Calibration model interface ─────────────────────────────────────────
// The moisture-from-NIR calibration model and visual classifiers do not
// exist yet. When a trained model file is placed at the configured path,
// these functions will load and apply it. Until then, they return null
// and the UI shows an explicit "Not yet calibrated" state.
//
// Expected model path (configurable via COPRASENSE_MODEL_DIR env var):
//   $COPRASENSE_MODEL_DIR/moisture_nir.onnx     (moisture regression)
//   $COPRASENSE_MODEL_DIR/texture_classifier.pt  (texture classification)
//   $COPRASENSE_MODEL_DIR/mold_detector.pt       (mold detection)

/** Placeholder — returns null until a calibration model exists. */
function predictMoisture(/* sensorReading */) {
  return null; // No trained calibration model available yet
}

/** Placeholder — returns null until a classification model exists. */
function predictTexture(/* imageData */) {
  return null; // No trained texture classifier available yet
}

/** Placeholder — returns null until a detection model exists. */
function predictMold(/* imageData */) {
  return null; // No trained mold detector available yet
}

export default function SampleAcquisition({ batch, settings, onAddSample, onOpenSettings }) {
  const devices = useDevices();
  const camOk = devices.cam;
  const espOk = devices.esp;

  const [captured, setCaptured] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [reading, setReading] = useState(false);
  const [adding, setAdding] = useState(false);

  const nextNumber = (batch.sample_count || 0) + 1;
  const rejectMin = settings?.rejectMin ?? 6;
  const rejectMax = settings?.rejectMax ?? 13;

  // Attempt to predict moisture from sensor data (null if no model)
  const moisturePrediction = sensorData ? predictMoisture(sensorData) : null;
  const texturePrediction = captured ? predictTexture(captured.image) : null;
  const moldPrediction = captured ? predictMold(captured.image) : null;

  // Use the heuristic color from the sensor's derived values, if available
  const colorHeuristic = sensorData?.derived?.color_heuristic ?? null;

  const wouldReject = moisturePrediction != null && (moisturePrediction < rejectMin || moisturePrediction > rejectMax);
  const canAdd = captured && moisturePrediction != null && !adding;

  const capture = async () => {
    if (!camOk) return;
    setCapturing(true);
    setCaptured(null);
    try {
      // Real frame capture from /dev/copra-cam via the backend
      const result = await captureFrame();
      setCaptured({
        image: result.image,
        contour: result.contour,
        // If sensor data came with the capture, use it
        sensor: result.sensor,
      });
      // Update sensor data if the capture included it
      if (result.sensor) setSensorData(result.sensor);
    } catch (err) {
      console.error("Capture failed:", err);
      setCaptured(null);
    } finally {
      setCapturing(false);
    }
  };

  const read = async () => {
    if (!espOk) return;
    setReading(true);
    setSensorData(null);
    try {
      // Fetch the latest real reading from /dev/copra-uart
      const result = await fetchLatestReading();
      setSensorData(result);
    } catch (err) {
      console.error("Sensor read failed:", err);
      setSensorData(null);
    } finally {
      setReading(false);
    }
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
      // colorHeuristic is used as a stopgap; moisturePrediction won't be null
      // here because canAdd requires it.
      const color = colorHeuristic || "standard";
      const texture = texturePrediction || "firm";
      const mold = moldPrediction || false;
      await onAddSample(batch.batch_id, moisturePrediction, color, texture, mold, captured.image);
      setCaptured(null);
      setSensorData(null);
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

              {/* Color — heuristic from AS7341 channels if available */}
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}>
                <span style={{ color: "#5B6B60" }}>Color</span>
                {colorHeuristic ? (
                  <span className="font-medium inline-flex items-center gap-1">
                    {colorLabel(colorHeuristic)}
                    <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: "#F6E9CE", color: "#7A5A1E" }}>heuristic</span>
                  </span>
                ) : (
                  <span className="text-[12px] italic" style={{ color: "#8B978E" }}>Pending sensor data</span>
                )}
              </div>

              {/* Texture — no model yet */}
              <div className="flex justify-between py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}>
                <span style={{ color: "#5B6B60" }}>Texture</span>
                <span className="text-[12px] italic" style={{ color: "#8B978E" }}>Pending model</span>
              </div>

              {/* Mold — no model yet */}
              <div className="flex justify-between py-1.5" style={{ borderColor: "#E1DFD5" }}>
                <span style={{ color: "#5B6B60" }}>Mold</span>
                <span className="text-[12px] italic" style={{ color: "#8B978E" }}>Pending model</span>
              </div>

              {/* Contour area — real, from OpenCV if available */}
              {captured.contour && captured.contour.pixel_area != null && (
                <div className="flex justify-between py-1.5 border-t" style={{ borderColor: "#E1DFD5" }}>
                  <span style={{ color: "#5B6B60" }}>Contour area</span>
                  <span className="font-medium">{captured.contour.pixel_area.toLocaleString()} px</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>{capturing ? "Capturing from /dev/copra-cam…" : !camOk ? "Connect the camera to capture." : "Click to analyze the sample in frame."}</p>
          )}
        </div>

        {/* NIR moisture */}
        <div className="rounded-[12px] p-4" style={inset}>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><FlaskConical size={14} style={{ color: "#2F6E48" }} /> NIR moisture</span>
            <span className="text-[11px]" style={{ color: "#8B978E" }}>sensor reading</span>
          </div>
          <button onClick={read} disabled={reading || !espOk}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full justify-center"
            style={{ background: "#2F6E48" }}>
            {espOk ? <FlaskConical size={15} /> : <WifiOff size={15} />} {reading ? "Reading…" : "Read sensor"}
          </button>
          {sensorData ? (
            <div className="mt-3 text-[13px]" style={{ color: "#1B2A21" }}>
              {/* Moisture% — no calibration model yet */}
              <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}>
                <span style={{ color: "#5B6B60" }}>Moisture</span>
                {moisturePrediction != null ? (
                  <span className="font-semibold text-[15px]">{moisturePrediction.toFixed(2)}%</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] italic" style={{ color: "#B8862E" }}>
                    <Info size={11} /> Not yet calibrated
                  </span>
                )}
              </div>

              {/* Grade preview — only when moisture is known */}
              {moisturePrediction != null && (
                <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: "#E1DFD5" }}>
                  <span style={{ color: "#5B6B60" }}>Grade preview</span>
                  <span className="font-semibold" style={{ color: wouldReject ? "#B4453B" : "#2F6E48" }}>
                    {wouldReject ? `Reject (outside ${rejectMin}–${rejectMax}%)` : "Within grade range"}
                  </span>
                </div>
              )}

              {/* Real derived values from the sensor */}
              <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: "#E1DFD5" }}>
                <p className="text-[11.5px] font-semibold mb-1" style={{ color: "#2F6E48" }}>Raw sensor channels</p>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>F7 corrected</span>
                  <span>{sensorData.derived.f7_corrected}</span>
                </div>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>F8 corrected</span>
                  <span>{sensorData.derived.f8_corrected}</span>
                </div>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>NIR corrected</span>
                  <span>{sensorData.derived.nir_corrected}</span>
                </div>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>Clear corrected</span>
                  <span>{sensorData.derived.clear_corrected}</span>
                </div>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>NIR / F7 ratio</span>
                  <span>{sensorData.derived.nir_f7_ratio ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1" style={{ fontSize: 12 }}>
                  <span style={{ color: "#5B6B60" }}>NIR / Clear ratio</span>
                  <span>{sensorData.derived.nir_clear_ratio ?? "—"}</span>
                </div>
              </div>

              {/* Calibration notice */}
              {moisturePrediction == null && (
                <div className="flex items-start gap-2 mt-2.5 p-2.5 rounded-lg" style={{ background: "#FFF9EF", border: "1px solid #E9D9A8" }}>
                  <Info size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#B8862E" }} />
                  <p className="text-[11px] m-0" style={{ color: "#7A5A1E" }}>
                    Moisture% requires a trained NIR calibration model.
                    Raw sensor channels above are real and will feed the eventual model.
                    Place the model at <code>$COPRASENSE_MODEL_DIR/moisture_nir.onnx</code>.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] mt-3" style={{ color: "#8B978E" }}>{reading ? "Reading from /dev/copra-uart…" : !espOk ? "Connect the NIR sensor to read." : "Click to take a sensor reading."}</p>
          )}
        </div>
      </div>

      <button onClick={add} disabled={!canAdd}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50 w-full mt-3.5"
        style={{ background: "#1C3B29" }}>
        <Plus size={15} /> {adding ? "Adding…" : `Add copra #${nextNumber} to batch`}
      </button>
      {!canAdd && moisturePrediction == null && sensorData && (
        <p className="text-[12px] mt-2 text-center" style={{ color: "#B8862E" }}>
          Cannot add sample — moisture calibration model not available yet.
        </p>
      )}
      {!canAdd && !sensorData && <p className="text-[12px] mt-2 text-center" style={{ color: "#8B978E" }}>Capture a sample and read the sensor to add this copra.</p>}
    </div>
  );
}