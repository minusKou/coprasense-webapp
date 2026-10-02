import { useState, useEffect } from "react";

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