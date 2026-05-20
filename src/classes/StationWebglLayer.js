import L from 'leaflet';

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

const STRIDE_FLOATS = 12;
const STRIDE_BYTES = STRIDE_FLOATS * 4;

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
    this.renderQueued = false;
    this.supported = false;
    this.canvas = this.createCanvas();
    this.gl = this.createContext(this.canvas);
    this.supported = Boolean(this.gl);

    if (this.supported) {
      this.program = createProgram(this.gl, vertexShaderSource, fragmentShaderSource);
      this.buffer = this.gl.createBuffer();
      this.locations = {
        position: this.gl.getAttribLocation(this.program, "a_position"),
        radius: this.gl.getAttribLocation(this.program, "a_radius"),
        fillColor: this.gl.getAttribLocation(this.program, "a_fillColor"),
        strokeColor: this.gl.getAttribLocation(this.program, "a_strokeColor"),
        strokeWidth: this.gl.getAttribLocation(this.program, "a_strokeWidth"),
        pixelRatio: this.gl.getUniformLocation(this.program, "u_pixelRatio"),
      };
      this.map.on("move zoom resize viewreset", this.reset, this);
      this.reset();
    }
  }

  createCanvas() {
    if (!this.map.getPane("stationWebglPane")) {
      this.map.createPane("stationWebglPane");
      this.map.getPane("stationWebglPane").style.zIndex = 50;
    }
    const canvas = L.DomUtil.create("canvas", "leaflet-station-webgl-layer", this.map.getPane("stationWebglPane"));
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

  setStations(source, stations) {
    this.sources.set(source, stations);
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
    const gl = this.gl;
    const canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vertices = this.buildVertices();
    if (!vertices.length) return;

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    this.bindAttributes();
    gl.uniform1f(this.locations.pixelRatio, window.devicePixelRatio || 1);
    gl.drawArrays(gl.POINTS, 0, vertices.length / STRIDE_FLOATS);
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

  buildVertices() {
    const size = this.map.getSize();
    const stations = [];
    this.sources.forEach(sourceStations => {
      const list = Array.isArray(sourceStations)
        ? sourceStations
        : Object.values(sourceStations || {});
      list.forEach(station => {
        if (station?.map !== this.map || station.markerType === 2 || !station.webglStyle) return;
        stations.push(station);
      });
    });
    stations.sort((a, b) => (a.webglStyle.zIndex || 0) - (b.webglStyle.zIndex || 0));

    const vertices = [];
    stations.forEach(station => {
      const style = station.webglStyle;
      const point = this.map.latLngToContainerPoint(station.latLng);
      const fill = resolveCssColor(style.fillColor);
      const stroke = resolveCssColor(style.strokeColor);
      vertices.push(
        ...toNdc(point, size),
        style.radius,
        ...fill,
        ...stroke,
        style.strokeWidth,
      );
    });
    return vertices;
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
