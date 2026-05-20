import { getSeismicWasm, initSeismicWasm } from "./WasmSeismic";
import { calcJmaWarnAreaLocal } from "./JmaWarnAreaCalculator";

const calcJmaWarnArea = async ({ requestId, events }) => {
  const startedAt = performance.now();
  await initSeismicWasm();
  const warnArea = await calcJmaWarnAreaLocal(events || []);
  self.postMessage({
    type: "calcJmaWarnAreaResult",
    requestId,
    warnArea,
    durationMs: performance.now() - startedAt,
    wasmReady: Boolean(getSeismicWasm()),
  });
};

self.onmessage = event => {
  const message = event.data || {};
  if (message.type == "warmup") {
    initSeismicWasm()
      .then(() => {
        self.postMessage({
          type: "warmupResult",
          requestId: message.requestId,
          wasmReady: Boolean(getSeismicWasm()),
        });
      })
      .catch(error => {
        self.postMessage({
          type: "workerError",
          requestId: message.requestId,
          message: error?.message || String(error),
        });
      });
    return;
  }
  if (message.type == "calcJmaWarnArea") {
    calcJmaWarnArea(message).catch(error => {
      self.postMessage({
        type: "workerError",
        requestId: message.requestId,
        message: error?.message || String(error),
      });
    });
  }
};
