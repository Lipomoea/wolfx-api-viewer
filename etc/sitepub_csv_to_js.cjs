//数据来源：https://www.kyoshin.bosai.go.jp/ja/stationlist/

//数据字段：
//観測網,観測点コード,観測点名,観測点名（ローマ字）,緯度[度],経度[度],標高[m],深度[m],都道府県名,強震計種別,備考
//Network,Station Code,Station Name,Romaji,Latitude[deg],Longitude[deg],Elevation[m],Depth[m],Prefecture,Seismograph,Notes

const fs = require("fs");

const [, , inputFile] = process.argv;
const outputFile = "./src/utils/NiedSitePub.js";

if (!inputFile) {
  console.error("Usage: node station_csv_to_json.js <input.csv>");
  process.exit(1);
}

const csvData = fs.readFileSync(inputFile, "utf-8");
const lines = csvData.split("\n").filter(line => line.trim() !== "");

const stations = lines.map(line => {
  const [
    network,
    stationCode,
    stationName,
    romaji,
    lat,
    lon,
    elevation,
    depth,
    prefecture,
    seismograph,
    notes,
  ] = line.split(",");
  return {
    network: network.trim(),
    stationCode: stationCode.trim(),
    stationName: stationName.trim(),
    // romaji: romaji.trim(),
    latitude: parseFloat(lat.trim()),
    longitude: parseFloat(lon.trim()),
    // elevation: parseFloat(elevation.trim()),
    // depth: parseFloat(depth.trim()),
    prefecture: prefecture.trim(),
    // seismograph: seismograph.trim(),
    // notes: notes.trim()
  };
});

// 按照 network 第一优先级，stationCode 第二优先级的升序排序
stations.sort((a, b) => {
  if (a.network < b.network) return -1;
  if (a.network > b.network) return 1;
  // 如果 network 相同，比较 stationCode
  if (a.stationCode < b.stationCode) return -1;
  if (a.stationCode > b.stationCode) return 1;
  return 0;
});

// const jsonOutput = {};

// stations.forEach(station => {
//     const latKey = station.latitude.toFixed(1);
//     const lonKey = station.longitude.toFixed(1);

//     const key = `${latKey},${lonKey}`;

//     if (!jsonOutput[key]) {
//         jsonOutput[key] = [];
//     }

//     jsonOutput[key].push([station.latitude, station.longitude]);
// });

const finalString = JSON.stringify(stations);
fs.writeFileSync(
  outputFile,
  `export const niedSitePub = ${finalString};`,
  "utf-8",
);

console.log(
  `Converted ${stations.length} stations from ${inputFile} to ${outputFile}`,
);
