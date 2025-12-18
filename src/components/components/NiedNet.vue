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
import { getTimeNumberString, playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromLevel } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NiedStation, simpleIcon } from '@/classes/StationClasses';

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
let adjStationIds = {}
let expireSeconds = {}
let distMatrix = [[]]
const activeStations = computed(()=>{
    const list = []
    stations.forEach(station=>{
        if(station.isActive) list.push(station)
    })
    return list
})
let decimal = [0, 0]
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
const gridRects = {}
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
const activityThresArr = [Infinity, 9, 12, 14, 15, 16, 16]
const update = ()=>{
    if(stationList.length == stations.length && stations.length == stationData.value.length){
        const render = document.visibilityState === 'visible'
        if(!render) pendingRender = true
        let maxLevel = -1
        for(let i = 0; i < stationList.length; i++){
            stations[i].update(stationData.value[i], render)
            if(stations[i].level > maxLevel) maxLevel = stations[i].level
        }
        niedMaxShindo.value = getShindoFromLevel(maxLevel)
        const possibleStations = stations.filter(station=>station.activity > 0)
        const activeStations = new Set()
        const checkedStations = new Set()
        possibleStations.forEach(station=>{
            if(!checkedStations.has(station)){
                if(station.isActive && station.ascend > 0) {
                    chainActivate(station, activeStations, checkedStations)
                    return
                }
                const nearbyStations = adjStationIds[station.id].map(id=>stations[id]).filter(station=>station.level > -1)
                const possibleNearbyStations = nearbyStations.filter(station=>station.activity > 0)
                const nearbyActiveNum = possibleNearbyStations.length - possibleNearbyStations.filter(station => station.ascend <= 1 && !station.isActive).length / 2
                let numThres, activityThres
                switch(settingsStore.mainSettings.displaySeisNet.niedSensitivity) {
                    case 1:
                        numThres = 3
                        activityThres = activityThresArr[nearbyStations.length] + 2
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
                    const nearbyActivity = nearbyStations.reduce((sum, nearbyStation, index) => 
                        index >= 3 && distMatrix[station.id][nearbyStation.id] > 15 
                        ? sum + nearbyStation.activity / 2 
                        : sum + nearbyStation.activity, 0
                    ) + numActivity
                    if (nearbyActivity >= activityThres) {
                        chainActivate(station, activeStations, checkedStations)
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
            if(first) decimal = first.latLng.map(val => Math.round((val + 180) % 1 * 10) / 10)
        }
        activeStations.forEach(station=>{
            station.setActive()
        })
    }
}
const chainActivate = (station, activeStations, checkedStations)=>{
    const pendingStations = new Set([station])
    while(pendingStations.size > 0){
        const currentStation = pendingStations.values().next().value
        pendingStations.delete(currentStation)
        checkedStations.add(currentStation)
        if(currentStation.activity > 0){
            activeStations.add(currentStation)
            adjStationIds[currentStation.id].forEach(id=>{
                const neighbor = stations[id]
                if(!checkedStations.has(neighbor)) pendingStations.add(neighbor)
            })
        }
    }
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
        if(res && res.siteConfigId) {
            clearInterval(fetchStationInterval)
            stationList = res.items
            siteConfigId.value = res.siteConfigId
            if(stationList.length > 0){
                let latLngs = []
                for(let i = 0; i < stationList.length; i++){
                    latLngs[i] = L.latLng(stationList[i])
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
                        else distance = latLngs[i].distanceTo(latLngs[j]) / 1000
                        distMatrix[i][j] = distance
                        if(distance <= 30) distances.push({ id: j, distance })
                        else if(distance <= candidate.distance) candidate = { id: j, distance }
                    }
                    if(distances.length <= 1 && candidate.id !== null) {
                        distances.push(candidate)
                    }
                    distances.sort((a, b) => a.distance - b.distance).splice(nearbyLength)
                    adjStationIds[i] = distances.map(obj => obj.id)
                    const maxDist = distances[distances.length - 1].distance
                    expireSeconds[i] = Math.max(Math.round(maxDist / 3.5), 5)
                }
                stationList.forEach((latLng, index)=>{
                    const station = reactive(new NiedStation(map, index, latLng, 'c', expireSeconds[index]))
                    stations.push(station)
                })
            }
        }
    } catch (err) {
        console.log(err);
    }
}
onMounted(()=>{
    fetchStationInterval = setInterval(fetchStationList, 5000);
    fetchStationList()
    requestInterval = setInterval(async () => {
        try {
            const time = getTimeNumberString(9, -delay.value)
            const date = time.slice(0, 8)
            const res = await getData(`${seisNetUrls.nied.stationData}/${date}/${time}.json`)
            if(res?.status == 200) {
                const data = res.data
                if(data.realTimeData.siteConfigId == siteConfigId.value) {
                    stationData.value = data.realTimeData.intensity.split('')
                    const timeDiff = calcTimeDiff(data.realTimeData.dataTime.slice(0, -6), 9, niedUpdateTime.value, 9)
                    if(timeDiff > 1000) {
                        const popNum = Math.round(timeDiff / 1000) - 1
                        stations.forEach(station => {
                            station.recentLevel.splice(-popNum, popNum)
                            station.expireSeconds = Math.max(station.expireSeconds - popNum, station.defaultExpireSeconds)
                        })
                    }
                    if(timeDiff > 10000) {
                        stations.forEach(station => {
                            station.isActive = false
                        })
                    }
                    if(delay.value > maxDelay && timeDiff < 0) {
                        stations.forEach(station => {
                            station.level = -1
                            station.recentLevel = []
                            station.expireSeconds = station.defaultExpireSeconds
                            station.isActive = false
                        })
                    }
                    if(delay.value > maxDelay && timeDiff < 0 || timeDiff > 0) {
                        niedUpdateTime.value = data.realTimeData.dataTime.slice(0, -6).replace('T', ' ')
                        update()
                    }
                }
                else if(siteConfigId.value){
                    ElMessage({
                        message: '站点数据已更新，正在重新加载…',
                        type: 'warning',
                    })
                    settingsStore.mainSettings.displaySeisNet.niedNet = false
                    settingsStore.mainSettings.displaySeisNet.delay = 0
                    setTimeout(() => {
                        settingsStore.mainSettings.displaySeisNet.niedNet = true
                    }, 1500);
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
            for(let key in newVal) {
                const item = newVal[key]
                const color = item.level <= 7 ? 'green' : item.level <= 13 ? 'yellow' : 'red'
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
watch(() => Object.keys(grids.value).length, smartSetView)
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
                    iconUrls.caution, 
                    settingsStore.mainSettings.muteNotification)
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendMyNotification('強い揺れを検出', 
                    '強い揺れに警戒してください。', 
                    iconUrls.warn, 
                    settingsStore.mainSettings.muteNotification)
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
    map.eachLayer(layer=>{
        if(layer.options.pane == 'niedGridPane' || layer.options.pane.includes('niedStationPane')){
            map.removeLayer(layer)
        }
    })
})
</script>

<style lang="scss" scoped>

</style>