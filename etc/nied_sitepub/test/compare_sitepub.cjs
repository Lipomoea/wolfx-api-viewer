// node etc/nied_sitepub/test/compare_sitepub.cjs path/to/old.csv path/to/new.csv path/to/sitelist.json path/to/report.json

const fs = require("fs");
const path = require("path");

const MAX_TRY = 10;
const ROUND_DIGITS = 1;

const exactRound = (input, digit) =>
  Number(Math.round(input + "e" + digit) + "e-" + digit);

const parseSitePubCsv = (csvData, sourceName) => {
  const lines = csvData
    .split("\n")
    .filter(line => line.trim() !== "");

  const stations = lines.map((line, index) => {
    const fields = line.split(",");
    if (fields.length < 9) {
      throw new Error(
        `${sourceName}:${index + 1} has ${fields.length} fields; expected at least 9`,
      );
    }

    const [
      network,
      stationCode,
      stationName,
      ,
      lat,
      lon,
      ,
      ,
      prefecture,
    ] = fields;
    const latitude = parseFloat(lat.trim());
    const longitude = parseFloat(lon.trim());

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error(
        `${sourceName}:${index + 1} has invalid coordinates: ${lat}, ${lon}`,
      );
    }

    return {
      network: network.trim(),
      stationCode: stationCode.trim(),
      stationName: stationName.trim(),
      latitude,
      longitude,
      prefecture: prefecture.trim(),
    };
  });

  stations.sort((a, b) => {
    if (a.network < b.network) return -1;
    if (a.network > b.network) return 1;
    if (a.stationCode < b.stationCode) return -1;
    if (a.stationCode > b.stationCode) return 1;
    return 0;
  });

  return stations;
};

const parseSitelist = (jsonData, sourceName) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonData);
  } catch (error) {
    throw new Error(`${sourceName} is not valid JSON: ${error.message}`);
  }

  const items = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(items)) {
    throw new Error(`${sourceName} must contain an items array`);
  }

  const coordinates = items.map((item, index) => {
    if (!Array.isArray(item) || item.length < 2) {
      throw new Error(`${sourceName}:items[${index}] is not a [lat, lng] array`);
    }

    const latitude = Number(item[0]);
    const longitude = Number(item[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error(
        `${sourceName}:items[${index}] has invalid coordinates: ${item[0]}, ${item[1]}`,
      );
    }

    return [latitude, longitude];
  });

  return {
    siteConfigId: Array.isArray(parsed) ? null : (parsed.siteConfigId ?? null),
    coordinates,
  };
};

// Keep this stateful scan aligned with fetchStationList in NiedNet.vue.
const matchStations = (inputCoordinates, sitePub) => {
  let k = -1;

  return inputCoordinates.map((input, index) => {
    const previousK = k;
    const targetLat = exactRound(input[0], ROUND_DIGITS);
    const targetLng = exactRound(input[1], ROUND_DIGITS);
    let possibleSite = null;
    let matchedSiteIndex = null;

    for (let j = 0; j < MAX_TRY; j++) {
      k++;
      if (k >= sitePub.length) break;

      possibleSite = sitePub[k];
      if (
        exactRound(possibleSite.latitude, ROUND_DIGITS) === targetLat &&
        exactRound(possibleSite.longitude, ROUND_DIGITS) === targetLng
      ) {
        matchedSiteIndex = k;
        break;
      }
    }

    if (matchedSiteIndex !== null) {
      return {
        index,
        inputCoordinates: input,
        finalCoordinates: [
          possibleSite.latitude,
          possibleSite.longitude,
        ],
        matched: true,
        siteIndex: matchedSiteIndex,
        site: possibleSite,
      };
    }

    k = previousK;
    return {
      index,
      inputCoordinates: input,
      finalCoordinates: input,
      matched: false,
      siteIndex: null,
      site: null,
    };
  });
};

const sameCoordinates = (a, b) => a[0] === b[0] && a[1] === b[1];

const getSiteKey = result =>
  result.matched
    ? `${result.site.network}\u0000${result.site.stationCode}`
    : null;

const formatResult = result => ({
  matched: result.matched,
  siteIndex: result.siteIndex,
  finalCoordinates: result.finalCoordinates,
  site: result.site
    ? {
        network: result.site.network,
        stationCode: result.site.stationCode,
        stationName: result.site.stationName,
        latitude: result.site.latitude,
        longitude: result.site.longitude,
        prefecture: result.site.prefecture,
      }
    : null,
});

