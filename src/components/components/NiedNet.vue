<template>
    <div>

    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import Http from '@/utils/Http';
import axios from 'axios';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls } from '@/utils/Urls';
import { getTimeNumberString } from '@/utils/Utils';
import 'leaflet/dist/leaflet.css';
import { NiedStation } from '@/classes/stationClasses';
import { getShindoFromChar } from '@/utils/Utils';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const stationList = ref([])
const stationData = ref([])
const stations = []
const siteConfigId = ref('')
let map
const delay = ref(1500)
const niedMaxShindo = inject('niedMaxShindo')
const niedUpdateTime = inject('niedUpdateTime')

const getData = async (url)=>{
    try {
        const res = await axios.get(url)
        return res
    }
    catch (err){
        if(delay.value <= 2800) delay.value += 200
    }
}

const update = ()=>{
    if(stationList.value.length > 0){
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
    })
    requestInterval = setInterval(() => {
        const time = getTimeNumberString(9, -delay.value)
        const date = time.slice(0, 8)
        getData(`${seisNetUrls.nied.stationData}/${date}/${time}.json`).then(res=>{
            if(res && res.status == 200){
                const data = res.data
                stationData.value = data.realTimeData.intensity.slice('')
                niedUpdateTime.value = data.realTimeData.dataTime
                siteConfigId.value = data.realTimeData.siteConfigId
                update()
            }
        })
    }, 500);
    delayInterval = setInterval(() => {
        delay.value -= 20
    }, 10000);
})
let unwatchStationList
watch(()=>statusStore.map, newVal=>{
    if(newVal !== null){
        map = newVal
        unwatchStationList = watch(stationList, newVal=>{
            newVal.forEach(latLng=>{
                const station = new NiedStation(map, latLng, 'c')
                stations.push(station)
            })
        }, { immediate: true })
        map.on('zoomend', renderAll)
    }
}, { immediate: true })
watch(()=>settingsStore.advancedSettings.displayNiedShindo, ()=>{
    renderAll()
})
onBeforeUnmount(()=>{
    clearInterval(requestInterval)
    clearInterval(delayInterval)
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    stations.forEach((station, index)=>{
        station.terminate()
        stations[index] = null
    })
    stations.length = 0
})
</script>

<style lang="scss" scoped>

</style>