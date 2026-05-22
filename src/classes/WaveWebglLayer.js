import L from 'leaflet';
import { countPerf, measurePerf, setPerfValue } from '@/utils/PerfMetrics';

const SEGMENTS = 160;
const RING_WIDTH_PX = 2;
const STROKE_STRIDE_FLOATS = 7;
const STROKE_STRIDE_BYTES = STROKE_STRIDE_FLOATS * 4;
const FILL_STRIDE_FLOATS = 8;
const FILL_STRIDE_BYTES = FILL_STRIDE_FLOATS * 4;
const TWO_PI = Math.PI * 2;

const strokeVertexShaderSource = `
attribute vec2 a_position;
attribute float a_alphaScale;
attribute vec4 a_color;
varying float v_alphaScale;
varying vec4 v_color;
void main() {
  v_alphaScale = a_alphaScale;
  v_color = a_color;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const strokeFragmentShaderSource = `
precision mediump float;
varying float v_alphaScale;
varying vec4 v_color;
void main() {
  gl_FragColor = vec4(v_color.rgb, v_color.a * v_alphaScale);
}
`;

const fillVertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_unitPosition;
attribute vec4 a_color;
varying vec2 v_unitPosition;
varying vec4 v_color;
void main() {
  v_unitPosition = a_unitPosition;
  v_color = a_color;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fillFragmentShaderSource = `
