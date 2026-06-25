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
import { playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromInstShindo, stampToTime, getShindoFromLevel, exactRound } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { simpleIcon, TremStation } from '@/classes/StationClasses';
import { TremStationCanvasLayer } from '@/classes/StationCanvasLayer';
import { useTimeStore } from '@/stores/time';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()

Object.assign(seisNetUrls, JSON.parse(localStorage.getItem('tremUrl'))?.seisNetUrls)
const stationList = reactive({})
let stationData
const stations = reactive({})
let stationCanvasLayer = null
let map
const delay = computed(()=>settingsStore.mainSettings.displaySeisNet.delay * 60000)
const tremMaxShindo = inject('tremMaxShindo')
const tremUpdateTime = inject('tremUpdateTime')
const tremPeriodMaxShindo = inject('tremPeriodMaxShindo')
const tremPeriodBarClass = inject('tremPeriodBarClass')
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
const activeStationIds = computed(() => Object.keys(stations).filter(id => stations[id].isActive))
let decimal = [0, 0]
const gridRects = {}
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
    if(render && settingsStore.mainSettings.useCanvasRenderer) renderAll()
    if(first) decimal = first.latLng.map(val => exactRound((val + 180) % 1, 2))
    tremMaxShindo.value = getShindoFromInstShindo(maxInst)
}
const renderAll = ()=>{
    if(settingsStore.mainSettings.useCanvasRenderer) {
        stationCanvasLayer?.redraw()
        return
    }
    Object.keys(stations).forEach(id=>{
        stations[id].render()
    })
}
const initStationCanvasLayer = () => {
    if(!settingsStore.mainSettings.useCanvasRenderer) return
    if(!map || stationCanvasLayer || Object.keys(stations).length === 0) return
    stationCanvasLayer = new TremStationCanvasLayer(stations).addTo(map)
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
        initStationCanvasLayer()
        map.on('zoomend', renderAll)
        unwatchStationList = watch(stationList, newVal=>{
            if(Object.keys(newVal).length > 0){
                Object.keys(stations).forEach(id=>{
                    stations[id].terminate()
                    delete stations[id]
                })
                map.eachLayer(layer=>{
                    if(layer.options.pane?.includes('tremStationPane')){
                        map.removeLayer(layer)
                    }
                })
                Object.keys(newVal).forEach(id=>{
                    const info = newVal[id].info.slice(-1)[0]
                    const latLng = [info.lat, info.lon]
                    const station = reactive(new TremStation(map, id, latLng, -3.1, false, settingsStore.mainSettings.useCanvasRenderer))
                    stations[id] = station
                })
                initStationCanvasLayer()
                renderAll()
            }
        }, { immediate: true })
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
            tremPeriodBarClass.value = maxColor
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
                sendMyNotification('檢測到震動', 
                    '請注意搖晃。', 
                    iconUrls.caution
                )
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendMyNotification('檢測到強震動', 
                    '請警戒強烈搖晃。', 
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
const stationDataUrl = computed(() => delay.value > 0 ? seisNetUrls?.trem.stationData : seisNetUrls?.trem.stationData.replace('api-2', settingsStore.mainSettings.displaySeisNet.tremApi))
onBeforeUnmount(()=>{
    clearInterval(fetchStationInterval)
    clearInterval(requestInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    if(unwatchGrids) unwatchGrids()
    if(unwatchRender) unwatchRender()
    if(stationCanvasLayer && map?.hasLayer(stationCanvasLayer)) map.removeLayer(stationCanvasLayer)
    stationCanvasLayer = null
    Object.keys(stations).forEach(id=>{
        stations[id].terminate()
        delete stations[id]
    })
    map.eachLayer(layer=>{
        if(layer.options.pane == 'tremGridPane' || layer.options.pane?.includes('tremStationPane')){
            map.removeLayer(layer)
        }
    })
    statusStore.isActive.tremNet = false
})
</script>

<style lang="scss" scoped>

</style>
