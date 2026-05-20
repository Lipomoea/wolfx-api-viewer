# 第二次深度优化对比报告

生成时间：2026-05-21

## 范围

本轮优化目标是把首屏路径、批量数值计算和高频 WebGL 绘制做成可量化、可验收的生产路径。静态底图、行政区面、断层、海啸图层仍保留 Leaflet；本轮没有做全地图 WebGL 重写。

## 构建体积对比

数据来源：`npm run build` 后执行 `npm run build:report -- --label=second-depth-final`，并与 `perf-reports/second-depth-baseline.json` 对比。

| 指标 | 优化前基线 | 优化后 | 变化 |
|---|---:|---:|---:|
| 总资产体积 | 16409.39 KiB | 16764.33 KiB | +354.94 KiB |
| 总 gzip 体积 | 9224.40 KiB | 9302.33 KiB | +77.93 KiB |
| 首屏入口 JS | 476.47 KiB | 416.39 KiB | -60.08 KiB |
| 首屏入口 JS gzip | 108.20 KiB | 93.25 KiB | -14.95 KiB |
| 初始资源数 | 11 | 10 | -1 |

总包体略增，主要来自新增 Worker、设置页异步块和保留的按需地理数据块；首屏入口 JS 明显下降，这是本轮首屏优化的主要收益。

## 首屏依赖变化

| 模块 | 优化前 | 优化后 | 说明 |
|---|---|---|---|
| `fe-regions` | 268 KiB，初始加载 | 268 KiB，按需加载 | 地名数据不再进入首屏同步链路 |
| `SettingsComponent` | 合在首屏路径 | 69.45 KiB，按需加载 | 只在打开设置页时加载 |
| `JmaSeisIntLoc` | 不在首屏 | 339.06 KiB，按需加载 | JMA 历史/估算路径按需进入 |
| `travel-times` | 409.35 KiB，按需加载 | 409.35 KiB，按需加载 | 继续保持非首屏路径 |
| `SeismicCalcWorker` | 无 | 4.57 KiB，按需加载 | JMA 批量估算移到 Worker |

## 运行时快照

生产预览地址 `http://127.0.0.1:4173/` 单次烟测结果：

| 项目 | 当前结果 |
|---|---:|
| `DOMContentLoaded` | 183.80 ms |
| `load` | 351.80 ms |
| 控制台错误 | 0 |
| 生产环境 `[WebGL]` 标志 | 不显示 |
| 生产环境 `FAN:DEV` 标志 | 不显示 |

注：本轮基线没有保存同口径的运行时首屏快照，因此这里记录的是最终构建的可复现检查值，不写百分比结论。

## WebGL 路径

地震波绘制已从“每个预警分别上传顶点并绘制”改成按类型合批：

| 批次 | 单个测试预警顶点数 | draw 调用 |
|---|---:|---:|
| 填色 | 480 | 1 |
| P 波环 | 960 | 1 |
| S 波环 | 960 | 1 |

同一帧单个测试预警合计 3 次 draw 调用。填色仍在 `waveFillPane`，波环仍在 `wavePane`，不改变烈度面、断层、测站的 Leaflet 层级关系。

测站 WebGL 路径保持 `setStations`、`removeSource`、`requestRender` 公开接口不变，内部改为缓存颜色、图标图集 entry 和可复用顶点缓冲；地图移动时主要更新位置，数据变化时才重建样式缓存。

## Worker/WASM 路径

JMA 警戒区域批量估算已移到 module worker：

- 请求格式：`{ type: "calcJmaWarnArea", requestId, events }`
- 响应格式：`{ type: "calcJmaWarnAreaResult", requestId, warnArea, durationMs, wasmReady }`
- Worker 内优先使用 WASM；WASM 不可用时保留 JS fallback。
- 主线程只接收最终分区结果，不再在地图组件里跑完整台站循环。

## 验证记录

- `git diff --check`：通过。
- `npm run verify:seismic`：通过，31 项一致性校验。
- `npm run build`：通过。
- `npm run build:report -- --label=second-depth-final`：通过。
- 浏览器烟测：开发环境无 console error，测试波可见，性能值显示地震波合批为 3 次 draw 调用。
- 生产预览烟测：无 console error，`[WebGL]` 和 `FAN:DEV` 不显示。
- 历史烈度层回归：`forceCalcInt=false` 时，CWA 能从震央县市生成台湾分区；CENC 能从测站市/区县候选匹配到底图存在的中国分区。

## 保留边界

- 静态地理面、断层、海啸图层仍由 Leaflet/Canvas/vectorGrid 负责。
- `perf-reports/` 是本地生成物，被 `.gitignore` 排除；本报告只固化最终结论和可复现数据。
- 未跟踪脚本 `scripts/fetch-cenc-intensity-report.mjs` 未纳入本轮提交。
