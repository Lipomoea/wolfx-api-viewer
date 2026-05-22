import L from 'leaflet';
import { countPerf, measurePerf, setPerfValue } from '@/utils/PerfMetrics';

const vertexShaderSource = `
attribute vec2 a_position;
attribute float a_radius;
attribute vec4 a_fillColor;
attribute vec4 a_strokeColor;
attribute float a_strokeWidth;
uniform float u_pixelRatio;
varying float v_radius;
varying vec4 v_fillColor;
varying vec4 v_strokeColor;
varying float v_strokeWidth;
void main() {
  v_radius = a_radius;
  v_fillColor = a_fillColor;
  v_strokeColor = a_strokeColor;
  v_strokeWidth = a_strokeWidth;
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = max((a_radius + a_strokeWidth) * 2.0 * u_pixelRatio, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
varying float v_radius;
varying vec4 v_fillColor;
varying vec4 v_strokeColor;
varying float v_strokeWidth;
void main() {
  float dist = length(gl_PointCoord * 2.0 - 1.0);
  if (dist > 1.0) discard;
  float totalRadius = max(v_radius + v_strokeWidth, 0.1);
  float fillLimit = v_radius / totalRadius;
  vec4 color = dist <= fillLimit ? v_fillColor : v_strokeColor;
  gl_FragColor = vec4(color.rgb, color.a * smoothstep(1.0, 0.92, dist));
}
`;

const iconVertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const iconFragmentShaderSource = `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texCoord;
void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  if (color.a <= 0.01) discard;
  gl_FragColor = color;
}
`;

const STRIDE_FLOATS = 12;
const STRIDE_BYTES = STRIDE_FLOATS * 4;
const ICON_STRIDE_FLOATS = 4;
const ICON_STRIDE_BYTES = ICON_STRIDE_FLOATS * 4;
const ICON_ATLAS_COLS = 16;
const ICON_CELL_SIZE = 128;
const ICON_ATLAS_SIZE = ICON_ATLAS_COLS * ICON_CELL_SIZE;
const ICON_CELL_PADDING = 4;

const toNdc = (point, size) => [
  (point.x / size.x) * 2 - 1,
  1 - (point.y / size.y) * 2,
];

const parseHexColor = color => {
  const normalized = color.trim();
  if (!normalized.startsWith("#")) return [1, 1, 1, 1];
  const raw = normalized.slice(1);
  const value = raw.length === 3 || raw.length === 4
    ? raw.split("").map(char => char + char).join("")
    : raw;
  const number = Number.parseInt(value, 16);
  if (!Number.isFinite(number)) return [1, 1, 1, 1];
  const hasAlpha = value.length === 8;
  return [
    ((number >> (hasAlpha ? 24 : 16)) & 255) / 255,
    ((number >> (hasAlpha ? 16 : 8)) & 255) / 255,
    ((number >> (hasAlpha ? 8 : 0)) & 255) / 255,
    hasAlpha ? (number & 255) / 255 : 1,
  ];
};

const parseRgbColor = color => {
  const match = color?.trim?.()?.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return null;
  const channels = match[1].split(",").map(channel => Number.parseFloat(channel.trim()));
  if (channels.slice(0, 3).some(channel => !Number.isFinite(channel))) return null;
  return [
    Math.min(Math.max(channels[0], 0), 255) / 255,
    Math.min(Math.max(channels[1], 0), 255) / 255,
    Math.min(Math.max(channels[2], 0), 255) / 255,
    Number.isFinite(channels[3]) ? Math.min(Math.max(channels[3], 0), 1) : 1,
  ];
};

const parseCssColor = color => parseRgbColor(color) || parseHexColor(color || "#ffffff");

const resolveCssColor = color => {
  const match = color?.match?.(/^var\((--[^)]+)\)$/);
  if (!match) return parseCssColor(color);
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return parseCssColor(resolved);
};

const normalizeStationList = stations => Array.isArray(stations)
  ? stations
  : Object.values(stations || {});

const asFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const snapToDevicePixel = (value, pixelRatio) => Math.round(value * pixelRatio) / pixelRatio;

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
};

