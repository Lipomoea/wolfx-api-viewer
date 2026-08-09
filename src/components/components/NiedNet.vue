<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import Http from '@/classes/Http';
import axios from 'axios';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls, iconUrls } from '@/utils/Urls';
import { getTimeNumberString, playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromLevel, exactRound, timeToStamp, calcDistanceKm, calcBearingDeg, calcLngDiff, stampToTime, calcWaveDistance } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { abnormalNiedStations, NiedStation, simpleIcon } from '@/classes/StationClasses';
import { NiedStationCanvasLayer } from '@/classes/StationCanvasLayer';
import { NiedGridCanvasLayer } from '@/classes/GridCanvasLayer';
import { niedSitePub } from '@/utils/NiedSitePub';
import { mergeNiedHypocenterUpdates } from '@/utils/NiedHypocenterUpdates';
import travelTimes from '@/utils/TravelTimes';
import infHypoIconUrl from '@/assets/icon/hypocenter/infHypo.svg';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const useStationCanvasRenderer = computed(() => !settingsStore.advancedSettings.fallbackSvgStationRender)
const infHypoIcon = L.icon({
    iconUrl: infHypoIconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
})
let stationList = []
const stationData = ref([])
const stations = reactive([])
const siteConfigId = ref('')
let map
const defaultDelay = 1200
const maxDelay = 3000
const delay = ref(defaultDelay)
const niedMaxShindo = inject('niedMaxShindo')
const niedUpdateTime = inject('niedUpdateTime')
const niedPeriodMaxShindo = inject('niedPeriodMaxShindo')
const niedPeriodBarClass = inject('niedPeriodBarClass')
const handleTempEqlists = inject('handleTempEqlists')
const smartSetView = inject('smartSetView')
const activeEewList = inject('activeEewList')
let periodMaxLevel = -1
const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && pendingRender) {
        pendingRender = false
        renderAll()
    }
}
const currentMaxShindo = computed(()=>{
    const currentMaxLevel = Math.max(...grids.value.map(grid => grid.level), -1)
    if(currentMaxLevel == -1) return -1
    else if(currentMaxLevel <= 7) return 0
    else if(currentMaxLevel <= 9) return 1
    else if(currentMaxLevel <= 11) return 2
    else if(currentMaxLevel <= 13) return 3
    else if(currentMaxLevel <= 15) return 4
    else if(currentMaxLevel <= 17) return 5
    else if(currentMaxLevel <= 19) return 6
    else return 7
})
const adjStationIds = {}
const adjStations4Hypo = {}
const expireSeconds = {}
const distMatrix = [[]]
const bearingDirections = ['N', 'E', 'S', 'W']
let decimal = [0, 0]
const activeStations = computed(() => stations.filter(station => station.isActive))
const grids = computed(()=>{
    const gridMap = {}
    activeStations.value.forEach(station=>{
        const latLng = station.latLng.map((l, index) => Math.round(l - decimal[index]) + decimal[index])
        const level = station.level
        const key = JSON.stringify(latLng)
        if(key in gridMap){
            if(level > gridMap[key].level) gridMap[key].level = level
        }
        else {
            gridMap[key] = {
                latLng,
                level
            }
        }
    })
    return Object.values(gridMap)
})
const getData = async (url)=>{
    try {
        const res = await axios.get(url, { timeout: 3000 })
        return res
    }
    catch (e) {
        if(e.code == "ERR_BAD_REQUEST" && delay.value <= maxDelay - 100) {
            delay.value += 100
        }
    }
}
const calcBearingDirection = ([fromLat, fromLng], [toLat, toLng]) => {
    const bearing = calcBearingDeg([fromLat, fromLng], [toLat, toLng])
    return Number.isFinite(bearing)
        ? bearingDirections[Math.floor(((bearing + 45) % 360) / 90)]
        : null
}
let pendingRender = false
const nearbyLength = 6
const activityThresArr1 = [Infinity, 10, 14, 16, 18, 19, 20]
const activityThresArr2 = [Infinity, 8, 11, 13, 14, 15, 16]
const activityThresArr3 = [Infinity, 6, 9, 11, 12, 13, 14]
const inferredHypocenterLabelOffset = 24
let inferredHypocenterLayers = []
let inferredHypocenterLabelLayers = []
let stationCanvasLayer = null
let gridCanvasLayer = null
let stopped = false
let hypocenterWorker = null
let hypocenterRequestId = 0
let inFlightHypocenterRequestId = null
let pendingHypocenterUpdate = null
let updateStamp = null
const hypoInfEewMatchThreshold = {
    lat: 1,
    lng: 1,
    depth: 100,
    originStamp: 10000
}
const minDisplayedHypocenterQualityScore = -3
const isNiedHypoInfEnabled = () => 
    settingsStore.mainSettings.displaySeisNet.niedNet &&
    settingsStore.mainSettings.displaySeisNet.niedHypoInf
