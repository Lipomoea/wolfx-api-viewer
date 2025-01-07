<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import Http from '@/classes/Http';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls, chimeUrls, iconUrls } from '@/utils/Urls';
import { getShindoFromChar, playSound, sendMyNotification, calcTimeDiff, focusWindow, getShindoFromInstShindo, stampToTime } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TremStation } from '@/classes/StationClasses';
import { useTimeStore } from '@/stores/time';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()
const stationList = reactive({})
let stationData
const stations = reactive({})
let map
const delay = computed(()=>settingsStore.mainSettings.displaySeisNet.delay * 60000)
const tremMaxShindo = inject('tremMaxShindo')
const tremUpdateTime = inject('tremUpdateTime')
const tremPeriodMaxShindo = inject('tremPeriodMaxShindo')
const periodMaxLevel = ref(-1)
const currentMaxShindo = computed(()=>{
    const currentMaxLevel = Math.max(...grids.value.map(grid=>grid.level), -1)
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
const activeStations = computed(()=>{
    let list = {}
    Object.keys(stations).forEach(id=>{
        if(stations[id].isActive) list[id] = stations[id]
    })
    return list
})
const grids = computed(()=>{
    let grids = []
    Object.keys(activeStations.value).forEach(id=>{
        const latLng = stations[id].latLng.map(l=>Math.ceil(l + 0.05) - 0.05)
        const level = stations[id].level
        let i
        for(i = 0; i < grids.length; i++){
            if(grids[i].latLng[0] == latLng[0] && grids[i].latLng[1] == latLng[1]){
                if(level > grids[i].level) grids[i].level = level
                break
            }
        }
        if(i == grids.length ){
            grids.push({
                latLng,
                level
            })
        }
    })
    return grids
})
const soundEffect = computed(()=>settingsStore.mainSettings.soundEffect)
const setView = inject('setView')
const isAutoZoom = inject('isAutoZoom')
const update = ()=>{
    let maxInst = -3.1
    Object.keys(stations).forEach(id=>{
        if(id in stationData){
            const alert = !!stationData[id].alert
            const intensity = alert ? stationData[id].I : stationData[id].i
            stations[id].update(intensity, alert)
            if(intensity > maxInst) maxInst = intensity
        }
        else stations[id].update(-3.1, false)
    })
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
const fetchStationList = () => {
    Http.get(seisNetUrls.trem.stationList + `?time=${Date.now()}`).then(res=>{
        if(res && JSON.stringify(res) != JSON.stringify(stationList)){
            clearReactiveObject(stationList)
            Object.assign(stationList, res)
        }
    })
}
let listInterval, requestInterval
onMounted(()=>{
    fetchStationList()
    listInterval = setInterval(() => {
        fetchStationList()
    }, 300 * 1000);
    requestInterval = setInterval(() => {
        const time = Date.now() + timeStore.offset - delay.value
        Http.get(seisNetUrls.trem.stationData + (delay.value > 0 ? `/${Math.round(time / 1000)}` : `?time=${time}`)).then(res=>{
            if(res && Object.keys(res).length > 0){
                stationData = res.station
                const timeString = new Date(res.time + 8 * 3600 * 1000).toISOString().slice(0, -5)
                const timeDiff = calcTimeDiff(timeString, 8, tremUpdateTime.value, 8)
                if(delay.value > 0 && timeDiff < 0 || timeDiff > 0){
                    tremUpdateTime.value = timeString
                    update()
                }
            }
        })
    }, 1000);
})
let unwatchStationList, unwatchGrids, unwatchHideNoData
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
            map.eachLayer(layer=>{
                if(layer.options.pane == 'tremGridPane') map.removeLayer(layer)
            })
            newVal.forEach(item=>{
                const color = item.level <= 7?'green':(item.level <= 13?'yellow':'red')
                L.rectangle([item.latLng, item.latLng.map(l=>l - 0.99)], {
                    color,
                    fill: false,
                    weight: 2,
                    pane: 'tremGridPane',
                    interactive: false
                }).addTo(map)
                if(item.level > periodMaxLevel.value) periodMaxLevel.value = item.level
            })
            tremPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
            if(newVal.length > 0){
                statusStore.isActive.tremNet = true
                if(isAutoZoom.value) setView()
            }
            else{
                statusStore.isActive.tremNet = false
            }
        })
        unwatchHideNoData = watch(()=>settingsStore.mainSettings.displaySeisNet.hideNoData, ()=>{
            renderAll()
        })
    }
}, { immediate: true })
watch(()=>(statusStore.isActive.cwaEew || statusStore.isActive.tremNet), newVal=>{
    if(newVal){
        if(periodMaxLevel.value == -1){
            periodMaxLevel.value = 0
            tremPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
        }
    }
    else{
        periodMaxLevel.value = -1
        tremPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
    }
})
let shake1Notified = false, shake2Notified = false
let focused = false
watch(currentMaxShindo, (newVal, oldVal)=>{
    if(newVal > oldVal){
        if(settingsStore.mainSettings.onShake.sound){
            const url = chimeUrls[soundEffect.value][`shindo${newVal}`]
            playSound(url)
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
    }
    else{
        shake1Notified = false
        shake2Notified = false
        focused = false
    }
})
onBeforeUnmount(()=>{
    clearInterval(listInterval)
    clearInterval(requestInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    if(unwatchGrids) unwatchGrids()
    if(unwatchHideNoData) unwatchHideNoData()
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