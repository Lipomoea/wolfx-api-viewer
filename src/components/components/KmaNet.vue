<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls } from '@/utils/Urls';
import { playSound, sendMyNotification, calcTimeDiff, focusWindow, getMmiFromKmaLevel } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KmaStation, simpleIcon } from '@/classes/StationClasses';
import WebSocketObj from '@/classes/WebSocket';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()

const kmaUpdateTime = inject('kmaUpdateTime')
const kmaMaxInt = inject('kmaMaxInt')
const kmaPeriodMaxInt = inject('kmaPeriodMaxInt')
const kmaPeriodBarClass = inject('kmaPeriodBarClass')
const handleTempEqlists = inject('handleTempEqlists')
const smartSetView = inject('smartSetView')
let periodMaxLevel = -1
const stationList = reactive([])
const stations = reactive([])
let distMatrix = [[]]
let adjStationIds = {}
let map
let pendingRender = false
let decimal = [0, 0]
const gridRects = {}
const activeStations = computed(()=>{
    const list = []
    stations.forEach(station=>{
        if(station.isActive) list.push(station)
    })
    return list
})
const grids = computed(()=>{
    let grids = {}
    activeStations.value.forEach(station=>{
        const latLng = station.latLng.map((l, index) => Math.round(l - decimal[index]) + decimal[index])
        const level = station.activityLevel
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
const currentMaxShindo = computed(()=>{
    const currentMaxLevel = Math.max(...Object.keys(grids.value).map(key=>grids.value[key].level), -1)
    if(currentMaxLevel == -1) return -1
    else if(currentMaxLevel <= 3) return 0
    else if(currentMaxLevel <= 4) return 1
    else if(currentMaxLevel <= 6) return 2
    else if(currentMaxLevel <= 7) return 3
    else if(currentMaxLevel <= 8) return 4
    else if(currentMaxLevel <= 10) return 5
    else if(currentMaxLevel <= 11) return 6
    else return 7
})
const update = (intensities) => {
    const render = document.visibilityState === 'visible'
    if(!render) pendingRender = true
    let maxInt = 0
    stations.forEach((station, index) => {
        station.update(intensities[index], render)
        if(station.intensity > maxInt) maxInt = station.intensity
    })
    kmaMaxInt.value = maxInt.toString()
    const activeStations = new Set()
    let first = null
    for(let i = 0; i < stationList.length; i++) {
        if(stations[i].activityLevel < 3 && !stations[i].isAscend) continue
        const nearbyStations = adjStationIds[i].map(id => stations[id])
        const nearbyLevels = nearbyStations.map(station => station.activityLevel)
        const nearbyAscends = nearbyStations.map(station => station.isAscend)
        const nearbyLength = nearbyLevels.length
        const count1 = nearbyLevels.filter(level => level >= 3).length
        const count2 = nearbyLevels.filter(level => level >= 4).length
        const counta = nearbyAscends.filter(isAscend => isAscend).length
        const flagl = count1 >= Math.max(0.6 * nearbyLength, 4) || count2 >= Math.max(0.2 * nearbyLength, 2)
        const flaga = counta >= Math.max(0.6 * nearbyLength, 4)
        let flag
        switch(settingsStore.mainSettings.displaySeisNet.kmaSensitivity) {
            case 1: 
                flag = flagl
                break
            case 2: 
                flag = flagl || flaga
                break
            default:
                return
        }
        if(flag) {
            nearbyStations.forEach(station => {
                if((station.activityLevel >= 3 || station.isAscend) && !activeStations.has(station)) {
                    station.setActive()
                    activeStations.add(station)
                    if(!statusStore.isActive.kmaNet && (!first || station.activityLevel > first.activityLevel))
                        first = station
                }
            })
        }
    }
    if(first) decimal = first.latLng.map(val => Math.round((val + 180) % 1 * 10) / 10)
}
const renderAll = ()=>{
    stations.forEach(station=>{
        station.render()
    })
}
let kmaSocket = null
onMounted(()=>{
    kmaSocket = new WebSocketObj([seisNetUrls.kma], ['ping'])
    kmaSocket.setMessageHandler(e => {
        const data = JSON.parse(e.data)
        const type = data?.type
        switch(type) {
            case 'initial_stations': case 'kma_stations_update': {
                const list = data.stations
                if(list && JSON.stringify(list) != JSON.stringify(stationList)) {
                    stationList.length = 0
                    stationList.push(...list)
                }
                break
            }
            case 'initial': case 'update': {
                const Data = data.Data
                const { timestamp, mmi } = Data
                const timeDiff = calcTimeDiff(timestamp, 9, kmaUpdateTime.value, 9)
                if(timeDiff > 0) {
                    if(mmi.length != stations.length) return
                    if(timeDiff > 1000) {
                        const popNum = Math.round(timeDiff / 1000) - 1
                        stations.forEach(station => station.recentLevel.splice(-popNum, popNum))
                    }
                    kmaUpdateTime.value = timestamp
                    update(mmi)
                }
                break
            }
        }
    })
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && pendingRender) {
            pendingRender = false
            renderAll()
        }
    })
})
let unwatchGrids, unwatchStationList, unwatchRender
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        map.on('zoomend', renderAll)
        unwatchStationList = watch(stationList, newVal=>{
            if(newVal.length > 0){
                stations.forEach(station=>{
                    station.terminate()
                })
                stations.length = 0
                map.eachLayer(layer=>{
                    if(layer.options.pane.includes('kmaStationPane')){
                        map.removeLayer(layer)
                    }
                })
                distMatrix = [[]]
                adjStationIds = {}
                let latLngs = []
                for(let i = 0; i < newVal.length; i++){
                    const { latitude, longitude } = newVal[i]
                    latLngs[i] = L.latLng([latitude, longitude])
                }
                for(let i = 0; i < stationList.length; i++){
                    const distances = []
                    distMatrix[i] = []
                    for(let j = 0; j < stationList.length; j++){
                        let distance
                        if(j < i) distance = distMatrix[j][i]
                        else if(j == i) distance = 0
                        else distance = latLngs[i].distanceTo(latLngs[j]) / 1000
                        distMatrix[i][j] = distance
                        if(distance <= 35) distances.push({ id: j, distance })
                    }
                    distances.sort((a, b) => a.distance - b.distance)
                    adjStationIds[i] = distances.map(obj => obj.id)
                }
                newVal.forEach((item, index)=>{
                    const latLng = [item.latitude, item.longitude]
                    const station = reactive(new KmaStation(map, index, latLng, -3, false))
                    stations.push(station)
                })
            }
        }, { immediate: true })
        unwatchGrids = watch(grids, (newVal)=>{
            let maxLevel = -1, maxColor = 'gray'
            for(let key in newVal) {
                const item = newVal[key]
                const color = item.level <= 3 ? 'green' : item.level <= 7 ? 'yellow' : 'red'
                if(item.level > maxLevel) {
                    maxLevel = item.level
                    maxColor = color
                }
                if(!(key in gridRects)) {
                    const layer = L.rectangle([item.latLng.map(l => l - 0.495), item.latLng.map(l => l + 0.495)], {
                        color,
                        weight: 2,
                        fill: false,
                        pane: 'kmaGridPane',
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
            kmaPeriodMaxInt.value = getMmiFromKmaLevel(periodMaxLevel)
            kmaPeriodBarClass.value = maxColor
            statusStore.isActive.kmaNet = Object.keys(newVal).length > 0
        }, { immediate: true })
        unwatchRender = watch(
            ()=>`${settingsStore.mainSettings.displaySeisNet.style}
            |${settingsStore.mainSettings.displaySeisNet.displayKmaInt}
            |${settingsStore.mainSettings.displaySeisNet.hideNoData}
            |${simpleIcon.value}
            |${settingsStore.mainSettings.displaySeisNet.displayShindo0}`, 
            renderAll
        )
    }
}, { immediate: true })
watch(()=>(statusStore.isActive.kmaNet), newVal=>{
    if(newVal){
        if(periodMaxLevel == -1){
            periodMaxLevel = 0
            kmaPeriodMaxInt.value = getMmiFromKmaLevel(periodMaxLevel)
        }
    }
    else{
        periodMaxLevel = -1
        kmaPeriodMaxInt.value = getMmiFromKmaLevel(periodMaxLevel)
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
                sendMyNotification('흔들림을 감지하다', 
                    '흔들림에 주의하세요.', 
                    iconUrls.caution, 
                    settingsStore.mainSettings.muteNotification)
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendMyNotification('강한 흔들림을 감지했습니다', 
                    '강한 흔들림에 주의하세요.', 
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
onBeforeUnmount(()=>{
    kmaSocket?.close()
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchGrids) unwatchGrids()
    if(unwatchStationList) unwatchStationList()
    if(unwatchRender) unwatchRender()
    stations.forEach((station, index)=>{
        station.terminate()
        stations[index] = null
    })
    stations.length = 0
    map.eachLayer(layer=>{
        if(layer.options.pane == 'kmaGridPane' || layer.options.pane.includes('kmaStationPane')){
            map.removeLayer(layer)
        }
    })
})
</script>

<style lang="scss" scoped>

</style>