precision mediump float;
varying vec2 v_unitPosition;
varying vec4 v_color;
void main() {
  float radius = clamp(length(v_unitPosition), 0.0, 1.0);
  float bodyScale = smoothstep(0.18, 0.70, radius) * (1.0 - smoothstep(0.92, 1.0, radius));
  float edgeScale = smoothstep(0.70, 1.0, radius);
  vec3 bodyColor = mix(v_color.rgb, vec3(0.0), 0.38);
  vec3 edgeColor = mix(v_color.rgb, vec3(1.0), edgeScale * 0.24);
  vec3 waveColor = mix(bodyColor, edgeColor, edgeScale);
  float alphaScale = max(bodyScale * 0.55, edgeScale);
  gl_FragColor = vec4(waveColor, v_color.a * alphaScale);
}
`;

export const canUseWaveWebgl = () => {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    stencil: false,
  });
  if (!gl) return false;
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
};

const parseHexColor = color => {
  const normalized = color.trim();
  if (!normalized.startsWith("#")) return [1, 1, 1];
  const value = normalized.length === 4
    ? normalized.slice(1).split("").map(char => char + char).join("")
    : normalized.slice(1, 7);
  const number = Number.parseInt(value, 16);
  if (!Number.isFinite(number)) return [1, 1, 1];
  return [
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  ];
};

const parseRgbColor = color => {
  const match = color
    ?.trim()
    ?.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return null;
  const channels = match[1]
    .split(",")
    .slice(0, 3)
    .map(channel => Number.parseFloat(channel.trim()));
  if (channels.some(channel => !Number.isFinite(channel))) return null;
  return channels.map(channel => Math.min(Math.max(channel, 0), 255) / 255);
};

const parseCssColor = color =>
  parseRgbColor(color) || parseHexColor(color || "#ffffff");

const resolveCssColor = color => {
  const match = color?.match?.(/^var\((--[^)]+)\)$/);
  if (!match) return parseCssColor(color);
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  return parseCssColor(resolved);
};

const asFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

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

class WaveWebglLayer {
  constructor(map) {
    this.map = map;
    this.waves = new Map();
    this.colorCache = new Map();
    this.fillVertexBuffer = new Float32Array(0);
    this.pRingVertexBuffer = new Float32Array(0);
    this.sRingVertexBuffer = new Float32Array(0);
    this.renderQueued = false;
    this.supported = false;
    this.canvases = {
      fill: this.createCanvas("waveFillPane"),
      stroke: this.createCanvas("wavePane"),
    };
    this.contexts = {
      fill: this.createContext(this.canvases.fill),
      stroke: this.createContext(this.canvases.stroke),
    };
    this.supported = Boolean(this.contexts.fill && this.contexts.stroke);
    setPerfValue("webgl.wave.layerAvailable", this.supported);

    if (this.supported) {
      this.renderers = {
        fill: this.createFillRenderer(this.contexts.fill),
        stroke: this.createRenderer(this.contexts.stroke),
      };
      this.map.on("move zoom resize viewreset", this.reset, this);
      this.reset();
    }
  }

  createCanvas(paneName) {
    const pane = this.map.getPane(paneName);
    const canvas = L.DomUtil.create("canvas", "leaflet-wave-webgl-layer", pane);
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
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

  createRenderer(gl) {
    const program = createProgram(gl, strokeVertexShaderSource, strokeFragmentShaderSource);
    return {
      gl,
      program,
      buffer: gl.createBuffer(),
      positionLocation: gl.getAttribLocation(program, "a_position"),
      alphaLocation: gl.getAttribLocation(program, "a_alphaScale"),
      colorLocation: gl.getAttribLocation(program, "a_color"),
    };
  }

  createFillRenderer(gl) {
    const program = createProgram(gl, fillVertexShaderSource, fillFragmentShaderSource);
    return {
      gl,
      program,
      buffer: gl.createBuffer(),
      positionLocation: gl.getAttribLocation(program, "a_position"),
      unitPositionLocation: gl.getAttribLocation(program, "a_unitPosition"),
      colorLocation: gl.getAttribLocation(program, "a_color"),
    };
  }

  createFillRenderer(gl) {
    const program = createProgram(gl, fillVertexShaderSource, fillFragmentShaderSource);
    return {
      gl,
      program,
      buffer: gl.createBuffer(),
      positionLocation: gl.getAttribLocation(program, "a_position"),
      unitPositionLocation: gl.getAttribLocation(program, "a_unitPosition"),
      colorLocation: gl.getUniformLocation(program, "u_color"),
    };
  }

  reset = () => {
    const size = this.map.getSize();
    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    Object.values(this.canvases).forEach(canvas => {
      canvas.width = size.x * window.devicePixelRatio;
      canvas.height = size.y * window.devicePixelRatio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      L.DomUtil.setPosition(canvas, topLeft);
    });
    this.requestRender();
  };

  setWave(id, wave) {
    this.waves.set(id, wave);
    this.requestRender();
  }

  removeWave(id) {
    this.waves.delete(id);
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
    this.clearRenderer(this.renderers.fill);
    this.clearRenderer(this.renderers.stroke);
    const size = this.map.getSize();
    let visibleWaves = 0;
    this.waves.forEach(wave => {
      if (wave.fillVisible || wave.pVisible || wave.sVisible) visibleWaves += 1;
    });

    let drawCalls = 0;
    const fillBatch = this.buildFillBatch(size);
    if (fillBatch.vertices.length) {
      this.drawFillBatch(this.renderers.fill, fillBatch.vertices);
      drawCalls += 1;
    }

    const pRingBatch = this.buildRingBatch(size, "p");
    if (pRingBatch.vertices.length) {
      this.drawStrokeBatch(this.renderers.stroke, pRingBatch.vertices);
      drawCalls += 1;
    }

    const sRingBatch = this.buildRingBatch(size, "s");
    if (sRingBatch.vertices.length) {
      this.drawStrokeBatch(this.renderers.stroke, sRingBatch.vertices);
      drawCalls += 1;
    }

    setPerfValue("webgl.wave.count", visibleWaves);
    setPerfValue("webgl.wave.fillVertexCount", fillBatch.count);
    setPerfValue("webgl.wave.pRingVertexCount", pRingBatch.count);
    setPerfValue("webgl.wave.sRingVertexCount", sRingBatch.count);
    setPerfValue("webgl.wave.drawCalls", drawCalls);
    countPerf("webgl.wave.render.frames");
    measurePerf("webgl.wave.render", startedAt);
  }

  clearRenderer(renderer) {
    const { gl } = renderer;
    const canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  radiusToPixels(lat, lng, radiusKm) {
    const center = L.latLng(lat, lng);
    const lngOffset = radiusKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.05));
    const edge = L.latLng(lat, lng + lngOffset);
    return this.map.latLngToContainerPoint(center).distanceTo(this.map.latLngToContainerPoint(edge));
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
    let nextLength = Math.max(buffer.length, 1024);
    while (nextLength < requiredLength) nextLength *= 2;
    buffer = new Float32Array(nextLength);
    this[name] = buffer;
    return buffer;
  }

  writeFillVertex(vertices, offset, x, y, size, unitX, unitY, rgb, opacity) {
    vertices[offset++] = (x / size.x) * 2 - 1;
    vertices[offset++] = 1 - (y / size.y) * 2;
    vertices[offset++] = unitX;
    vertices[offset++] = unitY;
    vertices[offset++] = rgb[0];
    vertices[offset++] = rgb[1];
    vertices[offset++] = rgb[2];
    vertices[offset++] = opacity;
    return offset;
  }

  writeStrokeVertex(vertices, offset, x, y, size, rgb, opacity) {
    vertices[offset++] = (x / size.x) * 2 - 1;
    vertices[offset++] = 1 - (y / size.y) * 2;
    vertices[offset++] = 1;
    vertices[offset++] = rgb[0];
    vertices[offset++] = rgb[1];
    vertices[offset++] = rgb[2];
    vertices[offset++] = opacity;
    return offset;
  }

  buildFillBatch(size) {
    const vertices = this.ensureVertexBuffer(
      "fillVertexBuffer",
      this.waves.size * SEGMENTS * 3 * FILL_STRIDE_FLOATS,
    );
    let offset = 0;
    let count = 0;
    this.waves.forEach(wave => {
      if (!wave.fillVisible) return;
      const radiusPx = this.radiusToPixels(wave.lat, wave.lng, wave.sRadiusKm);
      if (!Number.isFinite(radiusPx) || radiusPx <= 0) return;

      const center = this.map.latLngToContainerPoint([wave.lat, wave.lng]);
      const rgb = this.resolveColor(wave.color);
      const opacity = asFiniteNumber(wave.fillOpacity);
      for (let i = 0; i < SEGMENTS; i++) {
        const angleA = (i / SEGMENTS) * TWO_PI;
        const angleB = ((i + 1) / SEGMENTS) * TWO_PI;
        const cosA = Math.cos(angleA);
        const sinA = Math.sin(angleA);
        const cosB = Math.cos(angleB);
        const sinB = Math.sin(angleB);
        offset = this.writeFillVertex(vertices, offset, center.x, center.y, size, 0, 0, rgb, opacity);
        offset = this.writeFillVertex(
          vertices,
          offset,
          center.x + cosA * radiusPx,
          center.y + sinA * radiusPx,
          size,
          cosA,
          sinA,
          rgb,
          opacity,
        );
        offset = this.writeFillVertex(
          vertices,
          offset,
          center.x + cosB * radiusPx,
          center.y + sinB * radiusPx,
          size,
          cosB,
          sinB,
          rgb,
          opacity,
        );
      }
      count += SEGMENTS * 3;
    });
    return {
      vertices: vertices.subarray(0, offset),
      count,
    };
  }

  buildRingBatch(size, waveType) {
    const vertices = this.ensureVertexBuffer(
      waveType === "p" ? "pRingVertexBuffer" : "sRingVertexBuffer",
      this.waves.size * SEGMENTS * 6 * STROKE_STRIDE_FLOATS,
    );
    let offset = 0;
    let count = 0;
    this.waves.forEach(wave => {
      const visible = waveType === "p" ? wave.pVisible : wave.sVisible;
      if (!visible) return;
      const radiusKm = waveType === "p" ? wave.pRadiusKm : wave.sRadiusKm;
      const opacity = asFiniteNumber(waveType === "p" ? wave.pOpacity : wave.sOpacity);
      const radiusPx = this.radiusToPixels(wave.lat, wave.lng, radiusKm);
      if (!Number.isFinite(radiusPx) || radiusPx <= 0 || opacity <= 0) return;

      const center = this.map.latLngToContainerPoint([wave.lat, wave.lng]);
      const rgb = this.resolveColor(waveType === "p" ? "#ffffff" : wave.color);
      const outer = radiusPx + RING_WIDTH_PX;
      const inner = Math.max(radiusPx - RING_WIDTH_PX, 0);
      for (let i = 0; i < SEGMENTS; i++) {
        const angleA = (i / SEGMENTS) * TWO_PI;
        const angleB = ((i + 1) / SEGMENTS) * TWO_PI;
        const cosA = Math.cos(angleA);
        const sinA = Math.sin(angleA);
        const cosB = Math.cos(angleB);
        const sinB = Math.sin(angleB);
        const outerAx = center.x + cosA * outer;
        const outerAy = center.y + sinA * outer;
        const innerAx = center.x + cosA * inner;
        const innerAy = center.y + sinA * inner;
        const outerBx = center.x + cosB * outer;
        const outerBy = center.y + sinB * outer;
        const innerBx = center.x + cosB * inner;
        const innerBy = center.y + sinB * inner;
        offset = this.writeStrokeVertex(vertices, offset, outerAx, outerAy, size, rgb, opacity);
        offset = this.writeStrokeVertex(vertices, offset, innerAx, innerAy, size, rgb, opacity);
        offset = this.writeStrokeVertex(vertices, offset, outerBx, outerBy, size, rgb, opacity);
        offset = this.writeStrokeVertex(vertices, offset, outerBx, outerBy, size, rgb, opacity);
        offset = this.writeStrokeVertex(vertices, offset, innerAx, innerAy, size, rgb, opacity);
        offset = this.writeStrokeVertex(vertices, offset, innerBx, innerBy, size, rgb, opacity);
      }
      count += SEGMENTS * 6;
    });
    return {
      vertices: vertices.subarray(0, offset),
      count,
    };
  }

  drawStrokeBatch(renderer, vertices) {
    const { gl, program, buffer, positionLocation, alphaLocation, colorLocation } = renderer;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, STROKE_STRIDE_BYTES, 0);
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, STROKE_STRIDE_BYTES, 8);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, STROKE_STRIDE_BYTES, 12);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / STROKE_STRIDE_FLOATS);
  }

  drawFillBatch(renderer, vertices) {
    const {
      gl,
      program,
      buffer,
      positionLocation,
      unitPositionLocation,
      colorLocation,
    } = renderer;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, FILL_STRIDE_BYTES, 0);
    gl.enableVertexAttribArray(unitPositionLocation);
    gl.vertexAttribPointer(unitPositionLocation, 2, gl.FLOAT, false, FILL_STRIDE_BYTES, 8);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, FILL_STRIDE_BYTES, 16);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / FILL_STRIDE_FLOATS);
  }

  drawFillVertices(renderer, vertices, color, opacity) {
    const {
      gl,
      program,
      buffer,
      positionLocation,
      unitPositionLocation,
      colorLocation,
    } = renderer;
    const rgb = resolveCssColor(color);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(unitPositionLocation);
    gl.vertexAttribPointer(unitPositionLocation, 2, gl.FLOAT, false, 16, 8);
    gl.uniform4f(colorLocation, rgb[0], rgb[1], rgb[2], opacity);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 4);
  }
}

export const getWaveWebglLayer = map => {
  if (!map._kanameishiWaveWebglLayer) {
    map._kanameishiWaveWebglLayer = new WaveWebglLayer(map);
  }
  return map._kanameishiWaveWebglLayer.supported
    ? map._kanameishiWaveWebglLayer
    : null;
};
