import { useTimeStore } from "@/stores/time";
import { useSettingsStore } from "@/stores/settings";
import { chimeUrls } from "./Urls";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import { booleanPointInPolygon, point, distance } from "@turf/turf";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { presimplify, simplify } from "topojson-simplify";
import { cnSeisIntLoc, cnSeisIntLocBush } from "./CnSeisIntLoc";
import { around } from "geokdbush";
import { jmaSeisIntLoc } from "./JmaSeisIntLoc";
import { krSeisIntLoc, krSeisIntLocBush } from "./KrSeisIntLoc";
dayjs.extend(utc);
dayjs.extend(timezone);

let timeStore;
let settingsStore;

export const formatNumber = (value, digit) => {
  if (value) {
    if (digit) return value.toFixed(digit);
    else return value;
  } else {
    return "N/A";
  }
};
export const formatText = text => {
  if (text) {
    return text;
  } else {
    return "N/A";
  }
};
export const msToTime = duration => {
  if (!duration) return;
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  let days = Math.floor(duration / (1000 * 60 * 60 * 24));

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return days + "d " + hours + ":" + minutes + ":" + seconds;
};
export const timeToStamp = (time, timeZone) => {
  if (!time) return 0;
  return dayjs.utc(time).subtract(timeZone, "hours").valueOf();
};
export const stampToTime = (timeStamp, timeZone) => {
  return new Date(timeStamp + timeZone * 3600 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, -5);
};
export const calcPassedTime = (time, timeZone) => {
  if (!time || !timeZone) return;
  if (!timeStore) timeStore = useTimeStore();
  let stamp1 = timeStore.getTimeStamp();
  let stamp2 = timeToStamp(time, timeZone);
  return stamp1 - stamp2;
};
export const verifyUpToDate = (time, timeZone, interval) => {
  if (!time || !timeZone || !interval) return;
  return calcPassedTime(time, timeZone) <= interval;
};
export const calcTimeDiff = (time1, timeZone1, time2, timeZone2) => {
  if (!time1 || !timeZone1 || !time2 || !timeZone2) return;
  let stamp1 = timeToStamp(time1, timeZone1);
  let stamp2 = timeToStamp(time2, timeZone2);
  return stamp1 - stamp2;
};
export const sendMyNotification = (title, body, icon, silent) => {
  if ("Notification" in window) {
    if (Notification.permission == "granted") {
      const notification = new Notification(title, {
        body,
        icon,
        silent,
      });
      notification.onclick = () => {
        window.focus();
      };
    }
  }
};
export const setClassName = (intensity, useShindo, isCanceled = false) => {
  let className = "dark-gray";
  if (!isCanceled) {
    if (useShindo) {
      if (intensity >= "1" && intensity <= "7") {
        if (intensity == "1") className = "gray";
        if (intensity == "2") className = "blue";
        if (intensity == "3") className = "green";
        if (intensity == "4") className = "yellow";
        if (intensity == "5-" || intensity == "5弱") className = "orange";
        if (intensity == "5+" || intensity == "5強") className = "dark-orange";
        if (intensity == "6-" || intensity == "6弱") className = "red";
        if (intensity == "6+" || intensity == "6強") className = "dark-red";
        if (intensity == "7") className = "purple";
      }
    } else {
      const numIntensity = Math.round(Number(intensity));
      if (numIntensity >= 1 && numIntensity <= 12) {
        if (numIntensity == 1) className = "dark-gray";
        if (numIntensity == 2) className = "gray";
        if (numIntensity == 3) className = "sky-blue";
        if (numIntensity == 4) className = "blue";
        if (numIntensity == 5) className = "green";
        if (numIntensity == 6) className = "yellow";
        if (numIntensity == 7) className = "orange";
        if (numIntensity == 8) className = "dark-orange";
        if (numIntensity == 9) className = "red";
        if (numIntensity >= 10) className = "purple";
      }
    }
  }
  return className;
};
export const classNameArray = [
  "dark-gray",
  "gray",
  "sky-blue",
  "blue",
  "green",
  "yellow",
  "orange",
  "dark-orange",
  "red",
  "dark-red",
  "purple",
];
export const csisArray = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "",
  "≥10",
];
export const csisRomanArray = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "",
  "≥X",
];
export const shindoArray = [
  "",
  "1",
  "",
  "2",
  "3",
  "4",
  "5-",
  "5+",
  "6-",
  "6+",
  "7",
];
export const shindoScale = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5-",
  "5+",
  "6-",
  "6+",
  "7",
];
export const shindoScaleKanji = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5弱",
  "5強",
  "6弱",
  "6強",
  "7",
];
export const intScale = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];
export const getClassLevel = className => {
  return classNameArray.indexOf(className);
};
export const playSound = type => {
  if (!settingsStore) settingsStore = useSettingsStore();
  const soundEffect = settingsStore.mainSettings.soundEffect;
  const url =
    chimeUrls.custom[type] ||
    chimeUrls.general[type] ||
    chimeUrls[soundEffect][type];
  const audio = new Audio(url);
  audio.play().catch(async _ => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.play().catch(_ => console.log("不支持的音频"));
  });
};
export const calcWaveDistance = (travelTime, isPWave, depth, time) => {
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
  if (time <= times[0]) return { reach: times[0] - time, radius: 0 };
  let j = 1;
  while (times[j] < time && j < times.length - 1) j++;
  const k = (distances[j] - distances[j - 1]) / (times[j] - times[j - 1]);
  const b = distances[j] - k * times[j];
  const distance = k * time + b;
  return { reach: 0, radius: distance };
};
export const calcReachTime = (travelTime, isPWave, depth, distance) => {
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
export const extractNumbers = str => {
  let numberString = "";
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") numberString += str[i];
  }
  return numberString;
};
export const getTimeNumberString = (timeZone, offset) => {
  if (!timeStore) timeStore = useTimeStore();
  const now = new Date(
    timeStore.getTimeStamp() + timeZone * 3600 * 1000 + offset
  );
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
export const getShindoFromChar = char => {
  if (char >= "d" && char <= "k") return "0";
  if (char >= "l" && char <= "m") return "1";
  if (char >= "n" && char <= "o") return "2";
  if (char >= "p" && char <= "q") return "3";
  if (char >= "r" && char <= "s") return "4";
  if (char == "t") return "5-";
  if (char == "u") return "5+";
  if (char == "v") return "6-";
  if (char == "w") return "6+";
  if (char == "x") return "7";
  return "?";
};
export const getShindoFromLevel = level => {
  if (level >= 0 && level <= 7) return "0";
  if (level >= 8 && level <= 9) return "1";
  if (level >= 10 && level <= 11) return "2";
  if (level >= 12 && level <= 13) return "3";
  if (level >= 14 && level <= 15) return "4";
  if (level == 16) return "5-";
  if (level == 17) return "5+";
  if (level == 18) return "6-";
  if (level == 19) return "6+";
  if (level == 20) return "7";
  return "?";
};
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
export const getLevelFromInstShindo = instShindo => {
  if (instShindo < -3.0) return -1;
  else if (instShindo == -3.0) return 0;
  else if (instShindo >= 6.5) return 20;
  else return Math.floor(instShindo * 2 + 7);
};
export const judgeSameEvent = (eqMessage1, eqMessage2) => {
  if (eqMessage1.source == eqMessage2.source && eqMessage1.id == eqMessage2.id)
    return true;
  else return false;
};
export const focusWindow = async () => {
  if (isTauri()) {
    await getCurrentWindow().show();
    await getCurrentWindow().unminimize();
    await getCurrentWindow().setFocus();
  }
};
export const pointDistToCnArea = (pointLngLat, feature) => {
  const turfPoint = point(pointLngLat);
  if (booleanPointInPolygon(turfPoint, feature)) {
    return 0;
  } else {
    const name = feature.properties.name;
    const kdbush = cnSeisIntLocBush[name];
    const nearestPoint = around(kdbush, pointLngLat[0], pointLngLat[1], 1).map(
      index => cnSeisIntLoc[name][index]
    )[0];
    const minDist = distance(turfPoint, point(nearestPoint), {
      units: "kilometers",
    });
    return minDist;
  }
};
export const pointDistToKrArea = (pointLngLat, feature) => {
  const turfPoint = point(pointLngLat);
  if (booleanPointInPolygon(turfPoint, feature)) {
    return 0;
  } else {
    const name = feature.properties.name;
    const kdbush = krSeisIntLocBush[name];
    const nearestPoint = around(kdbush, pointLngLat[0], pointLngLat[1], 1).map(
      index => krSeisIntLoc[name][index]
    )[0];
    const minDist = distance(turfPoint, point(nearestPoint), {
      units: "kilometers",
    });
    return minDist;
  }
};
const r = 6371;
const calcLineDis = (dep, dis) => {
  const theta = dis / r;
  const a = r - dep;
  const lineDis = Math.sqrt(a * a + r * r - 2 * a * r * Math.cos(theta));
  return lineDis;
};
const calcCeaCsis = (m, dis = 0) =>
  1.297 * m - 4.368 * Math.log10(dis + 15) + 5.363;
const calcIclCsis = (m, dis = 0) =>
  1.363 * m - 1.494 * Math.log(dis + 7) + 2.941;
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
    0
  );
  const ceaCsis1 = calcCeaCsis(m, dis);
  const ceaCsis2 = calcCeaCsis(m, hypoDis);
  return (ceaCsis1 + ceaCsis2) / 2;
};
export const calcCsisLevel = (m, dep = 10, dis = 0) =>
  Math.min(Math.max(calcCsis(m, dep, dis), 0), 12).toFixed(0);
