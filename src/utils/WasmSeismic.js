const WASM_URL = "/wasm/seismic_core.wasm";

let wasmExports = null;
let wasmInitPromise = null;
let wasmUnavailable = false;

const instantiate = async response => {
  if ("instantiateStreaming" in WebAssembly) {
    const fallbackResponse = response.clone();
    try {
      return await WebAssembly.instantiateStreaming(response, {});
    } catch (err) {
      const bytes = await fallbackResponse.arrayBuffer();
      return WebAssembly.instantiate(bytes, {});
    }
  }

  const bytes = await response.arrayBuffer();
  return WebAssembly.instantiate(bytes, {});
};

export const initSeismicWasm = async () => {
  if (wasmExports || wasmUnavailable) return wasmExports;
  if (typeof WebAssembly === "undefined") {
    wasmUnavailable = true;
    return null;
  }
  if (!wasmInitPromise) {
    wasmInitPromise = fetch(WASM_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`failed to load ${WASM_URL}: ${response.status}`);
        }
        return instantiate(response);
      })
      .then(result => {
        wasmExports = result.instance.exports;
        return wasmExports;
      })
      .catch(err => {
        wasmUnavailable = true;
        console.warn("seismic WASM unavailable, falling back to JavaScript", err);
        return null;
      });
  }

  return wasmInitPromise;
};

export const getSeismicWasm = () => wasmExports;

export const calcCsisLevelWasmSync = (m, dep = 10, dis = 0) => {
  const wasm = getSeismicWasm();
  if (!wasm?.calc_csis_level) return null;
  const value = wasm.calc_csis_level(Number(m), Number(dep), Number(dis));
  return Number.isFinite(value) ? value.toFixed(0) : null;
};

export const calcSurfaceDistanceKmWasmSync = (lat1, lng1, lat2, lng2) => {
  const wasm = getSeismicWasm();
  if (!wasm?.calc_surface_distance_km) return null;
  const value = wasm.calc_surface_distance_km(
    Number(lat1),
    Number(lng1),
    Number(lat2),
    Number(lng2),
  );
  return Number.isFinite(value) ? value : null;
};
