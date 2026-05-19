import L from 'leaflet';

const SEGMENTS = 160;
const RING_WIDTH_PX = 2;

const strokeVertexShaderSource = `
attribute vec2 a_position;
attribute float a_alphaScale;
varying float v_alphaScale;
void main() {
  v_alphaScale = a_alphaScale;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const strokeFragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
varying float v_alphaScale;
void main() {
  gl_FragColor = vec4(u_color.rgb, u_color.a * v_alphaScale);
}
`;

const fillVertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_unitPosition;
varying vec2 v_unitPosition;
void main() {
  v_unitPosition = a_unitPosition;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fillFragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
varying vec2 v_unitPosition;
void main() {
  float alphaScale = clamp(length(v_unitPosition), 0.0, 1.0);
  gl_FragColor = vec4(u_color.rgb, u_color.a * alphaScale);
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

const toNdc = (point, size) => [
  (point.x / size.x) * 2 - 1,
  1 - (point.y / size.y) * 2,
];

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
      colorLocation: gl.getUniformLocation(program, "u_color"),
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
    this.clearRenderer(this.renderers.fill);
    this.clearRenderer(this.renderers.stroke);
    const size = this.map.getSize();
    this.waves.forEach(wave => {
      if (wave.fillVisible) this.drawFill(this.renderers.fill, wave, size);
      if (wave.pVisible) this.drawRing(this.renderers.stroke, wave, wave.pRadiusKm, wave.pOpacity, "#ffffff", size);
      if (wave.sVisible) this.drawRing(this.renderers.stroke, wave, wave.sRadiusKm, wave.sOpacity, wave.color, size);
    });
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

  drawFill(renderer, wave, size) {
    const center = this.map.latLngToContainerPoint([wave.lat, wave.lng]);
    const radiusPx = this.radiusToPixels(wave.lat, wave.lng, wave.sRadiusKm);
    const vertices = [];
    vertices.push(...toNdc(center, size), 0, 0);
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const point = L.point(
        center.x + cos * radiusPx,
        center.y + sin * radiusPx,
      );
      vertices.push(...toNdc(point, size), cos, sin);
    }
    this.drawFillVertices(renderer, vertices, wave.color, wave.fillOpacity);
  }

  drawRing(renderer, wave, radiusKm, opacity, color, size) {
    const center = this.map.latLngToContainerPoint([wave.lat, wave.lng]);
    const radiusPx = this.radiusToPixels(wave.lat, wave.lng, radiusKm);
    const outer = radiusPx + RING_WIDTH_PX;
    const inner = Math.max(radiusPx - RING_WIDTH_PX, 0);
    const vertices = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const outerPoint = L.point(center.x + cos * outer, center.y + sin * outer);
      const innerPoint = L.point(center.x + cos * inner, center.y + sin * inner);
      vertices.push(...toNdc(outerPoint, size), 1, ...toNdc(innerPoint, size), 1);
    }
    this.drawVertices(renderer, vertices, color, opacity, renderer.gl.TRIANGLE_STRIP);
  }

  drawVertices(renderer, vertices, color, opacity, mode) {
    const { gl, program, buffer, positionLocation, alphaLocation, colorLocation } = renderer;
    const rgb = resolveCssColor(color);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 12, 8);
    gl.uniform4f(colorLocation, rgb[0], rgb[1], rgb[2], opacity);
    gl.drawArrays(mode, 0, vertices.length / 3);
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