const update = ()=>{
    if(stationList.length == stations.length && stations.length == stationData.value.length){
        const render = document.visibilityState === 'visible'
        if(!render) pendingRender = true
        updateStamp = timeToStamp(niedUpdateTime.value, 9)
        let maxLevel = -1
        for(let i = 0; i < stationList.length; i++){
            stations[i].update(stationData.value[i], updateStamp, render)
            if(stations[i].level > maxLevel) maxLevel = stations[i].level
        }
        niedMaxShindo.value = getShindoFromLevel(maxLevel)
        const possibleStations = stations.filter(station=>station.activity > 0);
        const activeStations = new Set();
        const inactiveStations = new Set();
        const checkedStations = new Set();
        const clusters = [];
        const stationPairAbnormalCache = new Map();
        possibleStations.forEach(station=>{
            if(!checkedStations.has(station)){
                if(station.isActive && station.ascend > 0) {
                    chainActivate(station, activeStations, checkedStations, clusters)
                    return
                }
                const nearbyStations = adjStationIds[station.id].map(id=>stations[id]).filter(station=>station.level > -1)
                // const possibleNearbyStations = nearbyStations.filter(station=>station.activity > 0)
                // const nearbyActiveNum = possibleNearbyStations.length - possibleNearbyStations.filter(station => station.ascend <= 1 && !station.isActive).length / 2
                // let nearest0Index = nearbyStations.map(station => station.activity).indexOf(0);
                // if (nearest0Index == -1) nearest0Index = Infinity;
                const nearbyActiveNum = nearbyStations.reduce((sum, nearbyStation, index) => {
                    let score = 1;
                    if (nearbyStation.activity <= 0) return sum;
                    if (nearbyStation.isActive) return sum + score;
                    if (nearbyStation.ascend <= 1) score /= 2;
                    // if (index >= nearest0Index) score /= 2;
                    return sum + score;
                }, 0);
                let numThres, activityThres
                switch(settingsStore.mainSettings.displaySeisNet.niedSensitivity) {
                    case 1:
                        numThres = nearbyStations.length / 2 + 1
                        activityThres = activityThresArr1[nearbyStations.length]
                        break
                    case 2:
                        numThres = nearbyStations.length <= 2 ? (nearbyStations.length + 1) / 2 : nearbyStations.length / 2
                        activityThres = activityThresArr2[nearbyStations.length]
                        break
                    case 3:
                        numThres = nearbyStations.length / 2
                        activityThres = activityThresArr3[nearbyStations.length]
                        break
                    default:
                        return
                }
                if (nearbyActiveNum >= numThres) {
                    const abnormalCandidates = nearbyStations.filter(station => !station.isActive && station.ascend > 2);
                    if (hasAbnormalStationPair(abnormalCandidates, stationPairAbnormalCache)) {
                        activityThres *= 2;
                        // console.log(abnormalCandidates.map(station => [station.triggerStamp / 1000, station.ascend]), abnormalCandidates.map(station => [...station.recentLevel]));
                    }
                    const numActivity = nearbyActiveNum * (nearbyActiveNum + 1) / 2
                    const nearbyActivity = nearbyStations.reduce((sum, nearbyStation, index) => {
                        let score = nearbyStation.activity;
                        // if (nearbyStation.isActive) return sum + score;
                        // if (index >= nearest0Index) score /= 2;
                        return sum + score;
                    }, 0) + numActivity;
                    if (nearbyActivity >= activityThres) {
                        chainActivate(station, activeStations, checkedStations, clusters)
                    }
                }
            }
        })
        if(!statusStore.isActive.niedNet) {
            let first = null
            activeStations.forEach(station=>{
                if(!first || station.level > first.level) {
                    first = station
                }
            })
            if(first) decimal = first.latLng.map(val => exactRound((val + 180) % 1, 2))
        }
        stations.forEach(station => {
            if (activeStations.has(station)) {
                station.setActive();
            } else if (station.level > -1 && station.level < 5 && station.activity <= 0 && !station.isActive) {
                inactiveStations.add(station);
            }
        })
        const currentActiveStations = stations.filter(station => station.isActive)
        if(render && useStationCanvasRenderer.value) renderAll()
        if(!isNiedHypoInfEnabled()) {
            terminateHypocenterWorker()
            clearInferredHypocenters()
        }
        else if(currentActiveStations.length > 0) {
            const pickCandidateStations = currentActiveStations.filter(station =>
                station.ascend >= 2 && Number.isFinite(station.triggerStamp) && station.triggerStamp > 0
            )
            updateInferredHypocentersInWorker(pickCandidateStations, inactiveStations)
        }
        else {
            resetHypocenterWorker()
            clearInferredHypocenters()
        }
    }
}
const hasAbnormalStationPair = (targetStations, stationPairAbnormalCache) => {
    for(let i = 0; i < targetStations.length - 1; i++) {
        for(let j = i + 1; j < targetStations.length; j++) {
            if(isAbnormalStationPair(targetStations[i], targetStations[j], stationPairAbnormalCache)) {
                return true
            }
        }
    }
    return false
}
const isAbnormalStationPair = (station1, station2, stationPairAbnormalCache) => {
    const id1 = Math.min(station1.id, station2.id)
    const id2 = Math.max(station1.id, station2.id)
    const key = `${id1}-${id2}`
    if(stationPairAbnormalCache.has(key)) return stationPairAbnormalCache.get(key)
    const result = calcStationPairAbnormal(station1, station2)
    stationPairAbnormalCache.set(key, result)
    return result
}
const calcStationPairAbnormal = (station1, station2) => {
    if(!station1.triggerStamp || !station2.triggerStamp) return false
    const distance = distMatrix[station1.id]?.[station2.id]
    if(!Number.isFinite(distance)) return false
    const maxDiffSeconds = distance / 3.5 + 2
    const triggerDiffSeconds = Math.abs(station1.triggerStamp - station2.triggerStamp) / 1000
    return maxDiffSeconds < triggerDiffSeconds
}
const getHypocenterWorker = () => {
    if(hypocenterWorker) return hypocenterWorker
    hypocenterWorker = new Worker(new URL('@/workers/FindNiedHypocenterWorker.js', import.meta.url), { type: 'module' })
    hypocenterWorker.onmessage = event => {
        const { requestId, results } = event.data || {}
        if(requestId !== inFlightHypocenterRequestId) return
        inFlightHypocenterRequestId = null
        if(!isNiedHypoInfEnabled()) {
            pendingHypocenterUpdate = null
            return
        }
        renderInferredHypocenters(results)
        postPendingHypocenterUpdate()
    }
    hypocenterWorker.onerror = err => {
        console.log(err)
        terminateHypocenterWorker()
    }
    hypocenterWorker.postMessage({
        type: 'init',
        adjStations: adjStations4Hypo
    })
    return hypocenterWorker
}
const resetHypocenterWorker = () => {
    inFlightHypocenterRequestId = null
    pendingHypocenterUpdate = null
    if(!hypocenterWorker) return
    const requestId = ++hypocenterRequestId
    hypocenterWorker.postMessage({
        type: 'reset',
        requestId
    })
}
const terminateHypocenterWorker = () => {
    hypocenterRequestId++
    inFlightHypocenterRequestId = null
    pendingHypocenterUpdate = null
    if(!hypocenterWorker) return
    hypocenterWorker.terminate()
    hypocenterWorker = null
}
const stationToInferredHypocenterSnapshot = station => ({
    id: station.id,
    latLng: [...station.latLng],
    triggerStamp: station.triggerStamp,
    updateStamp: station.updateStamp,
    ascend: station.ascend,
    level: station.level,
    isActive: station.isActive
})
const stationToInferredHypocenterPickSnapshot = station => ({
    pickId: `${station.id}:${station.triggerStamp}`,
    stationId: station.id,
    latLng: [...station.latLng],
    triggerStamp: station.triggerStamp,
    updateStamp: station.updateStamp,
    ascend: station.ascend,
    level: station.level
})
const updateInferredHypocentersInWorker = (pickCandidateStations, inactiveStations) => {
    if(!isNiedHypoInfEnabled()) return
    const update = {
        pickCandidates: pickCandidateStations.map(stationToInferredHypocenterPickSnapshot),
        activeStations: stations.filter(station => station.isActive).map(stationToInferredHypocenterSnapshot),
        inactiveStations: [...inactiveStations].map(stationToInferredHypocenterSnapshot)
    }
    if(inFlightHypocenterRequestId !== null) {
        pendingHypocenterUpdate = mergeNiedHypocenterUpdates(pendingHypocenterUpdate, update)
        return
    }
    postHypocenterUpdate(update)
}
const postHypocenterUpdate = update => {
    const requestId = ++hypocenterRequestId
    inFlightHypocenterRequestId = requestId
    getHypocenterWorker().postMessage({
        type: 'update',
        requestId,
        ...update
    })
}
const postPendingHypocenterUpdate = () => {
    if(!pendingHypocenterUpdate) return
    const update = pendingHypocenterUpdate
    pendingHypocenterUpdate = null
    postHypocenterUpdate(update)
}
const getPickDisplayWave = pickResult => {
    if(pickResult.excludedReason === 'duplicate-phase') return 'D'
    if(pickResult.weight > 0 || pickResult.wave === 'O' || pickResult.wave === 'L') return pickResult.wave
    return null
}
const renderInferredHypocenters = results => {
    clearInferredHypocenters()
    if(!isNiedHypoInfEnabled()) return
    if(!map || !Array.isArray(results)) return
    const visibleResults = results
        .filter(result => result.hypocenter && Number.isFinite(result.score))
        .filter(shouldDisplayHypocenterResult)
    statusStore.isActive.niedInfHypo = visibleResults.length > 0
    visibleResults
        .forEach(result => {
            const { lat, lng, depth } = result.hypocenter
            const latLng = [lat, lng]
            const pickResults = Array.isArray(result.pickResults) ? result.pickResults : []
            const waveCounts = pickResults.reduce((counts, pickResult) => {
                const displayWave = getPickDisplayWave(pickResult)
                if(!displayWave) return counts
                counts[displayWave] = (counts[displayWave] || 0) + 1
                return counts
            }, {})
            const clusterStationCount = result.clusterStationCount ?? result.effectiveStationCount ?? 0
            const originTimeJst = Number.isFinite(result.originStamp) ? stampToTime(result.originStamp, 9) : '-'
            const waveLayers = createInferredWaveLayers(latLng, result)
            const markerLayer = L.marker(latLng, {
                icon: infHypoIcon,
                opacity: 1,
                interactive: false,
                pane: 'eewMarkerPane',
            }).addTo(map)
            const labelLayer = createInferredHypocenterLabelLayer(result, latLng, {
                lat,
                lng,
                depth,
                clusterStationCount,
                originTimeJst,
                waveCounts
            })
            inferredHypocenterLayers.push(...waveLayers, markerLayer)
            if(labelLayer) {
                inferredHypocenterLayers.push(labelLayer)
                inferredHypocenterLabelLayers.push(labelLayer)
            }
        })
    layoutInferredHypocenterLabels()
}
const layoutInferredHypocenterLabels = () => {
    if(!map) return
    const placedBoxes = []
    const collisionGap = 4
    const edgePadding = 8
    const mapSize = map.getSize()
    inferredHypocenterLabelLayers.forEach(labelLayer => {
        const labelElement = labelLayer.getElement()?.firstElementChild
        if(!labelElement) return
        const width = labelElement.offsetWidth
        const height = labelElement.offsetHeight
        if(width <= 0 || height <= 0) return
        const point = map.latLngToContainerPoint(labelLayer.getLatLng())
        const candidates = [
            { left: point.x - width / 2, top: point.y + inferredHypocenterLabelOffset, transform: `translate(-50%, ${inferredHypocenterLabelOffset}px)` },
            { left: point.x - width / 2, top: point.y - inferredHypocenterLabelOffset - height, transform: `translate(-50%, calc(-100% - ${inferredHypocenterLabelOffset}px))` },
            { left: point.x + inferredHypocenterLabelOffset, top: point.y - height / 2, transform: `translate(${inferredHypocenterLabelOffset}px, -50%)` },
            { left: point.x - inferredHypocenterLabelOffset - width, top: point.y - height / 2, transform: `translate(calc(-100% - ${inferredHypocenterLabelOffset}px), -50%)` }
        ].map(candidate => ({
            ...candidate,
            right: candidate.left + width,
            bottom: candidate.top + height
        }))
        const isNonOverlapping = candidate => placedBoxes.every(box =>
            candidate.right + collisionGap <= box.left ||
            candidate.left >= box.right + collisionGap ||
            candidate.bottom + collisionGap <= box.top ||
            candidate.top >= box.bottom + collisionGap
        )
        const isWithinMap = candidate =>
            candidate.left >= edgePadding &&
            candidate.top >= edgePadding &&
            candidate.right <= mapSize.x - edgePadding &&
            candidate.bottom <= mapSize.y - edgePadding
        const placement = candidates.find(candidate => isNonOverlapping(candidate) && isWithinMap(candidate)) ??
            candidates.find(isNonOverlapping) ??
            candidates.find(isWithinMap) ??
            candidates[0]
        labelElement.style.transform = placement.transform
        placedBoxes.push(placement)
    })
}
const createInferredHypocenterLabelLayer = (result, latLng, labelInfo) => {
    const labelHtml = createInfLabelHtml(result, labelInfo)
    if(!labelHtml) return null
    return L.marker(latLng, {
        icon: L.divIcon({
            className: '',
            iconSize: null,
            iconAnchor: [0, 0],
            html: labelHtml
        }),
        // pane: 'eewMarkerPane',
        interactive: false
    }).addTo(map)
}
const shouldDisplayHypocenterResult = result => {
    if(result.qualityScore < minDisplayedHypocenterQualityScore) return false
    if(settingsStore.mainSettings.displaySeisNet.niedHypoInfAlwaysOn) return true
    return !isMatchedWithActiveJmaEew(result)
}
const isMatchedWithActiveJmaEew = result => {
    if(!Array.isArray(activeEewList)) return false
    return activeEewList.some(event => isCloseToJmaEewHypocenter(result, event?.eqMessage))
}
const isCloseToJmaEewHypocenter = (result, eqMessage) => {
    if(eqMessage?.source !== 'jmaEew') return false
    if(eqMessage.isAssumption || eqMessage.isCanceled) return false
    if(!Number.isFinite(result?.originStamp)) return false
    if(!Number.isFinite(eqMessage.lat) || !Number.isFinite(eqMessage.lng)) return false
    if(!Number.isFinite(eqMessage.depth)) return false
    const eewOriginStamp = timeToStamp(eqMessage.originTime, eqMessage.timeZone)
    if(!Number.isFinite(eewOriginStamp) || eewOriginStamp <= 0) return false
    const hypocenter = result.hypocenter
    return Math.abs(hypocenter.lat - eqMessage.lat) <= hypoInfEewMatchThreshold.lat &&
        calcLngDiff(hypocenter.lng, eqMessage.lng) <= hypoInfEewMatchThreshold.lng &&
        Math.abs((hypocenter.depth ?? 10) - eqMessage.depth) <= hypoInfEewMatchThreshold.depth &&
        Math.abs(result.originStamp - eewOriginStamp) <= hypoInfEewMatchThreshold.originStamp
}
const createInfLabelHtml = (result, labelInfo) => {
    const textInfoMode = settingsStore.effectiveNiedHypoInfTextInfo
    if(textInfoMode === 0) return ''
    const { lat, lng, depth, clusterStationCount, originTimeJst, waveCounts } = labelInfo
    const reportText = result.reportNum ?? '-'
    const stableText = result.stable ? '（稳定）' : ''
    const qualityText = result.qualityRank ? `质量${result.qualityRank}` : ''
    const detailedHtml = textInfoMode === 2 ? `
        <div>
            latlng: ${lat.toFixed(1)}, ${lng.toFixed(1)}<br>
            clusterId: ${result.clusterId ?? '-'} / updates: ${result.updates ?? '-'}<br>
            effective: ${result.effectiveStationCount} (${result.effectivePickCount ?? '-'}) / qualityScore: ${result.qualityScore.toFixed(2)} / filter: ${result.filterStageLevel ?? 0}<br>
            loss: ${result.score.toFixed(2)} / rmse: ${result.rmse.toFixed(2)} / penalty: ${result.inactivePenalty.toFixed(2)}<br>
            scenario: ${result.scenario ?? '-'} / P: ${waveCounts.P || 0} S: ${waveCounts.S || 0} O: ${waveCounts.O || 0} D: ${waveCounts.D || 0}
        </div>
    ` : ''
    return `
        <div style="
            display: inline-block;
            width: max-content;
            max-width: 360px;
            padding: 8px 10px;
            color: #fff;
            -webkit-text-stroke: 0.35px #000000cc;
            paint-order: stroke fill;
            text-shadow: 0 0 2px #000000cc, 0 0 4px #000000aa, 1px 1px 2px #000000cc, -1px -1px 2px #000000cc;
            font-size: 12px;
            line-height: 1.25;
            text-align: center;
            overflow: hidden;
            pointer-events: none;
            white-space: nowrap;
            transform: translate(-50%, ${inferredHypocenterLabelOffset}px);
        ">
            <div style="font-size: 14px; font-weight: 700; line-height: 1.25;">
                NIED震源推算 第${reportText}报${stableText}<br>
                ${originTimeJst} (+9)<br>
                深${depth.toFixed(0)}km<br>
                ${clusterStationCount}测站 ${qualityText}
            </div>
            ${detailedHtml}
        </div>
    `
}
const createInferredWaveLayers = (latLng, result) => {
    if(!Number.isFinite(result.originStamp)) return []
    if(!Number.isFinite(updateStamp)) return []
    const passedTime = (updateStamp - result.originStamp) / 1000
    if(!Number.isFinite(passedTime) || passedTime < 0) return []
    return [
        createInferredWaveLayer(latLng, result.hypocenter.depth, passedTime, true, '#ffffff'),
        createInferredWaveLayer(latLng, result.hypocenter.depth, passedTime, false, '#ff9500')
    ].filter(Boolean)
}
const createInferredWaveLayer = (latLng, depth, passedTime, isPWave, color) => {
    let waveInfo = calcWaveDistance(travelTimes.jma2001, isPWave, depth, passedTime)
    if(waveInfo.radius > 2000) waveInfo = calcWaveDistance(travelTimes.jb, isPWave, depth, passedTime)
    if(waveInfo.radius <= 0) return null
    return L.circle(latLng, {
        radius: waveInfo.radius * 1000,
        color,
        weight: 2,
        opacity: 1,
        fill: false,
        dashArray: '8 8',
        interactive: false,
        pane: 'wavePane'
    }).addTo(map)
}
const clearInferredHypocenters = () => {
    statusStore.isActive.niedInfHypo = false
    if(!map) {
        inferredHypocenterLayers = []
        inferredHypocenterLabelLayers = []
        return
    }
    inferredHypocenterLayers.forEach(layer => {
        if(map.hasLayer(layer)) map.removeLayer(layer)
    })
    inferredHypocenterLayers = []
    inferredHypocenterLabelLayers = []
}
const chainActivate = (station, activeStations, checkedStations, clusters)=>{
    const pendingStations = new Set([station])
    const cluster = [];
    while(pendingStations.size > 0){
        const currentStation = pendingStations.values().next().value
        pendingStations.delete(currentStation)
        checkedStations.add(currentStation)
        if(currentStation.activity > 0){
            activeStations.add(currentStation)
            cluster.push(currentStation);
            adjStationIds[currentStation.id].forEach(id=>{
                const neighbor = stations[id]
                if(!checkedStations.has(neighbor)) pendingStations.add(neighbor)
            })
        }
    }
    clusters.push(cluster);
}
const renderAll = ()=>{
    if(useStationCanvasRenderer.value) {
        stationCanvasLayer?.redraw()
        return
    }
    stations.forEach(station=>{
        station.render()
    })
}
const initStationCanvasLayer = () => {
    if(!useStationCanvasRenderer.value) return
    if(!map || stationCanvasLayer || stations.length === 0) return
    stationCanvasLayer = new NiedStationCanvasLayer(stations).addTo(map)
}
const initGridCanvasLayer = () => {
    if(!map || gridCanvasLayer) return
    gridCanvasLayer = new NiedGridCanvasLayer(grids.value).addTo(map)
}
let fetchStationInterval, requestInterval, delayInterval
let disableReloadTimer, enableReloadTimer
let reloadStarted = false
const fetchStationList = async () => {
    if(stopped) return
    try {
        const res = await Http.get(seisNetUrls.nied.stationList + `?time=${Date.now()}`)
        if(stopped) return
        if(res && res.siteConfigId && res.items?.length > 0) {
            clearInterval(fetchStationInterval)
            siteConfigId.value = res.siteConfigId
            
            //低精度[[lat, lng], ...]
            stationList = res.items

            //使用NIED的测站数据提高经纬度精度
            let k = -1, ko
            const maxTry = 10
            for(let i = 0; i < stationList.length; i++){
                ko = k
                const targetLat = exactRound(stationList[i][0], 1)
                const targetLng = exactRound(stationList[i][1], 1)
                let possibleSite = null
                let found = false
                for(let j = 0; j < maxTry; j++) {
                    k++
                    if(k >= niedSitePub.length) break
                    possibleSite = niedSitePub[k]
                    const { latitude, longitude } = possibleSite
                    if(exactRound(latitude, 1) == targetLat && exactRound(longitude, 1) == targetLng) {
                        found = true
                        break
                    }
                }
                if(found) {
                    const { latitude, longitude } = possibleSite
                    stationList[i] = [latitude, longitude]
                } else {
                    k = ko
                    console.log(`未匹配的测站经纬度: ${stationList[i]}`)
                }
            }

            let latLngs = []
            for(let i = 0; i < stationList.length; i++){
                latLngs[i] = stationList[i]
            }
            for(let i = 0; i < stationList.length; i++){
                const distances = []
                distMatrix[i] = []
                for(let j = 0; j < stationList.length; j++){
                    let distance
                    if(j < i) {
                        distance = distMatrix[j][i]
                    }
                    else if(j == i) {
                        distance = 0
                    }
                    else {
                        distance = calcDistanceKm(latLngs[i], latLngs[j])
                    }
                    distMatrix[i][j] = distance
                    distances.push({ id: j, distance })
                }
                const sortedDistances = distances.sort((a, b) => a.distance - b.distance)
                const nearbyDistances = sortedDistances.filter(obj => obj.distance <= 30)
                if(nearbyDistances.length <= 1) {
                    const candidate = sortedDistances.find(obj => obj.distance > 30 && obj.distance <= 40)
                    if(candidate) nearbyDistances.push(candidate)
                }
                nearbyDistances.splice(nearbyLength)
                adjStationIds[i] = nearbyDistances.map(obj => obj.id)
                const hypoDirectionSet = new Set()
                const hypoDistances = sortedDistances.filter(obj => {
                    if(obj.distance > 30) return false
                    if(obj.id === i) return true
                    const direction = calcBearingDirection(latLngs[i], latLngs[obj.id])
                    if(direction) hypoDirectionSet.add(direction)
                    return true
                })
                sortedDistances
                    .filter(obj => obj.distance > 30 && obj.distance <= 300)
                    .some(obj => {
                        if(hypoDirectionSet.size >= bearingDirections.length) return true
                        const direction = calcBearingDirection(latLngs[i], latLngs[obj.id])
                        if(!direction || hypoDirectionSet.has(direction)) return false
                        hypoDistances.push(obj)
                        hypoDirectionSet.add(direction)
                        return hypoDirectionSet.size >= bearingDirections.length
                    })
                adjStations4Hypo[i] = hypoDistances.map(obj => ({
                    stationId: obj.id,
                    distance: obj.distance
                }))
                // const maxDist = distances[distances.length - 1].distance
                // expireSeconds[i] = Math.max(Math.ceil(maxDist / 3.5), 5)
                expireSeconds[i] = 10
            }
            stationList.forEach((latLng, index)=>{
                const station = reactive(new NiedStation(map, index, latLng, 'c', expireSeconds[index], useStationCanvasRenderer.value))
                stations.push(station)
            })
            initStationCanvasLayer()
            renderAll()
            clearAbnormalList()
        }
    } catch (err) {
        console.log(err);
    }
}
const clearAbnormalList = () => 
    Object.keys(abnormalNiedStations).forEach(key => delete abnormalNiedStations[key])
