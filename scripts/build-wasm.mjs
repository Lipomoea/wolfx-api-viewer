import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(root, 'frontend-wasm/Cargo.toml')
const wasmTarget = 'wasm32-unknown-unknown'
const outputDir = resolve(root, 'public/wasm')
const builtWasm = resolve(root, 'frontend-wasm/target/wasm32-unknown-unknown/release/seismic_core.wasm')
const outputWasm = resolve(outputDir, 'seismic_core.wasm')

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('rustup', ['target', 'add', wasmTarget])
run('cargo', ['build', '--manifest-path', manifestPath, '--target', wasmTarget, '--release'])

if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
copyFileSync(builtWasm, outputWasm)
console.log(`WASM copied to ${outputWasm}`)
