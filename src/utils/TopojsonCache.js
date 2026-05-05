const TOPOJSON_CACHE_NAME = "topojson";
const JSON_HEADERS = {
  headers: {
    "content-type": "application/json",
  },
};

const canUseCache = () => typeof window !== "undefined" && "caches" in window;

const cacheResponse = data =>
  new Response(JSON.stringify(data), JSON_HEADERS);

export const warmTopojsonCache = async (topojsonUrls, fetchJson) => {
  if (!canUseCache()) return;

  const cache = await caches.open(TOPOJSON_CACHE_NAME);
  await Promise.all(
    Object.values(topojsonUrls).map(async url => {
      const data = await fetchJson(url);
      if (!data) throw new Error(`empty topojson response: ${url}`);
      await cache.put(url, cacheResponse(data));
    }),
  );
};

export const loadTopojsonResources = async (topojsonUrls, preferCache) => {
  const cache = preferCache && canUseCache()
    ? await caches.open(TOPOJSON_CACHE_NAME)
    : null;

  return Promise.all(
    Object.values(topojsonUrls).map(async url => {
      if (cache) {
        const cached = await cache.match(url);
        if (cached) {
          try {
            return await cached.json();
          } catch (err) {
            console.warn(`invalid cached topojson: ${url}`, err);
          }
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`failed to load topojson ${url}: ${response.status}`);
      }
      const data = await response.json();
      if (cache) await cache.put(url, cacheResponse(data));
      return data;
    }),
  );
};
