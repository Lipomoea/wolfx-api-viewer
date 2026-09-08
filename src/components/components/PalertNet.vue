<template>
    <div>

    </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import Palert from '@/classes/Palert';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { iconUrls } from '@/utils/Urls';
import { calcDistanceKm, exactRound, focusWindow, getPalertLevelFromPgaPgv, getShindoFromLevel, playSound, sendMyNotification, stampToTime } from '@/utils/Utils';
import 'leaflet/dist/leaflet.css';
import { PalertStation, simpleIcon } from '@/classes/StationClasses';
import { PalertStationCanvasLayer } from '@/classes/StationCanvasLayer';
import { PalertGridCanvasLayer } from '@/classes/GridCanvasLayer';
import { useTimeStore } from '@/stores/time';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()
const useStationCanvasRenderer = computed(() => !settingsStore.advancedSettings.fallbackSvgStationRender)

const stationList = reactive([])
const stations = reactive({})
let adjStationIds = {}
let stationVersion = ''
let stationCanvasLayer = null
let gridCanvasLayer = null
let map
let stopped = false
let requestGeneration = 0
let latestFrameStamp = null
let pendingTimelineSwitch = false
const delay = computed(() => settingsStore.mainSettings.displaySeisNet.delay * 60000)
const palertMaxShindo = inject('palertMaxShindo')
const palertUpdateTime = inject('palertUpdateTime')
const palertPeriodMaxShindo = inject('palertPeriodMaxShindo')
const palertPeriodBarClass = inject('palertPeriodBarClass')
const handleTempEqlists = inject('handleTempEqlists')
const smartSetView = inject('smartSetView')
let periodMaxLevel = -1
let pendingRender = false
let decimal = [0, 0]

