import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { classifyBatch, computeAverage } from "@/lib/copraGrading";

// Loads all batches + samples, keeps them in sync, and exposes mutations.
export function useCopraData(settings) {
  const [batches, setBatches] = useState([]);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([
        api.entities.CopraBatch.list("-created_date", 500),
        api.entities.CopraSample.list("-created_date", 1000),
      ]);
      setBatches(b || []);
      setSamples(s || []);
    } catch (e) {
      console.error("Failed to load copra data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubB = api.entities.CopraBatch.subscribe(() => refresh());
    const unsubS = api.entities.CopraSample.subscribe(() => refresh());
    return () => {
      unsubB && unsubB();
      unsubS && unsubS();
    };
  }, [refresh]);

  // samples grouped by batch_id
  const samplesByBatch = {};
  samples.forEach((s) => {
    if (!samplesByBatch[s.batch_id]) samplesByBatch[s.batch_id] = [];
    samplesByBatch[s.batch_id].push(s);
  });

  const createBatch = useCallback(
    async (batchId) => {
      const rec = await api.entities.CopraBatch.create({
        batch_id: batchId,
        grade: 1,
        status: "Passed",
        average_moisture: 0,
        sample_count: 0,
      });
      return rec;
    },
    []
  );

  const recomputeBatch = useCallback(
    async (batchId, overrideSamples) => {
      const batchSamples = (overrideSamples || samplesByBatch[batchId] || []).slice();
      const avg = computeAverage(batchSamples);
      const { grade, status } = classifyBatch(avg, batchSamples, settings);
      const existing = batches.find((b) => b.batch_id === batchId);
      if (existing) {
        await api.entities.CopraBatch.update(existing.id, {
          grade,
          status,
          average_moisture: Number(avg.toFixed(2)),
          sample_count: batchSamples.length,
        });
      }
    },
    [batches, samplesByBatch, settings]
  );

  const addSample = useCallback(
    async (batchId, moisture, color, texture, mold, image) => {
      const existing = samplesByBatch[batchId] || [];
      const copra_number = existing.reduce((m, s) => Math.max(m, s.copra_number || 0), 0) + 1;
      const newSample = { batch_id: batchId, copra_number, moisture, color, texture, mold: !!mold, ...(image ? { image } : {}) };
      await api.entities.CopraSample.create(newSample);
      await recomputeBatch(batchId, [...existing, newSample]);
    },
    [samplesByBatch, recomputeBatch]
  );

  const deleteSample = useCallback(
    async (sampleId, batchId) => {
      await api.entities.CopraSample.delete(sampleId);
      const remaining = (samplesByBatch[batchId] || []).filter((s) => s.id !== sampleId);
      await recomputeBatch(batchId, remaining);
    },
    [samplesByBatch, recomputeBatch]
  );

  const deleteBatch = useCallback(
    async (batch) => {
      // delete all samples then the batch
      const batchSamples = samplesByBatch[batch.batch_id] || [];
      if (batchSamples.length) {
        await api.entities.CopraSample.deleteMany({ batch_id: batch.batch_id });
      }
      await api.entities.CopraBatch.delete(batch.id);
    },
    [samplesByBatch]
  );

  return {
    batches,
    samples,
    samplesByBatch,
    loading,
    refresh,
    createBatch,
    addSample,
    deleteSample,
    deleteBatch,
  };
}