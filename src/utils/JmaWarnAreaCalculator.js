import { loadJmaSeisIntLoc } from "./JmaSeisIntLocLoader";
import { calcJmaShindoLevel } from "./SeismicCalculations";

const classNameArray = [
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

const setJmaClassName = intensity => {
  if (intensity == "1") return "gray";
  if (intensity == "2") return "blue";
  if (intensity == "3") return "green";
  if (intensity == "4") return "yellow";
  if (intensity == "5-" || intensity == "5弱") return "orange";
  if (intensity == "5+" || intensity == "5強") return "dark-orange";
  if (intensity == "6-" || intensity == "6弱") return "red";
  if (intensity == "6+" || intensity == "6強") return "dark-red";
  if (intensity == "7") return "purple";
  return "dark-gray";
};

const getClassLevel = className => classNameArray.indexOf(className);

export const calcJmaWarnAreaLocal = async events => {
  const jmaSeisIntLoc = await loadJmaSeisIntLoc();
  const warnArea = {};
  for (let id in jmaSeisIntLoc) {
    for (let eew of events) {
      const { magnitude, depth, lat, lng } = eew;
      if (depth > 150) continue;
      const intensity = calcJmaShindoLevel(magnitude, depth, lat, lng, jmaSeisIntLoc[id], false);
      if (intensity < "1") continue;
      const name = jmaSeisIntLoc[id].sect;
      const className = setJmaClassName(intensity);
      if (!warnArea[name] || getClassLevel(className) > getClassLevel(warnArea[name].className)) {
        warnArea[name] = {
          name,
          intensity,
          className,
        };
      }
    }
  }
  return warnArea;
};