const handleVisibilityChange = () => {
    if(document.visibilityState === 'visible' && pendingRender) {
        pendingRender = false
        renderAll()
    }
}
const activeStationIds = computed(() => Object.keys(stations).filter(id => stations[id].isActive))
const grids = computed(() => {
    const gridMap = {}
    activeStationIds.value.forEach(id => {
        const latLng = stations[id].latLng.map((value, index) => Math.round(value - decimal[index]) + decimal[index])
        const level = stations[id].holdLevel
        const key = JSON.stringify(latLng)
        if(key in gridMap) {
            if(level > gridMap[key].level) gridMap[key].level = level
        }
        else {
            gridMap[key] = { latLng, level }
        }
    })
    return Object.values(gridMap)
})
const currentMaxShindo = computed(() => {
    const currentMaxLevel = Math.max(...grids.value.map(grid => grid.level), -1)
    if(currentMaxLevel == -1) return -1
    if(currentMaxLevel <= 7) return 0
    if(currentMaxLevel <= 9) return 1
    if(currentMaxLevel <= 11) return 2
    if(currentMaxLevel <= 13) return 3
    if(currentMaxLevel <= 15) return 4
    if(currentMaxLevel <= 17) return 5
    if(currentMaxLevel <= 19) return 6
    return 7
})
const normalizeMeasurement = value => Number.isFinite(value) && value >= 0 ? value : null
const parseTimestamp = value => {
    const numericValue = typeof value == 'number' || typeof value == 'string' && /^\d+(\.\d+)?$/.test(value)
        ? Number(value)
        : NaN
    if(Number.isFinite(numericValue)) return numericValue < 1e12 ? numericValue * 1000 : numericValue
    return Date.parse(value)
}
const parseResponse = (response, allowEmpty = false) => {
    if(!response || !response.dataVals || typeof response.dataVals != 'object' || Array.isArray(response.dataVals)) {
        throw new Error('P-Alert response has invalid dataVals')
    }
    if(!allowEmpty && Object.keys(response.dataVals).length === 0) {
        throw new Error('P-Alert response contains no station data')
    }
    const timestamp = parseTimestamp(response.timestamp)
    if(!Number.isFinite(timestamp)) throw new Error('P-Alert response has an invalid timestamp')
    return { dataVals: response.dataVals, timestamp }
}
const detectActiveStations = () => {
    const seedStations = new Set()
    Object.values(stations).forEach(station => {
        const nearbyStations = (adjStationIds[station.id] ?? [])
            .map(id => stations[id])
            .filter(Boolean)
        const activitySum = nearbyStations.reduce((sum, nearbyStation) => sum + nearbyStation.activity, 0)
        if(activitySum < Math.max(nearbyStations.length * 0.1, 3)) return
        nearbyStations.forEach(nearbyStation => {
            if(nearbyStation.activity > 0) seedStations.add(nearbyStation)
        })
    })

    const activeStations = new Set()
    const pendingStations = new Set(seedStations)
    while(pendingStations.size > 0) {
        const currentStation = pendingStations.values().next().value
        pendingStations.delete(currentStation)
        if(activeStations.has(currentStation)) continue
        activeStations.add(currentStation)
        const nearbyIds = adjStationIds[currentStation.id] ?? []
        nearbyIds.forEach(id => {
            const neighbor = stations[id]
            if(neighbor?.activity > 0 && !activeStations.has(neighbor)) pendingStations.add(neighbor)
        })
    }
    return activeStations
}
const updateMaxShindo = () => {
    const maxLevel = Math.max(...Object.values(stations).map(station => station.holdLevel), -1)
    palertMaxShindo.value = getShindoFromLevel(maxLevel)
}
const commitFrame = (frameStamp, pgaData, pgvData, generation) => {
    if(stopped || generation != requestGeneration) return
    const isFirstFrameAfterTimelineSwitch = pendingTimelineSwitch
    if(!isFirstFrameAfterTimelineSwitch && latestFrameStamp !== null && frameStamp <= latestFrameStamp) return

    const render = document.visibilityState === 'visible'
    if(!render) pendingRender = true
    pendingTimelineSwitch = false
    const missingSeconds = latestFrameStamp === null || isFirstFrameAfterTimelineSwitch
        ? 0
        : Math.min(Math.max(Math.round((frameStamp - latestFrameStamp) / 1000) - 1, 0), 60)
    if(isFirstFrameAfterTimelineSwitch) {
        Object.values(stations).forEach(station => {
            station.isActive = false
            clearTimeout(station.activeTimer)
        })
    }

    Object.keys(stations).forEach(id => {
        const pga = normalizeMeasurement(pgaData[id])
        const pgv = pgvData ? normalizeMeasurement(pgvData[id]) : null
        const level = getPalertLevelFromPgaPgv(pga, pgv)
        stations[id].update({ timestamp: frameStamp, pga, pgv, level }, missingSeconds, render)
    })

    latestFrameStamp = frameStamp
    palertUpdateTime.value = stampToTime(frameStamp, 8)
    updateMaxShindo()
    if(render && useStationCanvasRenderer.value) renderAll()

    const detectedStations = detectActiveStations()
    let first = null
    detectedStations.forEach(station => {
        station.setActive()
        if(!statusStore.isActive.palertNet && (!first || station.holdLevel > first.holdLevel)) first = station
    })
    if(first) decimal = first.latLng.map(value => exactRound((value + 180) % 1, 2))
}
const fetchRealtimeData = async () => {
    if(stopped) return
    const generation = requestGeneration
    const recordTime = delay.value > 0
        ? Math.round((timeStore.getTimeStamp() - delay.value) / 1000)
        : 0
    try {
        const pgaResponse = parseResponse(await Palert.getRealtimeData(0, recordTime))
        if(stopped || generation != requestGeneration) return
        if(!pendingTimelineSwitch && latestFrameStamp !== null && pgaResponse.timestamp <= latestFrameStamp) return

        const needsPgv = Object.values(pgaResponse.dataVals)
            .some(value => {
                const pga = normalizeMeasurement(value)
                return pga !== null && pga >= 25
            })
        let pgvData = null
        if(needsPgv) {
            try {
                const pgvResponse = parseResponse(await Palert.getRealtimeData(1, pgaResponse.timestamp / 1000), true)
                if(pgvResponse.timestamp != pgaResponse.timestamp) {
                    throw new Error('P-Alert PGA and PGV timestamps do not match')
                }
                pgvData = pgvResponse.dataVals
            }
            catch(err) {
                console.log(err)
            }
        }
        commitFrame(pgaResponse.timestamp, pgaResponse.dataVals, pgvData, generation)
    }
    catch(err) {
        console.log(err)
    }
}
const clearReactiveObject = obj => {
    Object.keys(obj).forEach(key => delete obj[key])
}
const buildAdjStationIds = () => {
    const stationIds = Object.keys(stations)
    const result = {}
    stationIds.forEach(id => {
        result[id] = stationIds
            .map(nearbyId => ({
                id: nearbyId,
                distance: calcDistanceKm(stations[id].latLng, stations[nearbyId].latLng)
            }))
            .filter(({ distance }) => distance <= 30)
            .sort((a, b) => a.distance - b.distance)
            .map(({ id: nearbyId }) => nearbyId)
    })
    return result
}
const clearTimelineState = (render = true) => {
    latestFrameStamp = null
    periodMaxLevel = -1
    palertMaxShindo.value = '?'
    palertPeriodMaxShindo.value = '?'
    palertPeriodBarClass.value = 'gray'
    statusStore.isActive.palertNet = false
    Object.values(stations).forEach(station => station.clearHistory(render))
    if(render && useStationCanvasRenderer.value) renderAll()
}
const scheduleTimelineSwitch = () => {
    requestGeneration++
    pendingTimelineSwitch = true
    Object.values(stations).forEach(station => station.clearRecentData())
}
const fetchStationList = async () => {
    if(stopped) return
    try {
        const response = await Palert.getStationList()
        if(stopped || !Array.isArray(response?.staInfos)) return
        if(response.version == stationVersion && JSON.stringify(response.staInfos) == JSON.stringify(stationList)) return
        stationVersion = response.version
        stationList.splice(0, stationList.length, ...response.staInfos)
    }
    catch(err) {
        console.log(err)
    }
}
const renderAll = () => {
    if(useStationCanvasRenderer.value) {
        stationCanvasLayer?.redraw()
        return
    }
    Object.values(stations).forEach(station => station.render())
}
const initStationCanvasLayer = () => {
    if(!useStationCanvasRenderer.value) return
    if(!map || stationCanvasLayer || Object.keys(stations).length === 0) return
    stationCanvasLayer = new PalertStationCanvasLayer(stations).addTo(map)
}
const initGridCanvasLayer = () => {
    if(!map || gridCanvasLayer) return
    gridCanvasLayer = new PalertGridCanvasLayer(grids.value).addTo(map)
}

