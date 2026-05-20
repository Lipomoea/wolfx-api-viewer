const WASM_URL = "/wasm/seismic_core.wasm";

let wasmExports = null;
let wasmInitPromise = null;
let wasmUnavailable = false;

const SHINDO_SYMBOLS = ["0", "1", "2", "3", "4", "5-", "5+", "6-", "6+", "7"];
const SHINDO_KANJI = ["0", "1", "2", "3", "4", "5弱", "5強", "6弱", "6強", "7"];

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

const finiteNumberOrNull = value => (Number.isFinite(value) ? value : null);

const shindoCodeToText = (code, useSymbol = true) => {
  const value = Number(code);
  if (!Number.isInteger(value) || value < 0 || value >= SHINDO_SYMBOLS.length) {
    return null;
  }
  return (useSymbol ? SHINDO_SYMBOLS : SHINDO_KANJI)[value];
};

export const calcCsisWasmSync = (m, dep = 10, dis = 0) => {
  const wasm = getSeismicWasm();
  if (!wasm?.calc_csis) return null;
  return finiteNumberOrNull(wasm.calc_csis(Number(m), Number(dep), Number(dis)));
};

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
  return finiteNumberOrNull(value);
};

export const calcJmaShindoWasmSync = (mj, dep, hypoLat, hypoLng, loc) => {
  const wasm = getSeismicWasm();
  const location = loc?.location;
  if (!wasm?.calc_jma_shindo || !Array.isArray(location)) return null;
  return finiteNumberOrNull(
    wasm.calc_jma_shindo(
      Number(mj),
      Number(dep),
      Number(hypoLat),
      Number(hypoLng),
      Number(location[0]),
      Number(location[1]),
      Number(loc.arv),
    ),
  );
};

export const calcJmaShindoLevelWasmSync = (
  mj,
  dep,
  hypoLat,
  hypoLng,
  loc,
  useSymbol = true,
) => {
  const wasm = getSeismicWasm();
  const location = loc?.location;
  if (!wasm?.calc_jma_shindo_level || !Array.isArray(location)) return null;
  const code = wasm.calc_jma_shindo_level(
    Number(mj),
    Number(dep),
    Number(hypoLat),
    Number(hypoLng),
    Number(location[0]),
    Number(location[1]),
    Number(loc.arv),
  );
  return shindoCodeToText(code, useSymbol);
};
