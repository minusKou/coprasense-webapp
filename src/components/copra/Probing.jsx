import React, { useState } from "react";
import { Cpu, Camera, RefreshCw, CheckCircle2, XCircle, Activity, Wifi } from "lucide-react";
import { setDevices, probeUart, probeCam, useSensorStream } from "@/lib/devices";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };
const inset = { background: "#F6F5F0", border: "1px solid #E1DFD5", borderRadius: "12px" };
const fieldCls = "rounded-lg px-2.5 py-2 text-[13px] focus:outline-none w-full";
const fieldStyle = { border: "1px solid #E1DFD5", background: "#FFFFFF", color: "#1B2A21" };

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#E1DFD5" }}>
      <span className="text-[13px]" style={{ color: "#5B6B60" }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: "#1B2A21" }}>{value}</span>
    </div>
  );
}

export default function Probing() {
  // udev-stable symlinks — displayed but not editable; the server uses these directly.
  const [espEndpoint] = useState("/dev/copra-uart");
  const [camEndpoint] = useState("/dev/copra-cam");
  const [probingEsp, setProbingEsp] = useState(false);
  const [probingCam, setProbingCam] = useState(false);
  const [esp, setEsp] = useState(null);
  const [cam, setCam] = useState(null);
  const [lastEsp, setLastEsp] = useState(null);
  const [lastCam, setLastCam] = useState(null);

  // Live sensor data from the serial SSE stream
  const sensorReading = useSensorStream();

  const probeEsp = async () => {
    setProbingEsp(true);
    setEsp(null);
    try {
      const result = await probeUart();
      setEsp(result);
      setLastEsp(new Date());
      setDevices({ esp: result.online });
    } catch (err) {
      setEsp({ online: false, error: err.message });
      setDevices({ esp: false });
    } finally {
      setProbingEsp(false);
    }
  };

  const doProbe = async () => {
    setProbingCam(true);
    setCam(null);
    try {
      const result = await probeCam();
      setCam(result);
      setLastCam(new Date());
      setDevices({ cam: result.online });
    } catch (err) {
      setCam({ online: false, error: err.message });
      setDevices({ cam: false });
    } finally {
      setProbingCam(false);
    }
  };

  const probeAll = () => { probeEsp(); doProbe(); };

  const fmtTime = (d) => d ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <div className="p-5" style={surfaceCard}>
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-[14px] font-semibold m-0 mb-0.5">Module probing</p>
          <p className="text-[12px] m-0" style={{ color: "#5B6B60" }}>Connectivity check for the ESP32 + NIR node and the camera.</p>
        </div>
        <button onClick={probeAll} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white"
          style={{ background: "#1C3B29" }}>
          <RefreshCw size={14} className={probingEsp || probingCam ? "animate-spin" : ""} /> Probe all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* ESP32 + NIR */}
        <div className="p-4" style={inset}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: "#DCEBE1" }}>
              <Cpu size={16} style={{ color: "#2F6E48" }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold m-0">ESP32 + NIR sensor</p>
              <p className="text-[11px] m-0" style={{ color: "#8B978E" }}>Moisture acquisition</p>
            </div>
          </div>

          {/* udev-stable symlink — display only */}
          <input value={espEndpoint} readOnly className={fieldCls + " mb-2.5"} style={{ ...fieldStyle, opacity: 0.7, cursor: "default" }} placeholder="/dev/copra-uart" />

          <button onClick={probeEsp} disabled={probingEsp}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60 mb-2.5 w-full justify-center"
            style={{ background: "#2F6E48" }}>
            <Activity size={14} /> {probingEsp ? "Probing…" : "Probe ESP32"}
          </button>

          {esp && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {esp.online ? <CheckCircle2 size={14} style={{ color: "#2F6E48" }} /> : <XCircle size={14} style={{ color: "#B4453B" }} />}
                <span className="text-[12.5px] font-semibold" style={{ color: esp.online ? "#1C3B29" : "#B4453B" }}>
                  {esp.online ? "Module online" : "Module unreachable"}
                </span>
              </div>
              {esp.online && (
                <>
                  <Row label="Status" value={<span className="inline-flex items-center gap-1.5"><Wifi size={12} style={{ color: "#2F6E48" }} /> Connected</span>} />
                  <Row label="Symlink" value={esp.device} />
                  {esp.resolved_device && <Row label="Resolved" value={esp.resolved_device} />}
                  <Row label="Baud rate" value={esp.baud} />
                  <Row label="Last reading" value={esp.last_reading ? new Date(esp.last_reading).toLocaleTimeString() : "—"} />
                </>
              )}
              {!esp.online && esp.error && (
                <p className="text-[11.5px] mt-1 break-all" style={{ color: "#B4453B" }}>
                  {esp.error}
                </p>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: "#8B978E" }}>Last probe: {fmtTime(lastEsp)}</p>
            </div>
          )}

          {/* Live sensor readings — real data from /dev/copra-uart */}
          {sensorReading && esp?.online && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E1DFD5" }}>
              <p className="text-[11.5px] font-semibold mb-1.5" style={{ color: "#2F6E48" }}>Live sensor readings</p>
              <Row label="F7 corrected (630 nm)" value={sensorReading.derived.f7_corrected} />
              <Row label="F8 corrected (680 nm)" value={sensorReading.derived.f8_corrected} />
              <Row label="NIR corrected (910 nm)" value={sensorReading.derived.nir_corrected} />
              <Row label="Clear corrected" value={sensorReading.derived.clear_corrected} />
              <Row label="NIR / F7 ratio" value={sensorReading.derived.nir_f7_ratio ?? "—"} />
              <Row label="NIR / Clear ratio" value={sensorReading.derived.nir_clear_ratio ?? "—"} />
              <Row label="Touch raw" value={sensorReading.raw.touch_raw} />
              {sensorReading.derived.color_heuristic && (
                <Row label="Color (heuristic)" value={
                  <span className="inline-flex items-center gap-1">
                    {sensorReading.derived.color_heuristic}
                    <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: "#F6E9CE", color: "#7A5A1E" }}>estimate</span>
                  </span>
                } />
              )}
              <p className="text-[10px] mt-1" style={{ color: "#8B978E" }}>
                Updated: {new Date(sensorReading.received_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Camera */}
        <div className="p-4" style={inset}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: "#F6E9CE" }}>
              <Camera size={16} style={{ color: "#B8862E" }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold m-0">Monitoring camera</p>
              <p className="text-[11px] m-0" style={{ color: "#8B978E" }}>Live visual feed</p>
            </div>
          </div>

          {/* udev-stable symlink — display only */}
          <input value={camEndpoint} readOnly className={fieldCls + " mb-2.5"} style={{ ...fieldStyle, opacity: 0.7, cursor: "default" }} placeholder="/dev/copra-cam" />

          <button onClick={doProbe} disabled={probingCam}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60 mb-2.5 w-full justify-center"
            style={{ background: "#B8862E" }}>
            <Activity size={14} /> {probingCam ? "Probing…" : "Probe camera"}
          </button>

          {cam && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {cam.online ? <CheckCircle2 size={14} style={{ color: "#2F6E48" }} /> : <XCircle size={14} style={{ color: "#B4453B" }} />}
                <span className="text-[12.5px] font-semibold" style={{ color: cam.online ? "#1C3B29" : "#B4453B" }}>
                  {cam.online ? "Camera online" : "Camera unreachable"}
                </span>
              </div>
              {cam.online && (
                <>
                  <Row label="Status" value={<span className="inline-flex items-center gap-1.5"><Wifi size={12} style={{ color: "#2F6E48" }} /> Connected</span>} />
                  <Row label="Symlink" value={cam.device} />
                  {cam.resolved_device && <Row label="Resolved" value={cam.resolved_device} />}
                  <Row label="ffmpeg" value={cam.ffmpeg_available ? "Available" : "Not found"} />
                  {cam.active_streams > 0 && <Row label="Active streams" value={cam.active_streams} />}
                </>
              )}
              {!cam.online && cam.error && (
                <p className="text-[11.5px] mt-1 break-all" style={{ color: "#B4453B" }}>
                  {cam.error}
                </p>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: "#8B978E" }}>Last probe: {fmtTime(lastCam)}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11.5px] mt-3.5" style={{ color: "#8B978E" }}>
        Live readings and capture are available only after the matching module probes online.
      </p>
    </div>
  );
}