const createProgram = (gl, vertexSource, fragmentSource) => {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
};

class StationWebglLayer {
  constructor(map) {
    this.map = map;
    this.sources = new Map();
    this.sourceVersion = 0;
    this.colorCache = new Map();
    this.styleCache = new WeakMap();
    this.circleItems = [];
    this.iconItems = [];
    this.circleVertexBuffer = new Float32Array(0);
    this.iconVertexBuffer = new Float32Array(0);
    this.scaledIconUrlCache = new Map();
    this.renderQueued = false;
    this.supported = false;
    this.canvas = this.createCanvas();
    this.gl = this.createContext(this.canvas);
    this.supported = Boolean(this.gl);
    setPerfValue("webgl.station.available", this.supported);

    if (this.supported) {
      this.program = createProgram(this.gl, vertexShaderSource, fragmentShaderSource);
      this.buffer = this.gl.createBuffer();
      this.iconProgram = createProgram(this.gl, iconVertexShaderSource, iconFragmentShaderSource);
      this.iconBuffer = this.gl.createBuffer();
      this.iconAtlas = this.createIconAtlas();
      this.locations = {
        position: this.gl.getAttribLocation(this.program, "a_position"),
        radius: this.gl.getAttribLocation(this.program, "a_radius"),
        fillColor: this.gl.getAttribLocation(this.program, "a_fillColor"),
        strokeColor: this.gl.getAttribLocation(this.program, "a_strokeColor"),
        strokeWidth: this.gl.getAttribLocation(this.program, "a_strokeWidth"),
        pixelRatio: this.gl.getUniformLocation(this.program, "u_pixelRatio"),
      };
      this.iconLocations = {
        position: this.gl.getAttribLocation(this.iconProgram, "a_position"),
        texCoord: this.gl.getAttribLocation(this.iconProgram, "a_texCoord"),
        texture: this.gl.getUniformLocation(this.iconProgram, "u_texture"),
      };
      this.map.on("move zoom resize viewreset", this.reset, this);
      this.map.on("zoomanim", this.animateZoom, this);
      this.reset();
    }
  }

  createCanvas() {
    if (!this.map.getPane("stationWebglPane")) {
      this.map.createPane("stationWebglPane");
      // 站点内部顺序交给 WebGL 排序，pane 放在普通站点范围顶部。
      this.map.getPane("stationWebglPane").style.zIndex = 70;
    }
    const canvas = L.DomUtil.create("canvas", "leaflet-station-webgl-layer leaflet-zoom-animated", this.map.getPane("stationWebglPane"));
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.transformOrigin = "0 0";
    return canvas;
  }

