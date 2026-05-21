const hasPerformance = typeof performance !== "undefined";
const isWindowScope = typeof window !== "undefined" && typeof document !== "undefined";
const startTime = hasPerformance ? performance.now() : Date.now();

const state = {
  marks: {},
  measures: {},
  counters: {},
  values: {},
  longTasks: {
    count: 0,
    totalMs: 0,
    maxMs: 0,
  },
};

const now = () => (hasPerformance ? performance.now() : Date.now());
const round = value => Math.round(value * 100) / 100;

if (isWindowScope && typeof PerformanceObserver !== "undefined") {
  try {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        state.longTasks.count += 1;
        state.longTasks.totalMs += entry.duration;
        state.longTasks.maxMs = Math.max(state.longTasks.maxMs, entry.duration);
      });
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // 部分 WebView 不支持 longtask，跳过不影响主流程。
  }
}

export const markPerf = name => {
  const time = now();
  state.marks[name] = time;
  return time;
};

export const measurePerf = (name, start, end = now()) => {
  const startTime = typeof start === "string" ? state.marks[start] : start;
  const endTime = typeof end === "string" ? state.marks[end] : end;
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;
  const duration = Math.max(endTime - startTime, 0);
  const current = state.measures[name] || {
    count: 0,
    totalMs: 0,
    minMs: Infinity,
    maxMs: 0,
    lastMs: 0,
  };
  current.count += 1;
  current.totalMs += duration;
  current.minMs = Math.min(current.minMs, duration);
  current.maxMs = Math.max(current.maxMs, duration);
  current.lastMs = duration;
  state.measures[name] = current;
  return duration;
};

export const countPerf = (name, delta = 1) => {
  state.counters[name] = (state.counters[name] || 0) + delta;
  return state.counters[name];
};

export const setPerfValue = (name, value) => {
  state.values[name] = value;
  return value;
};

const snapshotMeasures = () => Object.fromEntries(
  Object.entries(state.measures).map(([name, item]) => [
    name,
    {
      count: item.count,
      lastMs: round(item.lastMs),
      avgMs: round(item.totalMs / item.count),
      minMs: round(item.minMs === Infinity ? 0 : item.minMs),
      maxMs: round(item.maxMs),
      totalMs: round(item.totalMs),
    },
  ]),
);

const getNavigationTiming = () => {
  if (!hasPerformance || typeof performance.getEntriesByType !== "function") return null;
  const nav = performance.getEntriesByType("navigation")[0];
  if (!nav) return null;
  return {
    domContentLoadedMs: round(nav.domContentLoadedEventEnd),
    loadMs: round(nav.loadEventEnd),
    transferSize: nav.transferSize,
    encodedBodySize: nav.encodedBodySize,
  };
};

export const getPerfSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  uptimeMs: round(now() - startTime),
  navigation: getNavigationTiming(),
  marks: Object.fromEntries(
    Object.entries(state.marks).map(([name, time]) => [name, round(time - startTime)]),
  ),
  measures: snapshotMeasures(),
  counters: { ...state.counters },
  values: { ...state.values },
  longTasks: {
    count: state.longTasks.count,
    totalMs: round(state.longTasks.totalMs),
    maxMs: round(state.longTasks.maxMs),
  },
});

export const copyPerfSnapshot = async () => {
  const { copyText } = await import("./Clipboard.js");
  await copyText(JSON.stringify(getPerfSnapshot(), null, 2));
};
