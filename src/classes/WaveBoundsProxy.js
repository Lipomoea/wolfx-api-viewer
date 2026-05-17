import L from 'leaflet';
import { calcWaveBounds, normalizeWaveRadius } from './WaveBoundsProxyCore';

export const WEBGL_WAVE_BOUNDS_PROXY = '_kanameishiWebglBoundsProxy';

export const isWebglWaveBoundsProxy = layer =>
  Boolean(layer?.[WEBGL_WAVE_BOUNDS_PROXY]);

// 不建SVG/DOM，只给Leaflet保留可读的中心点和范围。
export const WebglWaveBoundsProxy = L.Layer.extend({
  options: {
    pane: 'overlayPane',
    interactive: false,
  },

  initialize(latLng, radius, options = {}) {
    L.Util.setOptions(this, options);
    this[WEBGL_WAVE_BOUNDS_PROXY] = true;
    this._latlng = L.latLng(latLng);
    this._mRadius = normalizeWaveRadius(radius);
  },

  onAdd(map) {
    this._map = map;
  },

  onRemove() {
    this._map = null;
  },

  setLatLng(latLng) {
    const oldLatLng = this._latlng;
    this._latlng = L.latLng(latLng);
    return this.fire('move', { oldLatLng, latlng: this._latlng });
  },

  getLatLng() {
    return this._latlng;
  },

  getCenter() {
    return this._latlng;
  },

  setRadius(radius) {
    this._mRadius = normalizeWaveRadius(radius);
    return this.redraw();
  },

  getRadius() {
    return this._mRadius;
  },

  setStyle(style = {}) {
    L.Util.setOptions(this, style);
    return this.redraw();
  },

  getBounds() {
    const bounds = calcWaveBounds(this._latlng, this._mRadius);
    return L.latLngBounds(
      [bounds.southWest.lat, bounds.southWest.lng],
      [bounds.northEast.lat, bounds.northEast.lng],
    );
  },

  getElement() {
    return null;
  },

  bringToFront() {
    return this;
  },

  bringToBack() {
    return this;
  },

  redraw() {
    return this;
  },
});
