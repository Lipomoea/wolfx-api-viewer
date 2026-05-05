import { jmaSeisIntLoc } from "./JmaSeisIntLoc";
import { calcJmaShindo, getShindoFromInstShindo } from "./SeismicCalculations";

export const calcMaxJmaShindoLevel = (
  mj,
  dep,
  hypoLat,
  hypoLng,
  useSymbol = true,
) => {
  const locList = Object.keys(jmaSeisIntLoc);
  const maxInt = locList.reduce(
    (maxInt, currLoc) =>
      Math.max(
        calcJmaShindo(mj, dep, hypoLat, hypoLng, jmaSeisIntLoc[currLoc]),
        maxInt,
      ),
    -Infinity,
  );
  const maxInt1 = Math.floor(Math.round(maxInt * 100) / 10) / 10;
  if (maxInt1 < 0.5) return "0";
  else return getShindoFromInstShindo(maxInt1, useSymbol);
};
