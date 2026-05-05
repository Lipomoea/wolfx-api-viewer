import { booleanPointInPolygon, point, distance } from "@turf/turf";
import { around } from "geokdbush";
import { cnSeisIntLoc, cnSeisIntLocBush } from "./CnSeisIntLoc";
import { krSeisIntLoc, krSeisIntLocBush } from "./KrSeisIntLoc";

const pointDistToArea = (pointLngLat, feature, locs, bushes) => {
  const turfPoint = point(pointLngLat);
  if (booleanPointInPolygon(turfPoint, feature)) {
    return 0;
  }

  const name = feature.properties.name;
  const kdbush = bushes[name];
  const nearestPoint = around(kdbush, pointLngLat[0], pointLngLat[1], 1).map(
    index => locs[name][index],
  )[0];

  return distance(turfPoint, point(nearestPoint), {
    units: "kilometers",
  });
};

export const pointDistToCnArea = (pointLngLat, feature) =>
  pointDistToArea(pointLngLat, feature, cnSeisIntLoc, cnSeisIntLocBush);

export const pointDistToKrArea = (pointLngLat, feature) =>
  pointDistToArea(pointLngLat, feature, krSeisIntLoc, krSeisIntLocBush);
