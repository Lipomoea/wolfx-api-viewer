<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import Http from '@/classes/Http';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls, iconUrls } from '@/utils/Urls';
import { playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromInstShindo, stampToTime, getShindoFromLevel } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { simpleIcon, TremStation } from '@/classes/StationClasses';
import { useTimeStore } from '@/stores/time';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()

Object.assign(seisNetUrls, JSON.parse(localStorage.getItem('tremUrl'))?.seisNetUrls)
const stationList = reactive({})
let stationData
const stations = reactive({})
let map
const delay = computed(()=>settingsStore.mainSettings.displaySeisNet.delay * 60000)
const tremMaxShindo = inject('tremMaxShindo')
const tremUpdateTime = inject('tremUpdateTime')
const tremPeriodMaxShindo = inject('tremPeriodMaxShindo')
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
const activeStationIds = computed(()=>{
    const list = []
    Object.keys(stations).forEach(id=>{
        if(stations[id].isActive) list.push(id)
    })
    return list
})
let decimal = [0, 0]
const grids = computed(()=>{
    let grids = {}
    activeStationIds.value.forEach(id=>{
        const latLng = stations[id].latLng.map((l, index) => Math.round(l - decimal[index]) + decimal[index])
        const level = stations[id].level
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
let pendingRender = false
const update = ()=>{
    const render = document.visibilityState === 'visible'
    if(!render) pendingRender = true
    let maxInst = -3.1
    let first = null
    Object.keys(stations).forEach(id=>{
        if(id in stationData){
            const alert = !!stationData[id].alert
            const intensity = alert ? stationData[id].I : stationData[id].i
            stations[id].update(intensity, alert, render)
            if(alert && !statusStore.isActive.tremNet && (!first || intensity > first.intensity)) {
                first = stations[id]
            }
            if(intensity > maxInst) maxInst = intensity
        }
        else stations[id].update(-3.1, false)
    })
    if(first) decimal = first.latLng.map(val => Math.round((val + 180) % 1 * 10) / 10)
    tremMaxShindo.value = getShindoFromInstShindo(maxInst)
}
const renderAll = ()=>{
    Object.keys(stations).forEach(id=>{
        stations[id].render()
    })
}
const clearReactiveObject = (obj) => {
    if(obj) for(let key in obj) delete obj[key]
}
let fetchStationInterval, requestInterval
const fetchStationList = async () => {
    try {
        const res = await Http.get(seisNetUrls?.trem.stationList + `?time=${Date.now()}`)
        if(res && JSON.stringify(res) != JSON.stringify(stationList)){
            clearReactiveObject(stationList)
            Object.assign(stationList, res)
        }
    } catch (err) {
        console.log(err);
    }
}
onMounted(()=>{
    fetchStationInterval = setInterval(fetchStationList, 180 * 1000);
    fetchStationList()
    requestInterval = setInterval(async () => {
        try {
            const time = timeStore.getTimeStamp() - delay.value
            const res = await Http.get(stationDataUrl.value + (delay.value > 0 ? `/${Math.round(time / 1000)}` : `?time=${time}`), { timeout: 10000 })
            if(res && Object.keys(res).length > 0){
                stationData = res.station
                const timeString = stampToTime(res.time, 8)
                const timeDiff = calcTimeDiff(timeString, 8, tremUpdateTime.value, 8)
                if(delay.value > 0 && timeDiff < 0 || timeDiff > 0){
                    tremUpdateTime.value = timeString
                    update()
                }
            }
        } catch (err) {
            console.log(err);
        }
    }, 1000);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && pendingRender) {
            pendingRender = false
            renderAll()
        }
    })
})
let unwatchStationList, unwatchGrids, unwatchRender
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        map.on('zoomend', renderAll)
        unwatchStationList = watch(stationList, newVal=>{
            if(Object.keys(newVal).length > 0){
                Object.keys(stations).forEach(id=>{
                    stations[id].terminate()
                    delete stations[id]
                })
                map.eachLayer(layer=>{
                    if(layer.options.pane.includes('tremStationPane')){
                        map.removeLayer(layer)
                    }
                })
                Object.keys(newVal).forEach(id=>{
                    const info = newVal[id].info.slice(-1)[0]
                    const latLng = [info.lat, info.lon]
                    const station = reactive(new TremStation(map, id, latLng, -3.1, false))
                    stations[id] = station
                })
            }
        }, { immediate: true })
        unwatchGrids = watch(grids, (newVal)=>{
            for(let key in newVal) {
                const item = newVal[key]
                const color = item.level <= 7 ? 'green' : item.level <= 13 ? 'yellow' : 'red'
                if(!(key in gridRects)) {
                    const layer = L.rectangle([item.latLng.map(l => l - 0.495), item.latLng.map(l => l + 0.495)], {
                        color,
                        weight: 2,
                        fill: false,
                        pane: 'tremGridPane',
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
            tremPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
            statusStore.isActive.tremNet = Object.keys(newVal).length > 0
        }, { immediate: true })
        unwatchRender = watch(
            ()=>`${settingsStore.mainSettings.displaySeisNet.style}
            |${settingsStore.mainSettings.displaySeisNet.displayTremShindo}
            |${settingsStore.mainSettings.displaySeisNet.hideNoData}
            |${simpleIcon.value}
            |${settingsStore.mainSettings.displaySeisNet.displayShindo0}`, 
            renderAll
        )
    }
}, { immediate: true })
watch(()=>(statusStore.isActive.cwaEew || statusStore.isActive.tremNet), newVal=>{
    if(newVal){
        if(periodMaxLevel == -1){
            periodMaxLevel = 0
            tremPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
        }
    }
    else{
        periodMaxLevel = -1
        tremPeriodMaxShindo.value = getShindoFromLevel(periodMaxLevel)
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
                sendMyNotification('檢測到震動', 
                    '請注意搖晃。', 
                    iconUrls.caution, 
                    settingsStore.mainSettings.muteNotification)
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendMyNotification('檢測到強震動', 
                    '請警戒強烈搖晃。', 
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
const stationDataUrl = computed(() => seisNetUrls?.trem.stationData.replace('api-2', settingsStore.mainSettings.displaySeisNet.tremApi))
onBeforeUnmount(()=>{
    clearInterval(fetchStationInterval)
    clearInterval(requestInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    if(unwatchGrids) unwatchGrids()
    if(unwatchRender) unwatchRender()
    Object.keys(stations).forEach(id=>{
        stations[id].terminate()
        delete stations[id]
    })
    map.eachLayer(layer=>{
        if(layer.options.pane == 'tremGridPane' || layer.options.pane.includes('tremStationPane')){
            map.removeLayer(layer)
        }
    })
})
</script>

<style lang="scss" scoped>

</style>