<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import Http from '@/utils/Http';
import axios from 'axios';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls, chimeUrls, iconUrls } from '@/utils/Urls';
import { getTimeNumberString, getShindoFromChar, playSound, sendMyNotification, calcTimeDiff, focusWindow } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NiedStation } from '@/classes/StationClasses';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const stationList = ref([])
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
let adjStationIds = {}
const activeStations = computed(()=>{
    let list = []
    stations.forEach(station=>{
        if(station.isActive) list.push(station.id)
    })
    return list
})
const grids = computed(()=>{
    let grids = []
    activeStations.value.forEach(id=>{
        const latLng = stationList.value[id].map(l=>Math.ceil(l + 0.05) - 0.05)
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
const getData = async (url)=>{
    try {
        const res = await axios.get(url)
        return res
    }
    catch (err){
        if(delay.value <= maxDelay - 100) delay.value += 100
    }
}
const update = ()=>{
    if(stationList.value.length == stations.length && stations.length == stationData.value.length){
        let maxChar = ''
        for(let i = 0; i < stationList.value.length; i++){
            stations[i].update(stationData.value[i])
            if(stationData.value[i] > maxChar) maxChar = stationData.value[i]
        }
        niedMaxShindo.value = getShindoFromChar(maxChar)
        const possibleStations = stations.filter(station=>station.activity > 0)
        const activeStations = new Set()
        const checkedStations = new Set()
        possibleStations.forEach(station=>{
            if(!checkedStations.has(station)){
                const nearbyStations = adjStationIds[station.id].map(id=>stations[id]).filter(station=>station.level > -1)
                const possibleNearbyStations = nearbyStations.filter(station=>station.activity > 0)
                const numThres = nearbyStations.length <= 3 ? 1 : nearbyStations.length <= 10 ? 2 : 3
                const activityThres = 7.5 + 0.5 * nearbyStations.length
                const nearbyActivity = possibleNearbyStations.reduce((sum, station)=>sum + station.activity, 0)
                if(possibleNearbyStations.length >= numThres && nearbyActivity >= activityThres){
                    chainActivate(station, activeStations, checkedStations)
                }
            }
        })
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
let requestInterval, delayInterval
onMounted(()=>{
    Http.get(seisNetUrls.nied.stationList).then(res=>{
        stationList.value = res.items
        siteConfigId.value = res.siteConfigId
    })
    requestInterval = setInterval(() => {
        const time = getTimeNumberString(9, -delay.value)
        const date = time.slice(0, 8)
        getData(`${seisNetUrls.nied.stationData}/${date}/${time}.json`).then(res=>{
            if(res?.status == 200){
                const data = res.data
                if(data.realTimeData.siteConfigId == siteConfigId.value){
                    stationData.value = data.realTimeData.intensity.split('')
                    const timeDiff = calcTimeDiff(data.realTimeData.dataTime.slice(0, -6), 9, niedUpdateTime.value, 9)
                    if(timeDiff > 1000){
                        const popNum = Math.floor(timeDiff / 1000) - 1
                        stations.forEach(station=>{
                            station.recentLevel.splice(-popNum, popNum)
                        })
                    }
                    if(timeDiff > 8000){
                        stations.forEach(station=>{
                            station.isActive = false
                        })
                    }
                    if(delay.value > maxDelay && timeDiff < 0){
                        stations.forEach(station=>{
                            station.recentLevel = []
                            station.isActive = false
                        })
                    }
                    if(delay.value > maxDelay && timeDiff < 0 || timeDiff > 0){
                        niedUpdateTime.value = data.realTimeData.dataTime.slice(0, -6)
                        update()
                    }
                }
                else if(siteConfigId.value){
                    ElMessage({
                        message: '站点数据已更新，正在重新加载…',
                        type: 'warning',
                    })
                    settingsStore.mainSettings.displaySeisNet.nied = false
                    settingsStore.mainSettings.displaySeisNet.niedDelay = 0
                    setTimeout(() => {
                        settingsStore.mainSettings.displaySeisNet.nied = true
                    }, 1000);
                }
            }
        })
    }, 500);
})
let unwatchStationList, unwatchGrids, unwatchDisplayShindo, unwatchHideNoData
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        map.on('zoomend', renderAll)
        unwatchStationList = watch(stationList, newVal=>{
            if(newVal.length > 0){
                newVal.forEach((latLng, index)=>{
                    const station = reactive(new NiedStation(map, index, latLng, 'c'))
                    stations.push(station)
                })
                let latLngs = []
                for(let i = 0; i < newVal.length; i++){
                    latLngs[i] = L.latLng(newVal[i])
                }
                for(let i = 0; i < newVal.length; i++){
                    adjStationIds[i] = []
                    for(let j = 0; j < newVal.length; j++){
                        const distance = latLngs[i].distanceTo(latLngs[j]) / 1000
                        if(distance <= 30) adjStationIds[i].push(j)
                    }
                }
            }
        }, { immediate: true })
        unwatchGrids = watch(grids, (newVal)=>{
            map.eachLayer(layer=>{
                if(layer.options.pane == 'gridPane') map.removeLayer(layer)
            })
            newVal.forEach(item=>{
                const color = item.level <= 7?'green':(item.level <= 13?'yellow':'red')
                L.rectangle([item.latLng, item.latLng.map(l=>l - 0.99)], {
                    color,
                    fill: false,
                    weight: 2,
                    pane: 'gridPane',
                    interactive: false
                }).addTo(map)
                if(item.level > periodMaxLevel.value) periodMaxLevel.value = item.level
            })
            niedPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
            if(newVal.length > 0){
                statusStore.isActive.niedNet = true
                if(isAutoZoom.value) setView()
            }
            else{
                statusStore.isActive.niedNet = false
            }
        })
        unwatchDisplayShindo = watch(()=>settingsStore.advancedSettings.displayNiedShindo, ()=>{
            renderAll()
        })
        unwatchHideNoData = watch(()=>settingsStore.mainSettings.displaySeisNet.hideNoData, ()=>{
            renderAll()
        })
    }
}, { immediate: true })
watch(()=>(statusStore.isActive.jmaEew || statusStore.isActive.niedNet), newVal=>{
    if(newVal){
        if(periodMaxLevel.value == -1){
            periodMaxLevel.value = 0
            niedPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
        }
    }
    else{
        periodMaxLevel.value = -1
        niedPeriodMaxShindo.value = getShindoFromChar(String.fromCharCode(periodMaxLevel.value + 100))
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
    }
    else{
        shake1Notified = false
        shake2Notified = false
        focused = false
    }
})
watch(()=>settingsStore.mainSettings.displaySeisNet.niedDelay, newVal=>{
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
    clearInterval(requestInterval)
    clearInterval(delayInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    if(unwatchGrids) unwatchGrids()
    if(unwatchDisplayShindo) unwatchDisplayShindo()
    if(unwatchHideNoData) unwatchHideNoData()
    stations.forEach((station, index)=>{
        station.terminate()
        stations[index] = null
    })
    stations.length = 0
    map.eachLayer(layer=>{
        if(layer.options.pane == 'gridPane' || layer.options.pane.includes('stationPane')){
            map.removeLayer(layer)
        }
    })
})
</script>

<style lang="scss" scoped>

</style>