  createContext(canvas) {
    return canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: false,
      stencil: false,
    });
  }

  createIconAtlas() {
    const canvas = document.createElement("canvas");
    canvas.width = ICON_ATLAS_SIZE;
    canvas.height = ICON_ATLAS_SIZE;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      ICON_ATLAS_SIZE,
      ICON_ATLAS_SIZE,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null,
    );
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    return {
      canvas,
      context,
      texture,
      entries: new Map(),
      nextIndex: 0,
    };
  }

  reset = () => {
    const size = this.map.getSize();
    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = size.x * pixelRatio;
    this.canvas.height = size.y * pixelRatio;
    this.canvas.style.width = `${size.x}px`;
    this.canvas.style.height = `${size.y}px`;
    L.DomUtil.setPosition(this.canvas, topLeft);
    this.requestRender();
  };

  animateZoom = event => {
    const scale = this.map.getZoomScale(event.zoom);
    const bounds = L.latLngBounds(
      this.map.containerPointToLatLng([0, 0]),
      this.map.containerPointToLatLng(this.map.getSize()),
    );
    const topLeft = this.map._latLngBoundsToNewLayerBounds(bounds, event.zoom, event.center).min;
    L.DomUtil.setTransform(this.canvas, topLeft, scale);
  };

  setStations(source, stations) {
    this.sources.set(source, {
      stations,
      list: normalizeStationList(stations),
      version: ++this.sourceVersion,
    });
    this.requestRender();
  }

  removeSource(source) {
    this.sources.delete(source);
    this.requestRender();
  }

  requestRender() {
    if (!this.supported || this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.render();
    });
  }

  render() {
    const startedAt = performance.now();
    const gl = this.gl;
    const canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const circleBatch = this.buildCircleVertices();
    const circleCount = circleBatch.count;

    if (circleBatch.vertices.length) {
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, circleBatch.vertices, gl.STREAM_DRAW);
      this.bindAttributes();
      gl.uniform1f(this.locations.pixelRatio, window.devicePixelRatio || 1);
      gl.drawArrays(gl.POINTS, 0, circleCount);
    }

    const iconBatch = this.buildIconVertices();
    const iconCount = iconBatch.count;
    if (iconBatch.vertices.length) this.drawIcons(iconBatch.vertices);
    setPerfValue("webgl.station.circleCount", circleCount);
    setPerfValue("webgl.station.iconCount", iconCount);
    setPerfValue("webgl.station.totalCount", circleCount + iconCount);
    countPerf("webgl.station.render.frames");
    measurePerf("webgl.station.render", startedAt);
  }

  bindAttributes() {
    const gl = this.gl;
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, STRIDE_BYTES, 0);
    gl.enableVertexAttribArray(this.locations.radius);
    gl.vertexAttribPointer(this.locations.radius, 1, gl.FLOAT, false, STRIDE_BYTES, 8);
    gl.enableVertexAttribArray(this.locations.fillColor);
    gl.vertexAttribPointer(this.locations.fillColor, 4, gl.FLOAT, false, STRIDE_BYTES, 12);
    gl.enableVertexAttribArray(this.locations.strokeColor);
    gl.vertexAttribPointer(this.locations.strokeColor, 4, gl.FLOAT, false, STRIDE_BYTES, 28);
    gl.enableVertexAttribArray(this.locations.strokeWidth);
    gl.vertexAttribPointer(this.locations.strokeWidth, 1, gl.FLOAT, false, STRIDE_BYTES, 44);
  }

  drawIcons(vertices) {
    const gl = this.gl;
    gl.useProgram(this.iconProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iconBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(this.iconLocations.position);
    gl.vertexAttribPointer(this.iconLocations.position, 2, gl.FLOAT, false, ICON_STRIDE_BYTES, 0);
    gl.enableVertexAttribArray(this.iconLocations.texCoord);
    gl.vertexAttribPointer(this.iconLocations.texCoord, 2, gl.FLOAT, false, ICON_STRIDE_BYTES, 8);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.iconAtlas.texture);
    gl.uniform1i(this.iconLocations.texture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / ICON_STRIDE_FLOATS);
  }

  collectStyledStations(mode) {
    const items = mode === "circle" ? this.circleItems : this.iconItems;
    items.length = 0;
    this.sources.forEach(source => {
      source.list.forEach(station => {
        const style = this.getStationStyle(station, mode);
        if (style) items.push(style);
      });
    });
    items.sort((a, b) => a.zIndex - b.zIndex);
    return items;
  }

  getStationStyle(station, mode) {
    if (station?.map !== this.map || !station.webglStyle) return null;
    const style = station.webglStyle;
    const styleMode = style.mode || "circle";
    if (styleMode !== mode) return null;

    const fingerprint = mode === "circle"
      ? [mode, style.radius, style.fillColor, style.strokeColor, style.strokeWidth, style.zIndex].join("|")
      : [mode, style.iconKey, style.iconUrl, style.radius, style.size, style.zIndex].join("|");
    const cached = this.styleCache.get(station);
    if (cached?.fingerprint === fingerprint) return cached;

    const entry = mode === "circle"
      ? {
          station,
          mode,
          fingerprint,
          zIndex: asFiniteNumber(style.zIndex),
          radius: asFiniteNumber(style.radius),
          fill: this.resolveColor(style.fillColor),
          stroke: this.resolveColor(style.strokeColor),
          strokeWidth: asFiniteNumber(style.strokeWidth),
        }
      : {
          station,
          mode,
          fingerprint,
          zIndex: asFiniteNumber(style.zIndex),
          radius: asFiniteNumber(style.radius),
          size: asFiniteNumber(style.size, asFiniteNumber(style.radius) * 2),
          iconEntry: this.getIconEntry(style),
        };
    this.styleCache.set(station, entry);
    return entry;
  }

  resolveColor(color) {
    const key = color || "#ffffff";
    if (!this.colorCache.has(key)) {
      this.colorCache.set(key, resolveCssColor(key));
    }
    return this.colorCache.get(key);
  }

  ensureVertexBuffer(name, requiredLength) {
    let buffer = this[name];
    if (buffer.length >= requiredLength) return buffer;
    let nextLength = Math.max(buffer.length, 256);
    while (nextLength < requiredLength) nextLength *= 2;
    buffer = new Float32Array(nextLength);
    this[name] = buffer;
    return buffer;
  }

  buildCircleVertices() {
    const size = this.map.getSize();
    const stations = this.collectStyledStations("circle");
    const vertices = this.ensureVertexBuffer("circleVertexBuffer", stations.length * STRIDE_FLOATS);
    let offset = 0;
    stations.forEach(style => {
      const point = this.map.latLngToContainerPoint(style.station.latLng);
      const [x, y] = toNdc(point, size);
      vertices[offset++] = x;
      vertices[offset++] = y;
      vertices[offset++] = style.radius;
      vertices[offset++] = style.fill[0];
      vertices[offset++] = style.fill[1];
      vertices[offset++] = style.fill[2];
      vertices[offset++] = style.fill[3];
      vertices[offset++] = style.stroke[0];
      vertices[offset++] = style.stroke[1];
      vertices[offset++] = style.stroke[2];
      vertices[offset++] = style.stroke[3];
      vertices[offset++] = style.strokeWidth;
    });
    return {
      vertices: vertices.subarray(0, offset),
      count: stations.length,
    };
  }

  buildIconVertices() {
    const size = this.map.getSize();
    const pixelRatio = window.devicePixelRatio || 1;
    const stations = this.collectStyledStations("icon");
    const vertices = this.ensureVertexBuffer("iconVertexBuffer", stations.length * ICON_STRIDE_FLOATS * 6);
    let offset = 0;
    let count = 0;
    stations.forEach(style => {
      const entry = style.iconEntry;
      if (!entry?.loaded) return;

      const rawPoint = this.map.latLngToContainerPoint(style.station.latLng);
      const point = {
        x: snapToDevicePixel(rawPoint.x, pixelRatio),
        y: snapToDevicePixel(rawPoint.y, pixelRatio),
      };
      const displaySize = snapToDevicePixel(style.size || style.radius * 2 || ICON_CELL_SIZE / 4, pixelRatio);
      const half = displaySize / 2;
      const left = snapToDevicePixel(point.x - half, pixelRatio);
      const right = snapToDevicePixel(point.x + half, pixelRatio);
      const top = snapToDevicePixel(point.y - half, pixelRatio);
      const bottom = snapToDevicePixel(point.y + half, pixelRatio);
      const [x0, y0] = toNdc({ x: left, y: top }, size);
      const [x1, y1] = toNdc({ x: right, y: bottom }, size);
      const { u0, v0, u1, v1 } = entry;

      vertices[offset++] = x0; vertices[offset++] = y0; vertices[offset++] = u0; vertices[offset++] = v0;
      vertices[offset++] = x1; vertices[offset++] = y0; vertices[offset++] = u1; vertices[offset++] = v0;
      vertices[offset++] = x1; vertices[offset++] = y1; vertices[offset++] = u1; vertices[offset++] = v1;
      vertices[offset++] = x0; vertices[offset++] = y0; vertices[offset++] = u0; vertices[offset++] = v0;
      vertices[offset++] = x1; vertices[offset++] = y1; vertices[offset++] = u1; vertices[offset++] = v1;
      vertices[offset++] = x0; vertices[offset++] = y1; vertices[offset++] = u0; vertices[offset++] = v1;
      count++;
    });
    return {
      vertices: vertices.subarray(0, offset),
      count,
    };
  }

  getIconEntry(style) {
    if (!style.iconUrl) return null;
    const key = style.iconKey || style.iconUrl;
    let entry = this.iconAtlas.entries.get(key);
    if (entry) return entry;
    if (this.iconAtlas.nextIndex >= ICON_ATLAS_COLS * ICON_ATLAS_COLS) return null;

    const index = this.iconAtlas.nextIndex++;
    const col = index % ICON_ATLAS_COLS;
    const row = Math.floor(index / ICON_ATLAS_COLS);
    entry = {
      key,
      loaded: false,
      x: col * ICON_CELL_SIZE,
      y: row * ICON_CELL_SIZE,
      u0: col * ICON_CELL_SIZE / ICON_ATLAS_SIZE,
      v0: row * ICON_CELL_SIZE / ICON_ATLAS_SIZE,
      u1: (col + 1) * ICON_CELL_SIZE / ICON_ATLAS_SIZE,
      v1: (row + 1) * ICON_CELL_SIZE / ICON_ATLAS_SIZE,
    };
    this.iconAtlas.entries.set(key, entry);
    this.loadIcon(style, entry);
    return entry;
  }

  async createScaledIconUrl(url, targetSize) {
    const cacheKey = `${targetSize}|${url}`;
    if (this.scaledIconUrlCache.has(cacheKey)) return this.scaledIconUrlCache.get(cacheKey);
    try {
      const text = await fetch(url).then(response => {
        if (!response.ok) throw new Error(`failed to load icon: ${response.status}`);
        return response.text();
      });
      if (!text.trimStart().startsWith("<svg")) throw new Error("not an svg icon");
      const svgText = text.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
        const cleanedAttrs = attrs
          .replace(/\swidth=(['"])[^'"]*\1/i, "")
          .replace(/\sheight=(['"])[^'"]*\1/i, "");
        return `<svg${cleanedAttrs} width="${targetSize}" height="${targetSize}">`;
      });
      const objectUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
      this.scaledIconUrlCache.set(cacheKey, objectUrl);
      return objectUrl;
    } catch {
      this.scaledIconUrlCache.set(cacheKey, url);
      return url;
    }
  }

  loadIcon(style, entry) {
    const image = new Image();
    image.decoding = "async";
    const targetSize = ICON_CELL_SIZE - ICON_CELL_PADDING * 2;
    image.onload = () => {
      const offset = (ICON_CELL_SIZE - targetSize) / 2;
      const context = this.iconAtlas.context;
      const cellCanvas = document.createElement("canvas");
      cellCanvas.width = ICON_CELL_SIZE;
      cellCanvas.height = ICON_CELL_SIZE;
      const cellContext = cellCanvas.getContext("2d");
      cellContext.imageSmoothingEnabled = true;
      cellContext.imageSmoothingQuality = "high";
      cellContext.drawImage(image, offset, offset, targetSize, targetSize);
      context.clearRect(entry.x, entry.y, ICON_CELL_SIZE, ICON_CELL_SIZE);
      // 图集里保持高分辨率，地图上的实际大小只交给顶点控制。
      context.drawImage(cellCanvas, entry.x, entry.y);
      entry.loaded = true;
      this.uploadIconCell(entry, cellCanvas);
      this.requestRender();
    };
    image.onerror = () => {
      this.iconAtlas.entries.delete(entry.key);
    };
    void this.createScaledIconUrl(style.iconUrl, targetSize).then(url => {
      image.src = url;
    });
  }

  uploadIconCell(entry, sourceCanvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.iconAtlas.texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      entry.x,
      entry.y,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceCanvas,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}

export const getStationWebglLayer = map => {
  if (!map) return null;
  if (!map._kanameishiStationWebglLayer) {
    map._kanameishiStationWebglLayer = new StationWebglLayer(map);
  }
  return map._kanameishiStationWebglLayer.supported
    ? map._kanameishiStationWebglLayer
    : null;
};
