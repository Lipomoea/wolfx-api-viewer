<template>
    <div>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { seisNetUrls } from '@/utils/Urls';
import { playSound, sendMyNotification, calcTimeDiff, focusWindow } from '@/utils/Utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KmaStation, simpleIcon } from '@/classes/StationClasses';
import WebSocketObj from '@/classes/WebSocket';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()

const kmaUpdateTime = inject('kmaUpdateTime')
const kmaMaxInt = inject('kmaMaxInt')
const stationList = reactive([])
const stations = reactive([])
let map
let pendingRender = false
const update = (intensities) => {
    const render = document.visibilityState === 'visible'
    stations.forEach((station, index) => {
        station.update(intensities[index], false, render)
    })
    if(!render) pendingRender = true
    kmaMaxInt.value = Math.max(...intensities, 0).toString()
}
const renderAll = ()=>{
    stations.forEach(station=>{
        station.render()
    })
}
let kmaSocket = null
onMounted(()=>{
    kmaSocket = new WebSocketObj([seisNetUrls.kma])
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
let unwatchStationList, unwatchRender
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
                newVal.forEach((item, index)=>{
                    const latLng = [item.latitude, item.longitude]
                    const station = reactive(new KmaStation(map, index, latLng, -3, false))
                    stations.push(station)
                })
            }
        }, { immediate: true })
        unwatchRender = watch(
            ()=>`${settingsStore.mainSettings.displaySeisNet.style}|${settingsStore.mainSettings.displaySeisNet.displayKmaInt}|${settingsStore.mainSettings.displaySeisNet.hideNoData}|${simpleIcon.value}`, 
            renderAll
        )
    }
}, { immediate: true })
onBeforeUnmount(()=>{
    kmaSocket?.close()
    if(map !== null) map.off('zoomend', renderAll)
    if(unwatchStationList) unwatchStationList()
    if(unwatchRender) unwatchRender()
    stations.forEach(station=>{
        station.terminate()
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