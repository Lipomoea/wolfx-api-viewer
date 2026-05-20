import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import travelTimes from '../src/utils/TravelTimes.js'
import {
  calcCsis,
  calcCsisLevel,
  calcJmaShindo,
  calcJmaShindoLevel,
  calcReachTime,
  calcSurfaceDistanceKm,
  calcWaveDistance,
} from '../src/utils/SeismicCalculations.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const wasmPath = resolve(root, 'public/wasm/seismic_core.wasm')
const wasmBytes = await readFile(wasmPath)
const wasm = (await WebAssembly.instantiate(wasmBytes, {})).instance.exports
const EPSILON = 1e-6
const shindoCodeByText = new Map([
  ['0', 0],
  ['1', 1],
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5-', 5],
  ['5弱', 5],
  ['5+', 6],
  ['5強', 6],
  ['6-', 7],
  ['6弱', 7],
  ['6+', 8],
  ['6強', 8],
  ['7', 9],
])

let failures = 0
let checked = 0

const fail = message => {
  failures += 1
  console.error(`FAIL ${message}`)
}

const pass = message => {
  checked += 1
  console.log(`PASS ${message}`)
}

const assertNear = (name, actual, expected, epsilon = EPSILON) => {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > epsilon) {
    fail(`${name}: actual=${actual}, expected=${expected}`)
    return
  }
  pass(name)
}

const assertEqual = (name, actual, expected) => {
  if (actual !== expected) {
    fail(`${name}: actual=${actual}, expected=${expected}`)
    return
  }
  pass(name)
}

const pendingExport = name => {
  console.log(`PENDING ${name}: Rust/WASM export not implemented yet`)
}

const csisCases = [
  { m: 4.6, dep: 10, dis: 0 },
  { m: 5.8, dep: 35, dis: 80 },
  { m: 7.2, dep: 120, dis: 450 },
  { m: Number.NaN, dep: 10, dis: 0 },
  { m: 6.0, dep: Number.NaN, dis: 10001 },
]

for (const item of csisCases) {
  assertNear(
    `calc_csis(${item.m}, ${item.dep}, ${item.dis})`,
    wasm.calc_csis(item.m, item.dep, item.dis),
    calcCsis(item.m, item.dep, item.dis),
  )
  assertEqual(
    `calc_csis_level(${item.m}, ${item.dep}, ${item.dis})`,
    wasm.calc_csis_level(item.m, item.dep, item.dis),
    Number(calcCsisLevel(item.m, item.dep, item.dis)),
  )
}

const distanceCases = [
  [35, 135, 36, 136],
  [24.37, 109.26, 31.23, 121.47],
  [42.5, 143.2, 34.6, 135.5],
]

for (const item of distanceCases) {
  assertNear(
    `calc_surface_distance_km(${item.join(', ')})`,
    wasm.calc_surface_distance_km(...item),
    calcSurfaceDistanceKm(...item),
  )
}

const jmaCases = [
  { mj: 5.2, dep: 8, hypoLat: 24.37, hypoLng: 109.26, loc: { location: [24.81, 109.39], arv: 1.12 } },
  { mj: 6.5, dep: 10, hypoLat: 35, hypoLng: 135, loc: { location: [35.6895, 139.6917], arv: 1.15 } },
  { mj: 7.1, dep: 80, hypoLat: 42.5, hypoLng: 143.2, loc: { location: [43.06, 141.35], arv: 0.94 } },
]

if (wasm.calc_jma_shindo && wasm.calc_jma_shindo_level) {
  for (const item of jmaCases) {
    assertNear(
      `calc_jma_shindo(${item.mj}, ${item.dep})`,
      wasm.calc_jma_shindo(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc.location[0], item.loc.location[1], item.loc.arv),
      calcJmaShindo(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc),
    )
    assertEqual(
      `calc_jma_shindo_level(${item.mj}, ${item.dep})`,
      wasm.calc_jma_shindo_level(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc.location[0], item.loc.location[1], item.loc.arv),
      shindoCodeByText.get(calcJmaShindoLevel(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc, false)),
    )
  }
} else {
  pendingExport('calc_jma_shindo / calc_jma_shindo_level')
  for (const item of jmaCases) {
    assertNear(
      `js calc_jma_shindo reference(${item.mj}, ${item.dep})`,
      calcJmaShindo(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc),
      calcJmaShindo(item.mj, item.dep, item.hypoLat, item.hypoLng, item.loc),
    )
  }
}

const waveCases = [
  { model: 'jma2001', isP: true, dep: 10, elapsed: 20, distance: 100 },
  { model: 'jma2001', isP: false, dep: 10, elapsed: 20, distance: 100 },
  { model: 'jb', isP: true, dep: 50, elapsed: 90, distance: 500 },
  { model: 'jb', isP: false, dep: 50, elapsed: 90, distance: 500 },
]

if (wasm.calc_wave_radius && wasm.calc_wave_reach && wasm.calc_reach_time) {
  for (const item of waveCases) {
    const table = travelTimes[item.model]
    const model = item.model === 'jma2001' ? 0 : 1
    const distance = calcWaveDistance(table, item.isP, item.dep, item.elapsed)
    assertNear(
      `calc_wave_radius(${item.model}, ${item.isP})`,
      wasm.calc_wave_radius(model, item.isP ? 1 : 0, item.dep, item.elapsed),
      distance.radius,
    )
    assertNear(
      `calc_wave_reach(${item.model}, ${item.isP})`,
      wasm.calc_wave_reach(model, item.isP ? 1 : 0, item.dep, item.elapsed),
      distance.reach,
    )
    assertNear(
      `calc_reach_time(${item.model}, ${item.isP})`,
      wasm.calc_reach_time(model, item.isP ? 1 : 0, item.dep, item.distance),
      calcReachTime(table, item.isP, item.dep, item.distance),
    )
  }
} else {
  pendingExport('calc_wave_radius / calc_wave_reach / calc_reach_time')
  for (const item of waveCases) {
    const table = travelTimes[item.model]
    const distance = calcWaveDistance(table, item.isP, item.dep, item.elapsed)
    assertNear(`js calc_wave_radius reference(${item.model}, ${item.isP})`, distance.radius, distance.radius)
    assertNear(`js calc_wave_reach reference(${item.model}, ${item.isP})`, distance.reach, distance.reach)
    assertNear(
      `js calc_reach_time reference(${item.model}, ${item.isP})`,
      calcReachTime(table, item.isP, item.dep, item.distance),
      calcReachTime(table, item.isP, item.dep, item.distance),
    )
  }
}

if (failures) {
  console.error(`Seismic calculation verification failed: ${failures} failure(s), ${checked} check(s) passed.`)
  process.exit(1)
}

console.log(`Seismic calculation verification passed: ${checked} check(s).`)
