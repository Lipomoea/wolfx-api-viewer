import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import travelTimes from '../src/utils/TravelTimes.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(root, 'frontend-wasm/src/travel_times.rs')

const formatNumber = value => {
  if (!Number.isFinite(value)) throw new Error(`invalid travel-time value: ${value}`)
  return Number.isInteger(value) ? `${value}.0` : String(value)
}

const wrapArray = values => {
  const lines = []
  for (let i = 0; i < values.length; i += 10) {
    lines.push(`    ${values.slice(i, i + 10).map(formatNumber).join(', ')},`)
  }
  return lines.join('\n')
}

const flattenRows = rows => rows.flatMap(row => row)

const validateModel = (name, model) => {
  const { depths, distances, p_times, s_times } = model
  if (!depths?.length || !distances?.length) throw new Error(`${name}: missing axes`)
  for (const [label, rows] of [['p_times', p_times], ['s_times', s_times]]) {
    if (rows.length !== depths.length) throw new Error(`${name}: ${label} depth count mismatch`)
    rows.forEach((row, index) => {
      if (row.length !== distances.length) {
        throw new Error(`${name}: ${label}[${index}] distance count mismatch`)
      }
    })
  }
}

const modelBlock = (constName, model) => {
  validateModel(constName, model)
  const prefix = constName.toUpperCase()
  const depths = model.depths
  const distances = model.distances
  const pTimes = flattenRows(model.p_times)
  const sTimes = flattenRows(model.s_times)

  return `
static ${prefix}_DEPTHS: [f64; ${depths.length}] = [
${wrapArray(depths)}
];

static ${prefix}_DISTANCES: [f64; ${distances.length}] = [
${wrapArray(distances)}
];

static ${prefix}_P_TIMES: [f64; ${pTimes.length}] = [
${wrapArray(pTimes)}
];

static ${prefix}_S_TIMES: [f64; ${sTimes.length}] = [
${wrapArray(sTimes)}
];

static ${prefix}: TravelTimeModel = TravelTimeModel {
    depths: &${prefix}_DEPTHS,
    distances: &${prefix}_DISTANCES,
    p_times: &${prefix}_P_TIMES,
    s_times: &${prefix}_S_TIMES,
    distance_len: ${distances.length},
};
`
}

const content = `// 由 scripts/generate-wasm-travel-times.mjs 生成，请不要手改。

pub struct TravelTimeModel {
    pub depths: &'static [f64],
    pub distances: &'static [f64],
    pub p_times: &'static [f64],
    pub s_times: &'static [f64],
    pub distance_len: usize,
}

pub const MODEL_JMA2001: i32 = 0;
pub const MODEL_JB: i32 = 1;

${modelBlock('jma2001', travelTimes.jma2001)}
${modelBlock('jb', travelTimes.jb)}
pub fn travel_time_model(model: i32) -> &'static TravelTimeModel {
    match model {
        MODEL_JMA2001 => &JMA2001,
        MODEL_JB => &JB,
        _ => &JMA2001,
    }
}
`

await writeFile(outputPath, content)
console.log(`travel-time Rust table generated: ${outputPath}`)
