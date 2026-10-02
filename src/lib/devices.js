import { useState, useEffect, useRef, useCallback } from "react";

const KEY = "coprasense_devices_v1";
const EVENT = "coprasense:devices";

export function getDevices() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { esp: false, cam: false };
  } catch (e) {
    return { esp: false, cam: false };
  }
}

export function setDevices(patch) {
  const next = { ...getDevices(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {}
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function useDevices() {
  const [devs, setDevs] = useState(getDevices);
  useEffect(() => {
    const handler = () => setDevs(getDevices());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return devs;
}

// ── Live sensor readings from /dev/copra-uart via SSE ───────────────────

const READING_EVENT = "coprasense:reading";

/**
 * Hook that subscribes to the live serial reading SSE stream.
 * Returns the most recent parsed reading (or null if no data yet).
 *
 * The reading object has the shape:
 *   { raw: { touch_raw, f7_dark, f8_dark, nir_dark, clear_dark,
 *            f7_lit, f8_lit, nir_lit, clear_lit, timestamp },
 *     derived: { f7_corrected, f8_corrected, nir_corrected, clear_corrected,
 *                nir_f7_ratio, nir_clear_ratio, color_heuristic },
 *     received_at: ISO string }
 */
export function useSensorStream() {
  const [reading, setReading] = useState(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const es = new EventSource("/api/devices/stream");
    sourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setReading(data);
        // Also dispatch a custom event so non-hook consumers can listen
        window.dispatchEvent(new CustomEvent(READING_EVENT, { detail: data }));
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      es.close();
      sourceRef.current = null;
    };
  }, []);

  return reading;
}

// ── Device probing via backend endpoints ────────────────────────────────

/**
 * Probe the ESP32 serial device via the backend.
 * Returns the probe result object from GET /api/devices/probe/uart.
 */
export async function probeUart() {
  const res = await fetch("/api/devices/probe/uart");
  if (!res.ok) throw new Error("Probe failed");
  return res.json();
}

/**
 * Probe the camera device via the backend.
 * Returns the probe result object from GET /api/devices/probe/cam.
 */
export async function probeCam() {
  const res = await fetch("/api/devices/probe/cam");
  if (!res.ok) throw new Error("Probe failed");
  return res.json();
}

/**
 * Capture a single frame from the camera + contour analysis.
 * Returns { image, contour, sensor } from POST /api/camera/capture.
 */
export async function captureFrame() {
  const res = await fetch("/api/camera/capture", { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Capture failed");
  }
  return res.json();
}

/**
 * Fetch the latest serial reading snapshot.
 * Returns the reading object or null if none available.
 */
export async function fetchLatestReading() {
  const res = await fetch("/api/devices/reading/latest");
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("Failed to fetch reading");
  return res.json();
}