export const formatChineseTaiwan = str =>
  (str.startsWith("台湾") && !(str.includes("市") || str.includes("县"))
    ? "中国"
    : "") + str;
export const calcJmaShindo = (mj, dep, hypoLat, hypoLng, loc) => {
  const mw = mj - 0.171;
  const long = 10 ** (0.5 * mw - 1.85) / 2;
  const locPoint = point([loc.location[1], loc.location[0]]);
  const hypoPoint = point([hypoLng, hypoLat]);
  const surfaceDist = distance(hypoPoint, locPoint, { units: "kilometers" });
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
  const pgv400 = pgv600 * 1.31;
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
  useSymbol = true
) => {
  const instShindo = calcJmaShindo(mj, dep, hypoLat, hypoLng, loc);
  const instShindo1 = Math.floor(Math.round(instShindo * 100) / 10) / 10;
  if (instShindo1 < 0.5) return "0";
  else return getShindoFromInstShindo(instShindo1, useSymbol);
};
export const openUrl = url => {
  isTauri() ? open(url) : window.open(url, "_blank");
};
export const formatTimeZone = timeZone => (timeZone >= 0 ? "+" : "") + timeZone;
export const simplifyTopoJson = (topojson, factor) => {
  if (!factor) return topojson;
  else {
    const minWeights = {
      1: 2e-5,
      2: 1e-4,
      3: 5e-4,
      4: 2e-3,
    };
    const presimplified = presimplify(topojson);
    const simplified = simplify(presimplified, minWeights[factor]);
    return simplified;
  }
};
export const formatCsis = (value, useRoman) => {
  if (!value) return;
  if (useRoman) {
    switch (value) {
      case "0":
        return "N";
      case "1":
        return "I";
      case "2":
        return "II";
      case "3":
        return "III";
      case "4":
        return "IV";
      case "5":
        return "V";
      case "6":
        return "VI";
      case "7":
        return "VII";
      case "8":
        return "VIII";
      case "9":
        return "IX";
      case "10":
        return "X";
      case "11":
        return "XI";
      case "12":
        return "XII";
      default:
        return "?";
    }
  } else {
    if (isNaN(value)) return "?";
    else return value;
  }
};
export const formatShindo = (intensity, useSymbol = true) =>
  useSymbol
    ? intensity.replace("強", "+").replace("弱", "-").replace("不明", "?")
    : intensity.replace("+", "強").replace("-", "弱").replace("?", "不明");
export const calcMaxJmaShindoLevel = (
  mj,
  dep,
  hypoLat,
  hypoLng,
  useSymbol = true
) => {
  const locList = Object.keys(jmaSeisIntLoc);
  const maxInt = locList.reduce(
    (maxInt, currLoc) =>
      Math.max(
        calcJmaShindo(mj, dep, hypoLat, hypoLng, jmaSeisIntLoc[currLoc]),
        maxInt
      ),
    -Infinity
  );
  const maxInt1 = Math.floor(Math.round(maxInt * 100) / 10) / 10;
  if (maxInt1 < 0.5) return "0";
  else return getShindoFromInstShindo(maxInt1, useSymbol);
};
export const getMmiFromKmaLevel = level =>
  level == -1 ? "?" : Math.min(Math.max(level - 2, 0), 11).toString();
