const EARTH_RADIUS_KM = 6371;

const toRadians = value => (Number(value) * Math.PI) / 180;

export const calcSurfaceDistanceKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calcWaveDistance = (travelTime, isPWave, depth, time) => {
  if (depth < 0) depth = 0;
  if (time < 0) time = 0;
  const { depths, distances, p_times, s_times } = travelTime;
  const data = isPWave ? p_times : s_times;
  let i = 1;
  while (depths[i] < depth && i < depths.length - 1) i++;
  const k1 = depths[i] - depth;
  const k2 = depth - depths[i - 1];
  const times = [];
  for (let j = 0; j < distances.length; j++) {
    times[j] = (k1 * data[i - 1][j] + k2 * data[i][j]) / (k1 + k2);
  }
  if (time <= times[0]) return { reach: time / times[0], radius: 0 };
  let j = 1;
  while (times[j] < time && j < times.length - 1) j++;
  const k = (distances[j] - distances[j - 1]) / (times[j] - times[j - 1]);
  const b = distances[j] - k * times[j];
  const distance = k * time + b;
  return { reach: 1, radius: distance };
};

export const calcReachTime = (travelTime, isPWave, depth, distance) => {
  if (depth < 0) depth = 0;
  if (distance < 0) distance = 0;
  const { depths, distances, p_times, s_times } = travelTime;
  const data = isPWave ? p_times : s_times;
  let i = 1;
  while (depths[i] < depth && i < depths.length - 1) i++;
  const k1 = depths[i] - depth;
  const k2 = depth - depths[i - 1];
  const times = [];
  for (let j = 0; j < distances.length; j++) {
    times[j] = (k1 * data[i - 1][j] + k2 * data[i][j]) / (k1 + k2);
  }
  let j = 1;
  while (distances[j] < distance && j < distances.length - 1) j++;
  const k = (times[j] - times[j - 1]) / (distances[j] - distances[j - 1]);
  const b = times[j] - k * distances[j];
  const time = k * distance + b;
  return time;
};

export const getCsisLevelFromCsis = csis =>
  Math.min(Math.max(csis, 0), 12).toFixed(0);

const calcLineDis = (dep, dis) => {
  const theta = dis / EARTH_RADIUS_KM;
  const a = EARTH_RADIUS_KM - dep;
  const lineDis = Math.sqrt(
    a * a +
      EARTH_RADIUS_KM * EARTH_RADIUS_KM -
      2 * a * EARTH_RADIUS_KM * Math.cos(theta),
  );
  return lineDis;
};

const calcCeaCsis = (m, dis = 0) =>
  1.297 * m - 4.368 * Math.log10(dis + 15) + 5.363;

export const calcCsis = (m, dep = 10, dis = 0) => {
  m = Number(m);
  dep = Number(dep);
  dis = Number(dis);
  if (isNaN(m) || isNaN(dis)) return 0;
  if (dis > 10000) return 0;
  dep = isNaN(dep) || dep === null || dep < 10 ? 10 : dep;
  const lineDis = calcLineDis(dep, dis);
  const long = 10 ** ((m - 3.821) / 1.86);
  const hypoDis = Math.max(
    lineDis - 10 - long,
    dis - long,
    0.2 * (lineDis - 10),
    0,
  );
  const ceaCsis1 = calcCeaCsis(m, dis);
  const ceaCsis2 = calcCeaCsis(m, hypoDis);
  return (ceaCsis1 + ceaCsis2) / 2;
};

export const calcCsisLevel = (m, dep = 10, dis = 0) =>
  getCsisLevelFromCsis(calcCsis(m, dep, dis));

export const getShindoFromInstShindo = (instShindo, useSymbol = true) => {
  if (instShindo < -3.0) return "?";
  else if (instShindo < 0.5) return "0";
  else if (instShindo < 1.5) return "1";
  else if (instShindo < 2.5) return "2";
  else if (instShindo < 3.5) return "3";
  else if (instShindo < 4.5) return "4";
  else if (instShindo < 5.0) return useSymbol ? "5-" : "5弱";
  else if (instShindo < 5.5) return useSymbol ? "5+" : "5強";
  else if (instShindo < 6.0) return useSymbol ? "6-" : "6弱";
  else if (instShindo < 6.5) return useSymbol ? "6+" : "6強";
  else return "7";
};

export const calcJmaShindo = (mj, dep, hypoLat, hypoLng, loc) => {
  const mw = mj - 0.171;
  const long = 10 ** (0.5 * mw - 1.85) / 2;
  const surfaceDist = calcSurfaceDistanceKm(
    hypoLat,
    hypoLng,
    loc.location[0],
    loc.location[1],
  );
  const lineDis = calcLineDis(dep, surfaceDist);
  const hypoDist = lineDis - long;
  const x = Math.max(hypoDist, 3);
  const pgv600 =
    10 **
    (0.58 * mw +
      0.0038 * dep -
      1.29 -
      Math.log10(x + 0.0028 * 10 ** (0.5 * mw)) -
      0.002 * x);
  const arv = Number(loc.arv);
  const pgv400 = pgv600 * 1.307;
  const pgv = pgv400 * arv;
  const instShindo = 2.68 + 1.72 * Math.log10(pgv);
  return instShindo;
};

export const calcJmaShindoLevel = (
  mj,
  dep,
  hypoLat,
  hypoLng,
  loc,
  useSymbol = true,
) => {
  const instShindo = calcJmaShindo(mj, dep, hypoLat, hypoLng, loc);
  const instShindo1 = Math.floor(Math.round(instShindo * 100) / 10) / 10;
  if (instShindo1 < 0.5) return "0";
  else return getShindoFromInstShindo(instShindo1, useSymbol);
};