let fetchStationInterval, requestInterval
onMounted(() => {
    fetchStationInterval = setInterval(fetchStationList, 180 * 1000)
    fetchStationList()
    requestInterval = setInterval(fetchRealtimeData, 1000)
    fetchRealtimeData()
    document.addEventListener('visibilitychange', handleVisibilityChange)
})

let unwatchMap, unwatchStationList, unwatchGrids, unwatchRender, unwatchHold, unwatchDelay
unwatchMap = watch(() => statusStore.map, newVal => {
    if(newVal === null) return
    map = newVal
    initStationCanvasLayer()
    initGridCanvasLayer()
    map.on('zoomend', renderAll)
    unwatchStationList = watch(stationList, newVal => {
        if(newVal.length === 0) return
        requestGeneration++
        pendingTimelineSwitch = false
        clearTimelineState(false)
        Object.values(stations).forEach(station => station.terminate())
        clearReactiveObject(stations)
        map.eachLayer(layer => {
            if(layer.options.pane?.includes('palertStationPane')) map.removeLayer(layer)
        })
        newVal.forEach(info => {
            if(typeof info.station != 'string' || !Number.isFinite(info.lat) || !Number.isFinite(info.lon)) return
            stations[info.station] = reactive(new PalertStation(
                map,
                info.station,
                [info.lat, info.lon],
                useStationCanvasRenderer.value
            ))
        })
        adjStationIds = buildAdjStationIds()
        initStationCanvasLayer()
        renderAll()
    }, { immediate: true })
    unwatchGrids = watch(grids, newVal => {
        let maxLevel = -1
        gridCanvasLayer?.setGrids(newVal)
        newVal.forEach(item => {
            if(item.level > maxLevel) maxLevel = item.level
            if(item.level > periodMaxLevel) periodMaxLevel = item.level
        })
        palertPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
        palertPeriodBarClass.value = maxLevel >= 0 ? PalertGridCanvasLayer.getGridColorByLevel(maxLevel) : 'gray'
        statusStore.isActive.palertNet = newVal.length > 0
    }, { immediate: true })
    unwatchRender = watch(
        () => `${settingsStore.mainSettings.displaySeisNet.style}
        |${settingsStore.mainSettings.displaySeisNet.displayPalertShindo}
        |${settingsStore.mainSettings.displaySeisNet.hideNoData}
        |${simpleIcon.value}
        |${settingsStore.mainSettings.displaySeisNet.displayShindo0}`,
        renderAll
    )
    unwatchHold = watch(() => settingsStore.mainSettings.displaySeisNet.palertLevelHold, () => {
        const render = document.visibilityState === 'visible'
        Object.values(stations).forEach(station => station.updateHoldLevel(render))
        updateMaxShindo()
        if(render && useStationCanvasRenderer.value) renderAll()
    })
}, { immediate: true })
unwatchDelay = watch(delay, scheduleTimelineSwitch)
watch(() => statusStore.isActive.cwaEew || statusStore.isActive.palertNet, newVal => {
    if(newVal) {
        if(periodMaxLevel == -1) {
            periodMaxLevel = 0
            palertPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
        }
    }
    else {
        periodMaxLevel = -1
        palertPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
    }
}, { immediate: true })
watch(() => grids.value.length, () => smartSetView())

