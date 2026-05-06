import { calcSurfaceDistanceKm } from "./SeismicCalculations";

let jmaSeisIntLocCache = null;
let jmaSeisIntLocPromise = null;

export const loadJmaSeisIntLoc = async () => {
  if (jmaSeisIntLocCache) return jmaSeisIntLocCache;
  jmaSeisIntLocPromise ||= import("./JmaSeisIntLoc").then(module => {
    jmaSeisIntLocCache = module.jmaSeisIntLoc;
    return jmaSeisIntLocCache;
  });
  return jmaSeisIntLocPromise;
};

export const findNearestJmaLoc = (
  userLatLng,
  jmaSeisIntLoc = jmaSeisIntLocCache,
) => {
  if (!jmaSeisIntLoc) return null;
  if (
    !Array.isArray(userLatLng) ||
    !userLatLng.every(item => item || item === 0) ||
    userLatLng.every(item => item === 0)
  ) {
    return null;
  }

  const userCoord = [userLatLng[1], userLatLng[0]];
  let nearestLoc = null;
  let nearestDist = 30;
  for (const loc in jmaSeisIntLoc) {
    const locCoord = [
      jmaSeisIntLoc[loc].location[1],
      jmaSeisIntLoc[loc].location[0],
    ];
    if (
      Math.abs(userCoord[0] - locCoord[0]) >= 0.39 ||
      Math.abs(userCoord[1] - locCoord[1]) >= 0.27
    ) {
      continue;
    }

    const dist = calcSurfaceDistanceKm(
      userCoord[1],
      userCoord[0],
      locCoord[1],
      locCoord[0],
    );
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestLoc = jmaSeisIntLoc[loc];
    }
  }
  return nearestLoc;
};

export const loadNearestJmaLoc = async userLatLng =>
  findNearestJmaLoc(userLatLng, await loadJmaSeisIntLoc());
