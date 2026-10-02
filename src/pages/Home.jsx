import React, { useState, useEffect } from "react";
import Topbar from "@/components/copra/Topbar";
import Dashboard from "@/components/copra/Dashboard";
import BatchDetail from "@/components/copra/BatchDetail";
import History from "@/components/copra/History";
import Reports from "@/components/copra/Reports";
import SettingsView from "@/components/copra/Settings";
import { useCopraData } from "@/hooks/useCopraData";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  classifyBatch,
  computeAverage,
  nextBatchId,
} from "@/lib/copraGrading";
import { api } from "@/api/client";

export default function Home() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [view, setView] = useState("dashboard");
  const [activeBatchId, setActiveBatchId] = useState(null);

  const {
    batches,
    samplesByBatch,
    loading,
    createBatch,
    addSample,
    deleteSample,
    deleteBatch,
    refresh,
  } = useCopraData(settings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const activeBatch = activeBatchId ? batches.find((b) => b.id === activeBatchId) : null;
  const activeSamples = activeBatch ? samplesByBatch[activeBatch.batch_id] || [] : [];

  const handleCreateBatch = async (batchId) => {
    const rec = await createBatch(batchId);
    await refresh();
    setActiveBatchId(rec.id);
    setView("batch");
  };

  const handleOpenBatch = (b) => {
    setActiveBatchId(b.id);
    setView("batch");
  };

  const handleSaveSettings = (s) => {
    setSettings(s);
    alert("Settings saved.");
  };
  const handleResetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    alert("Settings reset to defaults.");
  };

  const handleClearAll = async () => {
    if (!batches.length) return;
    if (!confirm("Permanently clear all recorded batches? This cannot be undone.")) return;
    await api.entities.CopraSample.deleteMany({});
    await api.entities.CopraBatch.deleteMany({});
    await refresh();
  };

  const handleLoadSample = async () => {
    const sample = [
      [6.2, "standard", "firm", 0],
      [8.1, "slightly-dark", "firm", 0],
      [11.4, "dark", "soft", 1],
      [6.5, "standard", "firm", 1],
      [7.8, "slightly-dark", "firm", 1],
      [5.9, "standard", "firm", 2],
      [9.2, "slightly-dark", "soft", 2],
      [6.1, "standard", "firm", 3],
      [12.0, "dark", "brittle", 3],
      [7.0, "standard", "firm", 4],
    ];
    const daysAgoISO = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString();
    };
    // group samples into a few batches
    const batchDefs = [
      { id: "CP-0231", samplesIdx: [0, 1] },
      { id: "CP-0230", samplesIdx: [2, 3, 4] },
      { id: "CP-0229", samplesIdx: [5, 6] },
      { id: "CP-0228", samplesIdx: [7, 8] },
      { id: "CP-0227", samplesIdx: [9] },
    ];
    for (const def of batchDefs) {
      const batchSamples = def.samplesIdx.map((i) => {
        const [moisture, color, texture] = sample[i];
        return { moisture, color, texture };
      });
      const avg = computeAverage(batchSamples);
      const { grade, status } = classifyBatch(avg, batchSamples, settings);
      await api.entities.CopraBatch.create({
        batch_id: def.id,
        grade,
        status,
        average_moisture: Number(avg.toFixed(2)),
        sample_count: batchSamples.length,
      });
      for (let i = 0; i < batchSamples.length; i++) {
        await api.entities.CopraSample.create({
          batch_id: def.id,
          copra_number: i + 1,
          moisture: batchSamples[i].moisture,
          color: batchSamples[i].color,
          texture: batchSamples[i].texture,
        });
      }
    }
    await refresh();
    alert("Sample data loaded.");
  };

  const handleRecomputeAll = async () => {
    for (const b of batches) {
      const bs = samplesByBatch[b.batch_id] || [];
      const avg = computeAverage(bs);
      const { grade, status } = classifyBatch(avg, bs, settings);
      await api.entities.CopraBatch.update(b.id, {
        grade,
        status,
        average_moisture: Number(avg.toFixed(2)),
        sample_count: bs.length,
      });
    }
    await refresh();
    alert("All batches re-graded under current thresholds.");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E1DFD5] border-t-[#1C3B29] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F6F5F0", color: "#1B2A21" }}>
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-7 pb-16">
        <Topbar view={view} onNavigate={setView} orgName={settings.orgName} />

        {view === "dashboard" && (
          <Dashboard
            batches={batches}
            samplesByBatch={samplesByBatch}
            settings={settings}
            onCreateBatch={handleCreateBatch}
            onOpenBatch={handleOpenBatch}
            onNavigate={setView}
          />
        )}
        {view === "batch" && activeBatch && (
          <BatchDetail
            batch={activeBatch}
            samples={activeSamples}
            settings={settings}
            onAddSample={addSample}
            onDeleteSample={deleteSample}
            onBack={() => setView("dashboard")}
            onNavigate={setView}
          />
        )}
        {view === "history" && (
          <History batches={batches} onOpenBatch={handleOpenBatch} onDeleteBatch={deleteBatch} />
        )}
        {view === "reports" && <Reports batches={batches} settings={settings} />}
        {view === "settings" && (
          <SettingsView
            settings={settings}
            onSave={handleSaveSettings}
            onReset={handleResetSettings}
            batches={batches}
            onClearAll={handleClearAll}
            onLoadSample={handleLoadSample}
            samplesByBatch={samplesByBatch}
            onRecomputeAll={handleRecomputeAll}
          />
        )}
      </div>
    </div>
  );
}