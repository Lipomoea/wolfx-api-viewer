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
import { getTimeNumberString, playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromLevel, exactRound, timeToStamp, calcDistanceKm, stampToTime } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { abnormalNiedStations, NiedStation, simpleIcon } from '@/classes/StationClasses';
import { niedSitePub } from '@/utils/NiedSitePub';
import { FindNiedHypocenter } from '@/classes/Algorithms';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
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
let periodMaxLevel = -1
const currentMaxShindo = computed(()=>{
    const currentMaxLevel = Math.max(...Object.keys(grids.value).map(key=>grids.value[key].level), -1)
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
const adjStationIds4Hypo = {}
const expireSeconds = {}
const distMatrix = [[]]
let decimal = [0, 0]
const gridRects = {}
const activeStations = computed(() => stations.filter(station => station.isActive))
const grids = computed(()=>{
    let grids = {}
    activeStations.value.forEach(station=>{
        const latLng = station.latLng.map((l, index) => Math.round(l - decimal[index]) + decimal[index])
        const level = station.level
        const key = JSON.stringify(latLng)
        if(key in grids){
            if(level > grids[key].level) grids[key].level = level
        }
        else {
            grids[key] = {
                latLng,
                level
            }
        }
    })
    return grids
})
const getData = async (url)=>{
    try {
        const res = await axios.get(url, { timeout: 10000 })
        return res
    }
    catch (e) {
        if(e.code == "ERR_BAD_REQUEST" && delay.value <= maxDelay - 100) {
            delay.value += 100
        }
    }
}
let pendingRender = false
const nearbyLength = 6
const activityThresArr = [Infinity, 8, 11, 13, 14, 15, 15]
let tempHypocenterLayers = []
let findHypocenter = null
const update = ()=>{
    if(stationList.length == stations.length && stations.length == stationData.value.length){
        const render = document.visibilityState === 'visible'
        if(!render) pendingRender = true
        const updateStamp = timeToStamp(niedUpdateTime.value, 9)
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
        const newActiveStations = [];
        possibleStations.forEach(station=>{
            if(!checkedStations.has(station)){
                if(station.isActive && station.ascend > 0) {
                    chainActivate(station, activeStations, checkedStations, clusters)
                    return
                }
                const nearbyStations = adjStationIds[station.id].map(id=>stations[id]).filter(station=>station.level > -1)
                // const possibleNearbyStations = nearbyStations.filter(station=>station.activity > 0)
                // const nearbyActiveNum = possibleNearbyStations.length - possibleNearbyStations.filter(station => station.ascend <= 1 && !station.isActive).length / 2
                let nearest0Index = nearbyStations.map(station => station.activity).indexOf(0);
                if (nearest0Index == -1) nearest0Index = Infinity;
                const nearbyActiveNum = nearbyStations.reduce((sum, nearbyStation, index) => {
                    let score = 1;
                    if (nearbyStation.activity <= 0) return sum;
                    if (nearbyStation.isActive) return sum + score;
                    if (nearbyStation.ascend <= 1) score /= 2;
                    if (index >= nearest0Index) score /= 2;
                    return sum + score;
                }, 0);
                let numThres, activityThres
                switch(settingsStore.mainSettings.displaySeisNet.niedSensitivity) {
                    case 1:
                        numThres = 3
                        activityThres = activityThresArr[nearbyStations.length] + 4
                        break
                    case 2:
                        numThres = nearbyStations.length <= 2 ? (nearbyStations.length + 1) / 2 : nearbyStations.length / 2
                        activityThres = activityThresArr[nearbyStations.length]
                        break
                    case 3:
                        numThres = nearbyStations.length / 2
                        activityThres = activityThresArr[nearbyStations.length] - 2
                        break
                    default:
                        return
                }
                if (nearbyActiveNum >= numThres) {
                    const numActivity = nearbyActiveNum * (nearbyActiveNum + 1) / 2
                    const nearbyActivity = nearbyStations.reduce((sum, nearbyStation, index) => {
                        let score = nearbyStation.activity;
                        if (nearbyStation.isActive) return sum + score;
                        if (index >= nearest0Index) score /= 2;
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
                if (!station.isActive) newActiveStations.push(station)
                station.setActive();
            } else if (station.level > -1 && station.activity <= 0) {
                inactiveStations.add(station);
            }
        })
        const hasActiveStations = stations.some(station => station.isActive)
        if(hasActiveStations) {
            if(!findHypocenter) {
                findHypocenter = new FindNiedHypocenter(inactiveStations, adjStationIds4Hypo)
            }
            renderTempHypocenters(findHypocenter.update(newActiveStations, inactiveStations))
        }
        else {
            findHypocenter = null
            clearTempHypocenters()
        }
    }
}
const renderTempHypocenters = results => {
    clearTempHypocenters()
    if(!map || !Array.isArray(results)) return
    results
        .filter(result => result.hypocenter && Number.isFinite(result.score))
        .forEach(result => {
            const { lat, lng, depth } = result.hypocenter
            const latLng = [lat, lng]
            const stationDetails = Array.isArray(result.stations) ? result.stations : []
            const waveCounts = stationDetails.reduce((counts, station) => {
                counts[station.wave] = (counts[station.wave] || 0) + 1
                return counts
            }, {})
            const clusterSize = result.cluster?.length ?? stationDetails.length
            const originTimeJst = Number.isFinite(result.originStamp) ? stampToTime(result.originStamp, 9) : '-'
            const markerLayer = L.circleMarker(latLng, {
                radius: 10,
                color: '#ffffff',
                fillColor: '#ff2d55',
                fillOpacity: 0.9,
                weight: 3,
                pane: 'eewMarkerPane',
            }).addTo(map)
            const labelLayer = L.marker(latLng, {
                icon: L.divIcon({
                    className: '',
                    iconAnchor: [-20, -20],
                    html: `
                        <div style="
                            min-width: 220px;
                            padding: 8px 10px;
                            border: 2px solid #ff2d5500;
                            border-radius: 6px;
                            background: rgba(255, 255, 255, 0);
                            color: #ffffff;
                            font-size: 12px;
                            line-height: 1.35;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.28);
                            pointer-events: none;
                            white-space: nowrap;
                        ">
                            <strong>NIED推算震源</strong><br>
                            cluster: ${result.clusterId ?? '-'} / report: ${result.reportNum ?? '-'} / final: ${result.final ? 'true' : 'false'}<br>
                            stations: ${clusterSize} / wave picks: ${stationDetails.length}<br>
                            经纬度: ${lat.toFixed(3)}, ${lng.toFixed(3)}<br>
                            深度: ${depth.toFixed(0)} km<br>
                            发震: ${originTimeJst} UTC+9<br>
                            origin stamp: ${Number.isFinite(result.originStamp) ? Math.round(result.originStamp) : '-'}<br>
                            score: ${result.score.toFixed(2)} / RMSE: ${result.rmse.toFixed(2)}<br>
                            inactive penalty: ${result.inactivePenalty}<br>
                            first wave: ${result.firstWave} / P:${waveCounts.P || 0} S:${waveCounts.S || 0}
                        </div>
                    `
                }),
                // pane: 'eewMarkerPane',
                interactive: false
            }).addTo(map)
            tempHypocenterLayers.push(markerLayer, labelLayer)
        })
}
const clearTempHypocenters = () => {
    if(!map) {
        tempHypocenterLayers = []
        return
    }
    tempHypocenterLayers.forEach(layer => {
        if(map.hasLayer(layer)) map.removeLayer(layer)
    })
    tempHypocenterLayers = []
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
    stations.forEach(station=>{
        station.render()
    })
}
let fetchStationInterval, requestInterval, delayInterval
const fetchStationList = async () => {
    try {
        const res = await Http.get(seisNetUrls.nied.stationList + `?time=${Date.now()}`)
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
                let candidate = {
                    id: null,
                    distance: 40
                }
                distMatrix[i] = []
                for(let j = 0; j < stationList.length; j++){
                    let distance
                    if(j < i) distance = distMatrix[j][i]
                    else if(j == i) distance = 0
                    else distance = calcDistanceKm(latLngs[i], latLngs[j])
                    distMatrix[i][j] = distance
                    if(distance <= 30) distances.push({ id: j, distance })
                    else if(distance <= candidate.distance) candidate = { id: j, distance }
                }
                if(distances.length <= 1 && candidate.id !== null) {
                    distances.push(candidate)
                }
                adjStationIds4Hypo[i] = distances.map(obj => obj.id)
                distances.sort((a, b) => a.distance - b.distance).splice(nearbyLength)
                adjStationIds[i] = distances.map(obj => obj.id)
                const maxDist = distances[distances.length - 1].distance
                expireSeconds[i] = Math.max(Math.ceil(maxDist / 3.5), 5)
            }
            stationList.forEach((latLng, index)=>{
                const station = reactive(new NiedStation(map, index, latLng, 'c', expireSeconds[index]))
                stations.push(station)
            })
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
        try {
            const isRealtime = settingsStore.mainSettings.displaySeisNet.delay == 0
            const time = getTimeNumberString(9, -delay.value)
            const date = time.slice(0, 8)
            const res = await getData(`${seisNetUrls.nied.stationData}/${date}/${time}.json`)
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
                    setTimeout(() => {
                        statusStore.isNiedUpdating = true
                        settingsStore.mainSettings.displaySeisNet.niedNet = false
                    }, 0);
                    setTimeout(() => {
                        settingsStore.mainSettings.displaySeisNet.niedNet = true
                        statusStore.isNiedUpdating = false
                    }, 5000);
                }
            }
        } catch (err) {
            console.log(err);
        }
    }, 500);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && pendingRender) {
            pendingRender = false
            renderAll()
        }
    })
})
let unwatchGrids, unwatchRender
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        map.on('zoomend', renderAll)
        unwatchGrids = watch(grids, (newVal)=>{
            let maxLevel = -1, maxColor = 'gray'
            for(let key in newVal) {
                const item = newVal[key]
                const color = item.level <= 7 ? 'green' : item.level <= 13 ? 'yellow' : 'red'
                if(item.level > maxLevel) {
                    maxLevel = item.level
                    maxColor = color
                }
                if(!(key in gridRects)) {
                    const layer = L.rectangle([item.latLng.map(l => l - 0.495), item.latLng.map(l => l + 0.495)], {
                        color,
                        weight: 2,
                        fill: false,
                        pane: 'niedGridPane',
                        interactive: false
                    }).addTo(map)
                    gridRects[key] = {
                        color,
                        layer
                    }
                }
                else if(gridRects[key].color != color) {
                    gridRects[key].color = color
                    gridRects[key].layer.setStyle({
                        color
                    })
                }
                if(item.level > periodMaxLevel) periodMaxLevel = item.level
            }
            for(let key in gridRects) {
                if(!(key in newVal)) {
                    if(map.hasLayer(gridRects[key].layer)) map.removeLayer(gridRects[key].layer)
                    delete gridRects[key]
                }
            }
            niedPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
            niedPeriodBarClass.value = maxColor
            statusStore.isActive.niedNet = Object.keys(newVal).length > 0
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
watch(() => Object.keys(grids.value).length, () => smartSetView())
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
            if(delay.value <= maxDelay * 2/3) delay.value -= 20
            else delay.value -= 100
        }, 10000);
    }
}, { immediate: true })
onBeforeUnmount(()=>{
    clearInterval(fetchStationInterval)
    clearInterval(requestInterval)
    clearInterval(delayInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchGrids) unwatchGrids()
    if(unwatchRender) unwatchRender()
    stations.forEach((station, index)=>{
        station.terminate()
        stations[index] = null
    })
    stations.length = 0
    clearAbnormalList()
    findHypocenter = null
    clearTempHypocenters()
    map.eachLayer(layer=>{
        if(layer.options.pane == 'niedGridPane' || layer.options.pane.includes('niedStationPane')){
            map.removeLayer(layer)
        }
    })
    statusStore.isActive.niedNet = false
})
</script>

<style lang="scss" scoped>

</style>
