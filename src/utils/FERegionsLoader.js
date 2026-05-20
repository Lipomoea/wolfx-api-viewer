let feRegionsPromise = null;
let getFENameCache = null;

export const loadGetFEName = async () => {
  if (getFENameCache) return getFENameCache;
  feRegionsPromise ||= import("./FERegions").then(module => {
    getFENameCache = module.getFEName;
    return getFENameCache;
  });
  return feRegionsPromise;
};

export const getFENameAsync = async (lat, lng) => {
  const getFEName = await loadGetFEName();
  return getFEName(lat, lng);
};
