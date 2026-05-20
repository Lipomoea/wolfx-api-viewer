import { measurePerf, setPerfValue } from "./PerfMetrics";

let worker = null;
let unavailable = false;
let nextRequestId = 1;
const pending = new Map();

const createWorker = () => {
  if (worker || unavailable) return worker;
  if (typeof Worker === "undefined") {
    unavailable = true;
    setPerfValue("worker.seismic.available", false);
    return null;
  }
  try {
    worker = new Worker(new URL("./SeismicCalcWorker.js", import.meta.url), { type: "module" });
    worker.onmessage = event => {
      const message = event.data || {};
      const task = pending.get(message.requestId);
      if (!task) return;
      pending.delete(message.requestId);
      if (message.type == "workerError") task.reject(new Error(message.message || "worker error"));
      else task.resolve(message);
    };
    worker.onerror = error => {
      pending.forEach(task => task.reject(error));
      pending.clear();
      worker?.terminate();
      worker = null;
      unavailable = true;
      setPerfValue("worker.seismic.available", false);
    };
    setPerfValue("worker.seismic.available", true);
    return worker;
  } catch {
    unavailable = true;
    setPerfValue("worker.seismic.available", false);
    return null;
  }
};

const requestWorker = (type, payload = {}) => new Promise((resolve, reject) => {
  const targetWorker = createWorker();
  if (!targetWorker) {
    reject(new Error("seismic worker unavailable"));
    return;
  }
  const requestId = nextRequestId++;
  pending.set(requestId, { resolve, reject });
  targetWorker.postMessage({ type, requestId, ...payload });
});

export const warmupSeismicWorker = async () => {
  try {
    const result = await requestWorker("warmup");
    setPerfValue("worker.seismic.wasmReady", result.wasmReady);
    return result;
  } catch {
    return null;
  }
};

export const calcJmaWarnArea = async events => {
  const startedAt = performance.now();
  try {
    const result = await requestWorker("calcJmaWarnArea", { events });
    setPerfValue("worker.seismic.wasmReady", result.wasmReady);
    setPerfValue("worker.seismic.lastDurationMs", Math.round(result.durationMs * 100) / 100);
    measurePerf("worker.seismic.calcJmaWarnArea", startedAt);
    return result;
  } catch {
    const { calcJmaWarnAreaLocal } = await import("./JmaWarnAreaCalculator");
    const fallbackStartedAt = performance.now();
    const warnArea = await calcJmaWarnAreaLocal(events || []);
    const durationMs = performance.now() - fallbackStartedAt;
    setPerfValue("worker.seismic.available", false);
    setPerfValue("worker.seismic.fallback", true);
    setPerfValue("worker.seismic.lastDurationMs", Math.round(durationMs * 100) / 100);
    measurePerf("worker.seismic.calcJmaWarnArea", startedAt);
    return {
      type: "calcJmaWarnAreaResult",
      requestId: 0,
      warnArea,
      durationMs,
      wasmReady: false,
    };
  }
};