const compareSitePub = ({
  oldSitePub,
  newSitePub,
  inputCoordinates,
  siteConfigId = null,
}) => {
  const oldResults = matchStations(inputCoordinates, oldSitePub);
  const newResults = matchStations(inputCoordinates, newSitePub);
  const changes = [];
  let coordinateChangedCount = 0;
  let matchStatusChangedCount = 0;
  let matchedStationChangedCount = 0;

  for (let index = 0; index < inputCoordinates.length; index++) {
    const oldResult = oldResults[index];
    const newResult = newResults[index];
    const coordinateChanged = !sameCoordinates(
      oldResult.finalCoordinates,
      newResult.finalCoordinates,
    );
    const matchStatusChanged = oldResult.matched !== newResult.matched;
    const matchedStationChanged =
      getSiteKey(oldResult) !== getSiteKey(newResult);

    if (coordinateChanged) coordinateChangedCount++;
    if (matchStatusChanged) matchStatusChangedCount++;
    if (matchedStationChanged) matchedStationChangedCount++;

    if (coordinateChanged || matchStatusChanged || matchedStationChanged) {
      changes.push({
        index,
        inputCoordinates: inputCoordinates[index],
        coordinateChanged,
        matchStatusChanged,
        matchedStationChanged,
        old: formatResult(oldResult),
        new: formatResult(newResult),
      });
    }
  }

  const oldMatchedCount = oldResults.filter(result => result.matched).length;
  const newMatchedCount = newResults.filter(result => result.matched).length;

  return {
    algorithm: {
      maxTry: MAX_TRY,
      roundingDigits: ROUND_DIGITS,
    },
    siteConfigId,
    summary: {
      sitelistStationCount: inputCoordinates.length,
      oldCsvStationCount: oldSitePub.length,
      newCsvStationCount: newSitePub.length,
      oldMatchedCount,
      newMatchedCount,
      oldUnmatchedCount: inputCoordinates.length - oldMatchedCount,
      newUnmatchedCount: inputCoordinates.length - newMatchedCount,
      coordinateChangedCount,
      matchStatusChangedCount,
      matchedStationChangedCount,
      reportedChangeCount: changes.length,
    },
    changes,
  };
};

const printUsage = () => {
  console.error(
    "Usage: node etc/compare_sitepub.cjs <old.csv> <new.csv> <sitelist.json> [report.json]",
  );
};

const main = args => {
  const [oldCsvFile, newCsvFile, sitelistFile, outputFile] = args;
  if (!oldCsvFile || !newCsvFile || !sitelistFile || args.length > 4) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (outputFile) {
    const outputPath = path.resolve(outputFile);
    const inputPaths = [oldCsvFile, newCsvFile, sitelistFile].map(file =>
      path.resolve(file),
    );
    if (inputPaths.includes(outputPath)) {
      throw new Error("The report path must not overwrite an input file");
    }
  }

  const oldSitePub = parseSitePubCsv(
    fs.readFileSync(oldCsvFile, "utf-8"),
    oldCsvFile,
  );
  const newSitePub = parseSitePubCsv(
    fs.readFileSync(newCsvFile, "utf-8"),
    newCsvFile,
  );
  const sitelist = parseSitelist(
    fs.readFileSync(sitelistFile, "utf-8"),
    sitelistFile,
  );
  const report = compareSitePub({
    oldSitePub,
    newSitePub,
    inputCoordinates: sitelist.coordinates,
    siteConfigId: sitelist.siteConfigId,
  });
  const reportJson = `${JSON.stringify(report, null, 2)}\n`;

  if (outputFile) {
    fs.writeFileSync(outputFile, reportJson, "utf-8");
  } else {
    process.stdout.write(reportJson);
  }

  const destination = outputFile ? `; report: ${outputFile}` : "";
  console.error(
    `Compared ${report.summary.sitelistStationCount} sitelist stations: ` +
      `${report.summary.coordinateChangedCount} coordinate changes, ` +
      `${report.summary.matchStatusChangedCount} match status changes, ` +
      `${report.summary.matchedStationChangedCount} matched station changes` +
      destination,
  );
};

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  compareSitePub,
  exactRound,
  matchStations,
  parseSitelist,
  parseSitePubCsv,
};