let shake1Notified = false, shake2Notified = false
let focused = false
watch(currentMaxShindo, (newVal, oldVal) => {
    if(newVal > oldVal) {
        if(settingsStore.mainSettings.onShake.sound) playSound(`shindo${newVal}`)
        if(settingsStore.mainSettings.onShake.notification) {
            if(newVal >= 1 && newVal <= 3 && !shake1Notified) {
                sendMyNotification('檢測到震動', '請注意搖晃。', iconUrls.caution)
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified) {
                sendMyNotification('檢測到強震動', '請警戒強烈搖晃。', iconUrls.warn)
                shake1Notified = true
                shake2Notified = true
            }
        }
        if(settingsStore.mainSettings.onShake.focus && newVal >= 1 && !focused) {
            focusWindow()
            focused = true
        }
        handleTempEqlists(0)
    }
    else {
        shake1Notified = false
        shake2Notified = false
        focused = false
    }
})

onBeforeUnmount(() => {
    stopped = true
    requestGeneration++
    clearInterval(fetchStationInterval)
    clearInterval(requestInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if(unwatchMap) unwatchMap()
    if(unwatchStationList) unwatchStationList()
    if(unwatchGrids) unwatchGrids()
    if(unwatchRender) unwatchRender()
    if(unwatchHold) unwatchHold()
    if(unwatchDelay) unwatchDelay()
    if(map) {
        map.off('zoomend', renderAll)
        if(stationCanvasLayer && map.hasLayer(stationCanvasLayer)) map.removeLayer(stationCanvasLayer)
        if(gridCanvasLayer && map.hasLayer(gridCanvasLayer)) map.removeLayer(gridCanvasLayer)
        map.eachLayer(layer => {
            if(layer.options.pane == 'palertGridPane' || layer.options.pane?.includes('palertStationPane')) {
                map.removeLayer(layer)
            }
        })
    }
    stationCanvasLayer = null
    gridCanvasLayer = null
    Object.values(stations).forEach(station => station.terminate())
    clearReactiveObject(stations)
    palertUpdateTime.value = '1970-01-01 08:00:00'
    palertMaxShindo.value = '?'
    palertPeriodMaxShindo.value = '?'
    palertPeriodBarClass.value = 'gray'
    statusStore.isActive.palertNet = false
})
</script>

<style lang="scss" scoped>

</style>
