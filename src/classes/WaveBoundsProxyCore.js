const EARTH_RADIUS_METERS = 6371000;
const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const normalizeWaveRadius = radius =>
  Number.isFinite(radius) && radius > 0 ? radius : 0;

const normalizeLatLng = latLng => ({
  lat: clamp(Number(Array.isArray(latLng) ? latLng[0] : latLng?.lat) || 0, -90, 90),
  lng: Number(Array.isArray(latLng) ? latLng[1] : latLng?.lng) || 0,
});

export const calcWaveBounds = (latLng, radiusMeters) => {
  const center = normalizeLatLng(latLng);
  const radius = normalizeWaveRadius(radiusMeters);

  if (!radius) {
    return {
      southWest: center,
      northEast: center,
    };
  }

  const angular = radius / EARTH_RADIUS_METERS;
  const latDelta = angular * DEG;
  const south = clamp(center.lat - latDelta, -90, 90);
  const north = clamp(center.lat + latDelta, -90, 90);
  const latRad = center.lat * RAD;
  const reachesPole = south <= -90 || north >= 90 || angular >= Math.PI / 2;

  let lngDelta = 180;
  if (!reachesPole) {
    const cosLat = Math.abs(Math.cos(latRad));
    const ratio = cosLat > 0 ? Math.sin(angular) / cosLat : Infinity;
    // 近极区可能越过整圈经度，先夹住再算反三角。
    lngDelta = Number.isFinite(ratio)
      ? Math.asin(clamp(ratio, -1, 1)) * DEG
      : 180;
  }

  return {
    southWest: {
      lat: south,
      lng: center.lng - lngDelta,
    },
    northEast: {
      lat: north,
      lng: center.lng + lngDelta,
    },
  };
};
