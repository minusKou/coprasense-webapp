import React, { useState, useEffect } from "react";
import { Camera, Circle, ScanLine, WifiOff } from "lucide-react";
import { useDevices } from "@/lib/devices";

const surfaceCard = { background: "#FFFFFF", border: "1px solid #E1DFD5", borderRadius: "14px" };

export default function LiveCamera({ onOpenSettings }) {
  const devices = useDevices();
  const connected = devices.cam;
  const [scanY, setScanY] = useState(0);
  const [ts, setTs] = useState(new Date());

  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setTs(new Date()), 1000);
    return () => clearInterval(id);
  }, [connected]);

  useEffect(() => {
    if (!connected) return;
    let raf;
    const tick = () => {
      setScanY((y) => (y + 1.2) % 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [connected]);

  return (
    <div className="p-5" style={surfaceCard}>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
          <Camera size={17} style={{ color: "#B8862E" }} /> Camera feed
        </span>
        <span className="text-[12px]" style={{ color: "#8B978E" }}>{connected ? "MJPEG · live" : "offline"}</span>
      </div>

      <div className="relative rounded-[12px] overflow-hidden" style={{ background: "#0c1410", aspectRatio: "4/3" }}>
        {connected ? (
          <>
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, #2a3d2e 0%, #14201a 55%, #0a120d 100%)" }} />
            <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: "rgba(184,134,46,0.25)" }} />
            <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "rgba(184,134,46,0.25)" }} />
            <div className="absolute" style={{ left: "32%", top: "30%", width: "36%", height: "40%", border: "1px solid rgba(47,110,72,0.6)", borderRadius: "8px" }} />
            <div className="absolute left-0 right-0 h-[2px]" style={{ top: `${scanY}%`, background: "linear-gradient(90deg, transparent, rgba(184,134,46,0.7), transparent)", boxShadow: "0 0 8px rgba(184,134,46,0.5)" }} />
            <span className="absolute" style={{ top: "32%", left: "33%", color: "rgba(220,235,225,0.5)", fontSize: 10 }}>SAMPLE REGION</span>
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(0,0,0,0.4)", color: "#ff5a5a" }}>
              <Circle size={9} fill="#ff5a5a" /> LIVE
            </div>
            <div className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-md font-mono" style={{ background: "rgba(0,0,0,0.4)", color: "#DCEBE1" }}>
              {ts.toLocaleTimeString()}
            </div>
            <div className="absolute bottom-3 left-3 text-[11px] font-mono" style={{ color: "rgba(220,235,225,0.6)" }}>CAM-01 · /dev/copra-cam</div>
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(220,235,225,0.6)" }}>
              <ScanLine size={12} /> scan
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
            <WifiOff size={22} style={{ color: "#5B6B60" }} />
            <p className="text-[13px] m-0" style={{ color: "#8B978E" }}>Camera not connected</p>
            <button onClick={onOpenSettings} className="text-[12.5px] font-semibold" style={{ color: "#B8862E" }}>Probe devices in Settings →</button>
          </div>
        )}
      </div>
    </div>
  );
}