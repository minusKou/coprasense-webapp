import React, { useState } from "react";
import { Cpu, Camera, RefreshCw, CheckCircle2, XCircle, Activity, Wifi, Clock, Signal, HardDrive } from "lucide-react";
import { getDevices, setDevices } from "@/lib/devices";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };
const inset = { background: "#F6F5F0", border: "1px solid #E1DFD5", borderRadius: "12px" };
const fieldCls = "rounded-lg px-2.5 py-2 text-[13.5px] focus:outline-none w-full";
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
  const [espEndpoint, setEspEndpoint] = useState("/dev/copra-uart");
  const [camEndpoint, setCamEndpoint] = useState("/dev/copra-cam");
  const [probingEsp, setProbingEsp] = useState(false);
  const [probingCam, setProbingCam] = useState(false);
  const [esp, setEsp] = useState(null);
  const [cam, setCam] = useState(null);
  const [lastEsp, setLastEsp] = useState(null);
  const [lastCam, setLastCam] = useState(null);

  const probeEsp = () => {
    setProbingEsp(true);
    setEsp(null);
    setTimeout(() => {
      const online = Math.random() > 0.12;
      setEsp({
        online,
        firmware: "CopraSense v1.4.2",
        uptime: "14h 22m",
        rssi: -52 - Math.floor(Math.random() * 18),
        freeHeap: 210000 + Math.floor(Math.random() * 30000),
        ip: espEndpoint,
        chip: "ESP32-WROOM-32",
        sensors: "NIR moisture",
        mac: "A4:CF:12:9B:" + Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0") + ":7E",
      });
      setLastEsp(new Date());
      setDevices({ esp: online });
      setProbingEsp(false);
    }, 900);
  };

  const probeCam = () => {
    setProbingCam(true);
    setCam(null);
    setTimeout(() => {
      const online = Math.random() > 0.12;
      setCam({
        online,
        resolution: "640 × 480 (VGA)",
        fps: 22 + Math.floor(Math.random() * 6),
        format: "MJPEG",
        latencyMs: 110 + Math.floor(Math.random() * 60),
        exposure: "auto",
        sensor: "OV2640",
        ip: camEndpoint,
      });
      setLastCam(new Date());
      setDevices({ cam: online });
      setProbingCam(false);
    }, 900);
  };

  const probeAll = () => { probeEsp(); probeCam(); };

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

          <input value={espEndpoint} onChange={(e) => setEspEndpoint(e.target.value)} className={fieldCls + " mb-2.5"} style={fieldStyle} placeholder="/dev/copra-uart" />

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
                  <Row label="Chip" value={esp.chip} />
                  <Row label="Firmware" value={esp.firmware} />
                  <Row label="Sensor" value={esp.sensors} />
                  <Row label="IP address" value={esp.ip} />
                  <Row label="WiFi RSSI" value={<span className="inline-flex items-center gap-1.5"><Signal size={12} /> {esp.rssi} dBm</span>} />
                </>
              )}
              <p className="text-[11px] mt-1.5" style={{ color: "#8B978E" }}>Last probe: {fmtTime(lastEsp)}</p>
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

          <input value={camEndpoint} onChange={(e) => setCamEndpoint(e.target.value)} className={fieldCls + " mb-2.5"} style={fieldStyle} placeholder="/dev/copra-cam" />

          <button onClick={probeCam} disabled={probingCam}
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
                  <Row label="Sensor" value={cam.sensor} />
                  <Row label="Resolution" value={cam.resolution} />
                  <Row label="Frame rate" value={`${cam.fps} fps`} />
                  <Row label="Stream latency" value={`${cam.latencyMs} ms`} />
                </>
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