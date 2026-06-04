<template>
    <div>

    </div>
</template>

<script setup>
import L from 'leaflet';
import Http from '@/classes/Http';
import { useStatusStore } from '@/stores/status';
import { typhoonUrls } from '@/utils/Urls';
import { getCoordByDistanceBearing, stampToTime } from '@/utils/Utils';
import { onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useTimeStore } from '@/stores/time';

const statusStore = useStatusStore();
const timeStore = useTimeStore();

const typhoonData = reactive([]);
const updateTime = ref('1970-01-01 08:00:00');

const getColorFromPower = power => {
    let color = 'var(--dark-gray)';
    if (power < 6) {
        color = 'var(--gray)';
    } else if (power < 8) {
        color = 'var(--blue)';
    } else if (power < 10) {
        color = 'var(--green)';
    } else if (power < 12) {
        color = 'var(--yellow)';
    } else if (power < 14) {
        color = 'var(--orange)';
    } else if (power < 16) {
        color = 'var(--red)';
    } else {
        color = 'var(--purple)';
    }
    return color;
};

const createTyphoonSvgMarker = (currentInfo) => {
    const { id, name, nameEn, landInfos, time, lat, lng, category, power, windSpeed, pressure, moveSpeed } = currentInfo;
    const color = getColorFromPower(power);
    const svgClassName = power < 8 ? 'typhoon-animated-slow' : power < 12 ? 'typhoon-animated-mid' : power < 16 ? 'typhoon-animated-fast' : 'typhoon-animated-very-fast';
    const svgHtml = `
        <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="40" height="40" class="${svgClassName}">
        <path d="M880.81 390.38c-153.42-236-333.4-227.19-445.52-188.84C358.57 228.1 290.71 284.16 249.4 355c-118 206.54 79.67 368.81 79.67 368.81l-0.63-2.11A277.4 277.4 0 0 0 365 747.61c-2.12-0.06-4.25-0.14-6.39-0.22-123.92-11.8-215.38-115.07-215.38-115.07 153.42 236 333.4 230.14 445.52 188.83 79.67-26.55 144.58-79.66 185.89-153.43 121-206.53-79.67-368.81-79.67-368.81s0.14 0.34 0.39 1a283 283 0 0 0-32.3-25c1.58 0.23 2.41 0.37 2.41 0.37 123.88 14.78 215.34 115.1 215.34 115.1zM574 591c-47.21 35.41-112.12 26.56-144.57-17.7-35.41-44.26-26.56-109.17 17.7-144.58s109.17-26.55 144.57 17.71S618.22 555.61 574 591z" fill="${color}"></path>
        </svg>
    `;
    const svgIcon = L.divIcon({
        html: svgHtml,
        className: 'typhoon-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    const latlng = [currentInfo.lat, currentInfo.lng];
    const marker = L.marker(latlng, { icon: svgIcon, pane: 'typhoonIconMarkerPane' });
    let warnLevel;
    switch (currentInfo.warnLevel) {
        case 'white':
            warnLevel = '台风白色预警';
            break;
        case 'blue':
            warnLevel = '台风蓝色预警';
            break;
        case 'yellow':
            warnLevel = '台风黄色预警';
            break;
        case 'orange':
            warnLevel = '台风橙色预警';
            break;
        case 'red':
            warnLevel = '台风红色预警';
            break;
        default:
            warnLevel = '未知预警等级';
            break;
    }
    marker.bindTooltip(`
        <strong>${warnLevel}</strong>
        <br>
        台风名称: ${name} (${nameEn})
        <br>
        台风编号: ${id}
        <br>
        时间: ${time}
        <br>
        经纬度: (${lat.toFixed(2)}, ${lng.toFixed(2)})
        <br>
        中心风速: ${windSpeed} m/s (${power}级, ${category})
        <br>
        中心气压: ${pressure} hpa
        <br>
        移动速度: ${moveSpeed} km/h
        <br>
        ${landInfos.join('<br>') || '暂无台风登陆信息'}
    `, { permanent: false, direction: 'top', className: 'custom-tooltip' });
    return marker;
};

const generateWindCirclePoints = (lat, lng, radii) => {
    if (!radii || typeof radii !== 'object') {
        return null;
    }
    const { ne = 0, se = 0, sw = 0, nw = 0 } = radii;
    if (ne <= 0 && se <= 0 && sw <= 0 && nw <= 0) {
        return null;
    }
    const points = [];
    for (let i = 0; i < 360; i++) {
        if (i === 0) {
            points.push(getCoordByDistanceBearing(lat, lng, nw, i));
            points.push(getCoordByDistanceBearing(lat, lng, ne, i));
        } else if (i === 90) {
            points.push(getCoordByDistanceBearing(lat, lng, ne, i));
            points.push(getCoordByDistanceBearing(lat, lng, se, i));
        } else if (i === 180) {
            points.push(getCoordByDistanceBearing(lat, lng, se, i));
            points.push(getCoordByDistanceBearing(lat, lng, sw, i));
        } else if (i === 270) {
            points.push(getCoordByDistanceBearing(lat, lng, sw, i));
            points.push(getCoordByDistanceBearing(lat, lng, nw, i));
        } else {
            let r = 0;
            if (i > 0 && i < 90) r = ne;
            else if (i > 90 && i < 180) r = se;
            else if (i > 180 && i < 270) r = sw;
            else if (i > 270 && i < 360) r = nw;
            points.push(getCoordByDistanceBearing(lat, lng, r, i));
        }
    }
    return points;
};

const createTyphoonWindCircles = (centerLat, centerLng, radius7, radius10, radius12) => {
    const points7 = generateWindCirclePoints(centerLat, centerLng, radius7);
    const points10 = generateWindCirclePoints(centerLat, centerLng, radius10);
    const points12 = generateWindCirclePoints(centerLat, centerLng, radius12);
    const baseOptions = {
        fillOpacity: 0.25,
        opacity: 0.75,
        weight: 1,
        pane: 'typhoonWindCirclePane',
        interactive: false
    };
    let poly7 = null;
    let poly10 = null;
    let poly12 = null;
    if (points12) {
        poly12 = L.polygon(points12, {
            ...baseOptions,
            color: 'var(--red)',
            fillColor: 'var(--red)'
        });
    }
    if (points10) {
        const coords10 = points12 ? [points10, points12] : points10;
        poly10 = L.polygon(coords10, {
            ...baseOptions,
            color: 'var(--orange)',
            fillColor: 'var(--orange)'
        });
    }
    if (points7) {
        const innerHole = points10 || points12;
        const coords7 = innerHole ? [points7, innerHole] : points7;

        poly7 = L.polygon(coords7, {
            ...baseOptions,
            color: 'var(--green)',
            fillColor: 'var(--green)'
        });
    }
    return [poly7, poly10, poly12];
};

const createTyphoonPathLine = (latlngs, isForecast = false) => {
    const baseOptions = {
        weight: 1.5,
        pane: 'typhoonPathLinePane',
        interactive: false
    };
    return isForecast
        ? L.polyline(latlngs, {
            ...baseOptions,
            color: 'var(--red)',
            opacity: 0.75,
            dashArray: '10, 10'
        })
        : L.polyline(latlngs, {
            ...baseOptions,
            color: 'var(--green)',
            opacity: 1
        });
};

const createTyphoonPointMarker = (info, isForecast = false) => {
    const baseOptions = {
        radius: 5,
        color: 'white',
        opacity: isForecast ? 0.75 : 1,
        weight: 1,
        fillOpacity: isForecast ? 0.75 : 1,
        pane: 'typhoonPointMarkerPane'
    };
    const latlng = [info.lat, info.lng];
    const { time, lat, lng, category, power, windSpeed, pressure, moveSpeed } = info;
    const fillColor = getColorFromPower(power);
    const marker = L.circleMarker(latlng, {
        ...baseOptions,
        fillColor
    });
    let tooltipHtml = `
        时间: ${time}
        <br>
        经纬度: (${lat.toFixed(2)}, ${lng.toFixed(2)})
        <br>
        中心风速: ${windSpeed} m/s (${power}级, ${category})
        <br>
        中心气压: ${pressure} hpa
    `;
    if (moveSpeed) tooltipHtml += `
        <br>
        移动速度: ${moveSpeed} km/h
    `;
    marker.bindTooltip(tooltipHtml, { permanent: false, direction: 'top', className: 'custom-tooltip' });
    return marker;
};

const extractRadiusFromStr = radiusStr => {
    const radiusArr = radiusStr.split('|').map(str => Number(str));
    if (radiusArr.length !== 4) return null;
    return {
        ne: radiusArr[0],
        se: radiusArr[1],
        sw: radiusArr[3],
        nw: radiusArr[2],
    };
};

const fetchTyphoonData = async () => {
    try {
        const typhoonArr = await Http.get(typhoonUrls.typhoon_http + `?time=${Date.now()}`);
        // const typhoonArr = await Http.get(typhoonUrls.typhoon_http + `?tfid=202511`);
        if (typhoonArr) {
            typhoonData.length = 0;
            if (Array.isArray(typhoonArr)) {
                typhoonArr.forEach(info => {
                    const { tfid: id, name, enname: nameEn, warnlevel: warnLevel } = info;
                    const landInfos = info.land?.map(landInfo => landInfo?.info).filter(str => !!str);
                    let pastPoints, currentInfo, forecastPoints;
                    if (info.points) {
                        const points = info.points;
                        pastPoints = points.map(point => ({
                            time: point.time,
                            lat: Number(point.lat),
                            lng: Number(point.lng),
                            category: point.strong,
                            power: Number(point.power),
                            windSpeed: Number(point.speed),
                            pressure: Number(point.pressure),
                            moveSpeed: Number(point.movespeed),
                        }));
                        const latestPoint = points[points.length - 1];
                        currentInfo = {
                            id,
                            name,
                            nameEn,
                            warnLevel,
                            landInfos,
                            time: latestPoint.time,
                            lat: Number(latestPoint.lat),
                            lng: Number(latestPoint.lng),
                            category: latestPoint.strong,
                            power: Number(latestPoint.power),
                            windSpeed: Number(latestPoint.speed),
                            pressure: Number(latestPoint.pressure),
                            moveSpeed: Number(latestPoint.movespeed),
                            radius7: extractRadiusFromStr(latestPoint.radius7),
                            radius10: extractRadiusFromStr(latestPoint.radius10),
                            radius12: extractRadiusFromStr(latestPoint.radius12),
                        };
                        forecastPoints = latestPoint.forecast?.[0].forecastpoints?.slice(1).map(point => ({
                            time: point.time,
                            lat: Number(point.lat),
                            lng: Number(point.lng),
                            category: point.strong,
                            power: Number(point.power),
                            windSpeed: Number(point.speed),
                            pressure: Number(point.pressure),
                        }));
                    }

                    const typhoonInfo = {
                        pastPoints,
                        currentInfo,
                        forecastPoints,
                    };
                    typhoonData.push(typhoonInfo);
                });
            }
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
    }
};

let updateTimer;
const loopFetch = async () => {
    clearTimeout(updateTimer);
    const isSuccess = await fetchTyphoonData();
    const interval = isSuccess ? 10 * 60000 : 10000;
    updateTimer = setTimeout(loopFetch, interval);
};

let layers = [];
let map;

const addAndRecordLayer = layer => {
    if (!map || !layer) return;
    layer.addTo(map);
    layers.push(layer);
};

const removeAllLayers = () => {
    if (!map) return;
    layers.forEach(item => {
        if (map.hasLayer(item)) map.removeLayer(item);
    });
    layers = [];
};

const handleUpdate = () => {
    if (!map) return;
    removeAllLayers();
    typhoonData.forEach(typhoonInfo => {
        const currentInfo = typhoonInfo.currentInfo;
        const { lat, lng, radius7, radius10, radius12 } = currentInfo;

        const pastLatlngs = typhoonInfo.pastPoints.map(point => [point.lat, point.lng]);
        const pastLine = createTyphoonPathLine(pastLatlngs, false);
        addAndRecordLayer(pastLine);

        const forecastLatlngs = typhoonInfo.forecastPoints.map(point => [point.lat, point.lng]);
        forecastLatlngs.unshift([lat, lng]);
        const forecastLine = createTyphoonPathLine(forecastLatlngs, true);
        addAndRecordLayer(forecastLine);

        typhoonInfo.pastPoints.forEach(pointInfo => {
            const circleMarker = createTyphoonPointMarker(pointInfo, false);
            addAndRecordLayer(circleMarker);
        });

        typhoonInfo.forecastPoints.forEach(pointInfo => {
            const circleMarker = createTyphoonPointMarker(pointInfo, true);
            addAndRecordLayer(circleMarker);
        });

        const windCircles = createTyphoonWindCircles(lat, lng, radius7, radius10, radius12);
        windCircles.forEach(circle => addAndRecordLayer(circle));

        const svgMarker = createTyphoonSvgMarker(currentInfo);
        addAndRecordLayer(svgMarker);
    });
    updateTime.value = stampToTime(timeStore.getTimeStamp(), 8);
};

let unwatchData;

watch(() => statusStore.map, newVal => {
    if (newVal) {
        map = newVal;
        loopFetch();
        unwatchData = watch(() => JSON.stringify(typhoonData), handleUpdate, { immediate: true });
    }
}, { immediate: true });

onBeforeUnmount(() => {
    clearTimeout(updateTimer);
    if (unwatchData) unwatchData();
    removeAllLayers();
});
</script>

<style lang="scss" scoped></style>