onMounted(()=>{
    fetchStationInterval = setInterval(fetchStationList, 5000);
    fetchStationList()
    requestInterval = setInterval(async () => {
        if(stopped) return
        try {
            const isRealtime = settingsStore.mainSettings.displaySeisNet.delay == 0
            const time = getTimeNumberString(9, -delay.value)
            const date = time.slice(0, 8)
            const res = await getData(`${seisNetUrls.nied.stationData}/${date}/${time}.json`)
            if(stopped) return
            if(res?.status == 200) {
                const data = res.data
                if(data.realTimeData.siteConfigId == siteConfigId.value) {
                    stationData.value = data.realTimeData.intensity.split('')
                    const timeDiff = calcTimeDiff(data.realTimeData.dataTime.slice(0, -6), 9, niedUpdateTime.value, 9)
                    if(timeDiff > 1000) {
                        const popNum = Math.min(Math.round(timeDiff / 1000) - 1, 60)
                        const noDataArr = Array(popNum).fill(-1)
                        stations.forEach(station => {
                            station.recentLevel.unshift(...noDataArr)
                            station.recentLevel.splice(station.maxRecentLength)
                        })
                    }
                    if(timeDiff > 10000) {
                        stations.forEach(station => {
                            station.isActive = false
                        })
                    }
                    if(delay.value > maxDelay && timeDiff <= -3000) {
                        stations.forEach(station => {
                            station.level = -1
                            station.recentLevel = []
                            station.isActive = false
                        })
                        clearAbnormalList()
                    }
                    if(delay.value > maxDelay && timeDiff <= -3000 || timeDiff > 0) {
                        niedUpdateTime.value = data.realTimeData.dataTime.slice(0, -6).replace('T', ' ')
                        update()
                    }
                }
                else if(siteConfigId.value && isRealtime){
                    clearInterval(requestInterval)
                    ElMessage({
                        message: 'NIED站点数据已更新，正在重新加载。此过程可能重复数次，请耐心等待。',
                        type: 'warning',
                    })
                    disableReloadTimer = setTimeout(() => {
                        if(stopped) return
                        reloadStarted = true
                        statusStore.isNiedUpdating = true
                        settingsStore.mainSettings.displaySeisNet.niedNet = false
                    }, 0);
                    enableReloadTimer = setTimeout(() => {
                        if(!reloadStarted) return
                        settingsStore.mainSettings.displaySeisNet.niedNet = true
                        statusStore.isNiedUpdating = false
                        reloadStarted = false
                    }, 5000);
                }
            }
        } catch (err) {
            console.log(err);
        }
    }, 500);
    document.addEventListener('visibilitychange', handleVisibilityChange)
})
let unwatchGrids, unwatchRender
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        initStationCanvasLayer()
        initGridCanvasLayer()
        map.on('zoomend', renderAll)
        map.on('zoomend moveend', layoutInferredHypocenterLabels)
        unwatchGrids = watch(grids, (newVal)=>{
            let maxLevel = -1
            gridCanvasLayer?.setGrids(newVal)
            newVal.forEach(item => {
                if(item.level > maxLevel) {
                    maxLevel = item.level
                }
                if(item.level > periodMaxLevel) periodMaxLevel = item.level
            })
            niedPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
            niedPeriodBarClass.value = maxLevel >= 0 ? NiedGridCanvasLayer.getGridColorByLevel(maxLevel) : 'gray'
            statusStore.isActive.niedNet = newVal.length > 0
        }, { immediate: true })
        unwatchRender = watch(
            ()=>`${settingsStore.mainSettings.displaySeisNet.style}
            |${settingsStore.mainSettings.displaySeisNet.displayNiedShindo}
            |${settingsStore.mainSettings.displaySeisNet.hideNoData}
            |${simpleIcon.value}
            |${settingsStore.mainSettings.displaySeisNet.displayShindo0}`, 
            renderAll
        )
    }
}, { immediate: true })
watch(()=>(statusStore.isActive.jmaEew || statusStore.isActive.niedNet), newVal=>{
    if(newVal){
        if(periodMaxLevel == -1){
            periodMaxLevel = 0
            niedPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
        }
    }
    else{
        periodMaxLevel = -1
        niedPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
    }
}, { immediate: true })
watch(() => grids.value.length, () => smartSetView())
watch(
    () => isNiedHypoInfEnabled(),
    enabled => {
        if(enabled) return
        terminateHypocenterWorker()
        clearInferredHypocenters()
    },
    { immediate: true }
)
let shake1Notified = false, shake2Notified = false
let focused = false
watch(currentMaxShindo, (newVal, oldVal)=>{
    if(newVal > oldVal){
        if(settingsStore.mainSettings.onShake.sound){
            const type = `shindo${newVal}`
            playSound(type)
        }
        if(settingsStore.mainSettings.onShake.notification){
            if(newVal >= 1 && newVal <= 3 && !shake1Notified){
                sendMyNotification('揺れを検出', 
                    '揺れに注意してください。', 
                    iconUrls.caution
                )
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendMyNotification('強い揺れを検出', 
                    '強い揺れに警戒してください。', 
                    iconUrls.warn
                )
                shake1Notified = true
                shake2Notified = true
            }
        }
        if(settingsStore.mainSettings.onShake.focus){
            if(newVal >= 1 && !focused){
                focusWindow()
                focused = true
            }
        }
        handleTempEqlists(0)
    }
    else{
        shake1Notified = false
        shake2Notified = false
        focused = false
    }
})
watch(()=>settingsStore.mainSettings.displaySeisNet.delay, newVal=>{
    clearInterval(delayInterval)
    if(newVal > maxDelay / 60000){
        delay.value = newVal * 60000
    }
    else{
        delay.value = defaultDelay
        delayInterval = setInterval(() => {
            if(delay.value <= maxDelay * 2/3) delay.value -= 10
            else delay.value -= 100
        }, 10000);
    }
}, { immediate: true })
onBeforeUnmount(()=>{
    stopped = true
    clearInterval(fetchStationInterval)
    clearInterval(requestInterval)
    clearInterval(delayInterval)
    clearTimeout(disableReloadTimer)
    if(!reloadStarted) clearTimeout(enableReloadTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if(unwatchGrids) unwatchGrids()
    if(unwatchRender) unwatchRender()
    if(map) {
        map.off('zoomend', renderAll)
        map.off('zoomend moveend', layoutInferredHypocenterLabels)
        if(stationCanvasLayer && map.hasLayer(stationCanvasLayer)) map.removeLayer(stationCanvasLayer)
        if(gridCanvasLayer && map.hasLayer(gridCanvasLayer)) map.removeLayer(gridCanvasLayer)
        map.eachLayer(layer=>{
            if(layer.options.pane == 'niedGridPane' || layer.options.pane?.includes('niedStationPane')){
                map.removeLayer(layer)
            }
        })
    }
    stationCanvasLayer = null
    gridCanvasLayer = null
    stations.forEach((station, index)=>{
        station.terminate()
        stations[index] = null
    })
    stations.length = 0
    clearAbnormalList()
    terminateHypocenterWorker()
    clearInferredHypocenters()
    statusStore.isActive.niedNet = false
})
</script>

<style lang="scss" scoped>

</style>
