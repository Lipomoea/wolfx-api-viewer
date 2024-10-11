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
import { getTimeNumberString, getShindoFromChar, playSound, sendNotification, calcTimeDiff } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NiedStation } from '@/classes/StationClasses';
import { UnionFind } from '@/classes/Algorithms';

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
const periodMaxShindo = computed(()=>{
    if(periodMaxLevel.value <= 0) return -1
    else if(periodMaxLevel.value <= 7) return 0
    else if(periodMaxLevel.value <= 9) return 1
    else if(periodMaxLevel.value <= 11) return 2
    else if(periodMaxLevel.value <= 13) return 3
    else if(periodMaxLevel.value <= 15) return 4
    else if(periodMaxLevel.value <= 16) return 5
    else if(periodMaxLevel.value <= 17) return 5.5
    else if(periodMaxLevel.value <= 18) return 6
    else if(periodMaxLevel.value <= 19) return 6.5
    else return 7
})
let adjacencyMatrix = []
const activityStations = computed(()=>{
    let list = []
    stations.forEach(station=>{
        if(station.activity > 0) list.push(station.id)
    })
    return list
})
watch(activityStations, (newVal)=>{
    let activeAdjMat = []
    for(let i = 0; i < newVal.length; i++){
        activeAdjMat[i] = []
        for(let j = 0; j < newVal.length; j++){
            activeAdjMat[i][j] = adjacencyMatrix[newVal[i]][newVal[j]]
        }
    }
    const unionFind = new UnionFind(newVal, activeAdjMat)
    const clusters = unionFind.getAllSets()
    for(let setId in clusters){
        let activity = 0
        if(clusters[setId].length > 1){
            const activities = clusters[setId].map(id=>stations[id].activity).sort((a, b)=>b - a)
            activities.forEach(num=>{
                activity += num
            })
            activity += (activities[0] + activities[1])
        }
        else{
            const id = clusters[setId][0]
            if(adjacencyMatrix[id].every(f=>!f)){
                activity = 2 * stations[id].activity
            }
            else activity = stations[id].activity
        }
        if(activity >= 20){
            clusters[setId].forEach(id=>{
                stations[id].setActive()
            })
        }
    }
})
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
                    if(timeDiff > 10000 || timeDiff < 0){
                        stations.forEach(station=>{
                            station.recentLevel = []
                            station.isActive = false
                        })
                    }
                    if(!(delay.value <= maxDelay && timeDiff < 0)){
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
                    adjacencyMatrix[i] = []
                    for(let j = 0; j < newVal.length; j++){
                        if(i < j){
                            const distance = latLngs[i].distanceTo(latLngs[j]) / 1000
                            adjacencyMatrix[i][j] = distance <= 50?true:false
                        }
                        else if(i > j){
                            adjacencyMatrix[i][j] = adjacencyMatrix[j][i]
                        }
                        else{
                            adjacencyMatrix[i][j] = false
                        }
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
                    pane: 'gridPane'
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
let sound0 = false, sound5 = false, sound6 = false
watch(periodMaxShindo, (newVal, oldVal)=>{
    if(newVal > oldVal){
        if(settingsStore.mainSettings.onShake.sound){
            let play = true
            const shindo = Math.floor(newVal)
            if(shindo == 0){
                if(sound0) play = false
                else sound0 = true
            }
            else if(shindo == 5){
                if(sound5) play = false
                else sound5 = true
            }
            else if(shindo == 6){
                if(sound6) play = false
                else sound6 = true
            }
            if(play){
                const url = chimeUrls[soundEffect.value][`shindo${shindo}`]
                playSound(url)
            }
        }
        if(settingsStore.mainSettings.onShake.notification){
            if(newVal >= 1 && newVal <= 3 && !shake1Notified){
                sendNotification('揺れを検出', 
                    '揺れに注意してください。', 
                    iconUrls.caution, 
                    settingsStore.mainSettings.muteNotification)
                shake1Notified = true
            }
            else if(newVal >= 4 && !shake2Notified){
                sendNotification('強い揺れを検出', 
                    '強い揺れに警戒してください。', 
                    iconUrls.warn, 
                    settingsStore.mainSettings.muteNotification)
                shake1Notified = true
                shake2Notified = true
            }
        }
    }
    else{
        shake1Notified = false
        shake2Notified = false
        sound0 = false
        sound5 = false
        sound6 = false
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