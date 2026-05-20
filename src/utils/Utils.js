import { useTimeStore } from "@/stores/time";
import { useSettingsStore } from "@/stores/settings";
import { chimeUrls } from "./Urls";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { presimplify, simplify } from "topojson-simplify";
export {
  calcCsis,
  calcCsisLevel,
  calcJmaShindo,
  calcJmaShindoLevel,
  calcReachTime,
  calcWaveDistance,
  WAVE_MODELS,
} from "./SeismicCalculations";
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
export const sendMyNotification = (title, body, icon = "") => {
  if (!settingsStore) settingsStore = useSettingsStore();
  const silent = settingsStore.mainSettings.muteNotification;
  if ("Notification" in window) {
    if (Notification.permission == "granted") {
      if (!settingsStore.mainSettings.gameMode) {
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
  "0",
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
  audio.volume = settingsStore.mainSettings.masterVolume / 100;
  audio.play().catch(async _ => {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    audio.volume = settingsStore.mainSettings.masterVolume / 100;
    audio.play().catch(_ => console.log("不支持的音频"));
  });
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
    timeStore.getTimeStamp() + timeZone * 3600 * 1000 + offset,
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
export const getCsisLevelFromCsis = csis =>
  Math.min(Math.max(csis, 0), 12).toFixed(0);
export const judgeSameEvent = (eqMessage1, eqMessage2) => {
  if (eqMessage1.source == eqMessage2.source && eqMessage1.id == eqMessage2.id)
    return true;
  else return false;
};
export const focusWindow = async () => {
  if (!settingsStore) settingsStore = useSettingsStore();
  if (isTauri() && !settingsStore.mainSettings.gameMode) {
    await getCurrentWindow().show();
    await getCurrentWindow().unminimize();
    await getCurrentWindow().setFocus();
  }
};
export const formatChineseTaiwan = str =>
  (str.startsWith("台湾") && !(str.includes("市") || str.includes("县"))
    ? "中国"
    : "") + str;
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
export const formatCsis = value => {
  if (!settingsStore) settingsStore = useSettingsStore();
  if (!value) return;
  if (settingsStore.mainSettings.useRomanCsis) {
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
  intensity
    ? useSymbol
      ? intensity.replace("強", "+").replace("弱", "-").replace("不明", "?").replace("級", "")
      : intensity.replace("+", "強").replace("-", "弱").replace("?", "不明")
    : undefined;
export const getMmiFromKmaLevel = level =>
  level == -1 ? "?" : Math.min(Math.max(level - 2, 0), 11).toString();
export const exactRound = (input, digit) =>
  Number(Math.round(input + "e" + digit) + "e-" + digit);
