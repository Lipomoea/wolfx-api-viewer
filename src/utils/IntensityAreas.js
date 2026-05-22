import { formatShindo, getClassLevel } from './Utils';

// 区域列表只整理“已经拿到的”分区数据；历史估算不在这里补。
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

const compactAreaNames = names => Array.from(new Set(names.map(normalizeAreaName).filter(Boolean)));

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
