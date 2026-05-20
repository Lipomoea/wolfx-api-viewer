import { formatShindo, getClassLevel, getCsisLevelFromCsis, setClassName } from './Utils';

const cwaAreaAliases = [
    ['臺北市', '台北市'], ['台北市', '台北市'],
    ['新北市', '新北市'],
    ['桃園市', '桃园市'], ['桃园市', '桃园市'],
    ['臺中市', '台中市'], ['台中市', '台中市'],
    ['臺南市', '台南市'], ['台南市', '台南市'],
    ['高雄市', '高雄市'],
    ['基隆市', '基隆市'],
    ['新竹市', '新竹市'], ['新竹縣', '新竹县'], ['新竹县', '新竹县'],
    ['嘉義市', '嘉义市'], ['嘉义市', '嘉义市'], ['嘉義縣', '嘉义县'], ['嘉义县', '嘉义县'],
    ['苗栗縣', '苗栗县'], ['苗栗县', '苗栗县'],
    ['彰化縣', '彰化县'], ['彰化县', '彰化县'],
    ['南投縣', '南投县'], ['南投县', '南投县'],
    ['雲林縣', '云林县'], ['云林县', '云林县'],
    ['屏東縣', '屏东县'], ['屏东县', '屏东县'],
    ['宜蘭縣', '宜兰县'], ['宜兰县', '宜兰县'],
    ['花蓮縣', '花莲县'], ['花莲县', '花莲县'],
    ['臺東縣', '台东县'], ['台東縣', '台东县'], ['台东县', '台东县'],
    ['澎湖縣', '澎湖县'], ['澎湖县', '澎湖县'],
    ['金門縣', '金门县'], ['金门县', '金门县'],
    ['連江縣', '连江县'], ['连江县', '连江县'],
];

const normalizeAreaName = name => {
    if(!name) return '';
    return String(name)
        .replace(/臺/g, '台')
        .replace(/縣/g, '县')
        .replace(/區/g, '区')
        .replace(/鄉/g, '乡')
        .replace(/鎮/g, '镇')
        .trim();
};

export const resolveCwaAreaName = text => {
    const value = String(text || '');
    const alias = cwaAreaAliases.find(([raw]) => value.includes(raw));
    return alias?.[1] || '';
};

export const buildCwaAreaIntensities = (placeText, maxIntensity) => {
    const name = resolveCwaAreaName(placeText);
    const intensity = formatShindo(maxIntensity);
    if(!name || intensity == '?') return [];
    return [{
        name,
        areaNames: [name],
        intensity,
        className: setClassName(intensity, true),
        useShindo: true,
    }];
};

const compactAreaNames = names => Array.from(new Set(names.map(normalizeAreaName).filter(Boolean)));

const getCencStationAreaNames = detail => {
    // CENC 给的是市/区县，底图有时只到市、有时只到县，这里先把候选都保留下来。
    return compactAreaNames([detail?.County, detail?.City, detail?.Province]);
};

export const buildCencStationAreaIntensities = stationData => {
    const areas = {};
    (stationData || []).forEach(detail => {
        const areaNames = getCencStationAreaNames(detail);
        const name = areaNames[0];
        if(!name) return;
        const intensity = getCsisLevelFromCsis(detail.INT);
        const className = setClassName(intensity, false);
        mergeAreaIntensity(areas, {
            name,
            areaNames,
            intensity,
            className,
            useShindo: false,
        });
    });
    return Object.values(areas);
};

export const mergeAreaIntensity = (target, item) => {
    if(!item?.name || !item.className) return target;
    const prev = target[item.name];
    if(!prev || getClassLevel(item.className) > getClassLevel(prev.className)) {
        target[item.name] = { ...item };
    }
    return target;
};

export const matchAreaClassToNames = (areaClass, availableNames) => {
    const names = availableNames instanceof Set ? availableNames : new Set(availableNames || []);
    if(!names.size) return areaClass || {};
    const matched = {};
    Object.values(areaClass || {}).forEach(item => {
        const candidates = compactAreaNames([item.name, ...(item.areaNames || [])]);
        const name = candidates.find(candidate => names.has(candidate));
        if(!name) return;
        mergeAreaIntensity(matched, { ...item, name });
    });
    return matched;
};

export const areaClassToRows = (areaClass, useShindo, maxRows) => {
    const buckets = {};
    Object.values(areaClass || {}).forEach(item => {
        if(item.useShindo !== useShindo) return;
        const intensity = useShindo ? formatShindo(item.intensity) : String(item.intensity);
        if(!buckets[intensity]) buckets[intensity] = [];
        buckets[intensity].push(item.name);
    });

    const order = useShindo
        ? ['7', '6+', '6-', '5+', '5-', '4', '3', '2', '1']
        : ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    const rows = [];
    for(const intensity of order) {
        if(rows.length >= maxRows) break;
        buckets[intensity]?.forEach(name => rows.push({ name, intensity }));
    }
    return rows.slice(0, maxRows);
};
