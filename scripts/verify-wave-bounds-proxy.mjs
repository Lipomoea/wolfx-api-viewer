import assert from "node:assert/strict";

import {
  calcWaveBounds,
  normalizeWaveRadius,
} from "../src/classes/WaveBoundsProxyCore.js";

const roughly = (actual, expected, epsilon = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
};

assert.equal(normalizeWaveRadius(1200), 1200);
assert.equal(normalizeWaveRadius(0), 0);
assert.equal(normalizeWaveRadius(-1), 0);
assert.equal(normalizeWaveRadius(Number.NaN), 0);

const zero = calcWaveBounds({ lat: 35, lng: 135 }, 0);
assert.deepEqual(zero, {
  southWest: { lat: 35, lng: 135 },
  northEast: { lat: 35, lng: 135 },
});

const oneKm = calcWaveBounds({ lat: 0, lng: 0 }, 1000);
roughly(oneKm.southWest.lat, -0.008993216059);
roughly(oneKm.northEast.lat, 0.008993216059);
roughly(oneKm.southWest.lng, -0.008993216059);
roughly(oneKm.northEast.lng, 0.008993216059);

const polar = calcWaveBounds({ lat: 89.99, lng: 140 }, 5000);
assert.equal(polar.southWest.lng, -40);
assert.equal(polar.northEast.lng, 320);
assert.equal(polar.northEast.lat, 90);

console.log("wave bounds proxy checks passed");
