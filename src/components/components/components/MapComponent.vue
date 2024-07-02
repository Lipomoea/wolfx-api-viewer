<template>
    <div class="outer">
        <div class="container">
            <div id="map"></div>
        </div>
    </div>
</template>

<script setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Http from '@/utils/Http';
import { ref, computed, onMounted, watch } from 'vue';
import { useTimeStore } from '@/stores/time';
import { calcPassedTime, calcWaveDistance } from '@/utils/Utils';
import travelTimes from '@/utils/TravelTimes';

const props = defineProps({
    eqMessage: Object,
    source: String,
    isActive: Boolean,
})
const timeStore = useTimeStore()
let map, crossMarker
let userLatLng = [30.3, 120.1]
const hypoLatLng = computed(()=>[props.eqMessage.lat, props.eqMessage.lng])
let zoomLevel = 7
let crossIcon = `<svg t="1719226920212" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2481" width="50" height="50"><path d="M602.512147 511.99738l402.747939-402.747939a63.999673 63.999673 0 0 0-90.509537-90.509537L512.00261 421.487843 109.254671 18.749904a63.999673 63.999673 0 0 0-90.509537 90.509537L421.493073 511.99738 18.755134 914.745319a63.999673 63.999673 0 0 0 90.509537 90.509537L512.00261 602.506917l402.747939 402.747939a63.999673 63.999673 0 0 0 90.509537-90.509537z" p-id="2482" fill="#d81e06"></path></svg>`
let crossDivIcon = L.divIcon({
    html: crossIcon,
    className: 'crossDivIcon',
    iconAnchor: [25, 25],
})
onMounted(()=>{
    map = L.map('map', {attributionControl: false})
    map.removeControl(map.zoomControl)
    setView()
    Http.get('/json/global.geo.json')
    .then(data=>{
        L.geoJson(data).addTo(map)
    })
    setMark()
    drawWaves()
})
const setView = ()=>{
    map.setView(hypoLatLng.value, zoomLevel)
}
const blink = ()=>{
    if(!map.hasLayer(crossMarker)){
        crossMarker.addTo(map)
    }
    else{
        map.removeLayer(crossMarker)
    }
}
const setMark = ()=>{
    if(crossMarker && map.hasLayer(crossMarker)) map.removeLayer(crossMarker)
    crossMarker = L.marker(hypoLatLng.value, {icon: crossDivIcon})
    crossMarker.addTo(map)
}
let pWave, sWave
const switchDrawWaves = (time, travelTime)=>{
    let p_reach, p_radius, s_reach, s_radius
    const maxRadius = 2000
    const p_info = calcWaveDistance(travelTime, true, props.eqMessage.depth, time)
    p_reach = p_info.reach
    p_radius = p_info.radius
    const s_info = calcWaveDistance(travelTime, false, props.eqMessage.depth, time)
    s_reach = s_info.reach
    s_radius = s_info.radius
    if(pWave && map.hasLayer(pWave)) map.removeLayer(pWave)
    if(p_radius > 0 && p_radius < maxRadius){
        pWave = L.circle(hypoLatLng.value, {
            color: 'blue',
            weight: 1,
            fillOpacity: 0,
            radius: p_radius * 1000,
        })
        pWave.addTo(map)
    }
    if(sWave && map.hasLayer(sWave)) map.removeLayer(sWave)
    if(s_radius > 0 && s_radius < maxRadius){
        sWave = L.circle(hypoLatLng.value, {
            color: 'red',
            weight: 1,
            fillOpacity: 0.5,
            radius: s_radius * 1000,
        })
        sWave.addTo(map)
    }
}
const drawWaves = ()=>{
    switch(props.source){
        case 'jmaEew':{
            let time = calcPassedTime(props.eqMessage.originTime, 9) / 1000
            switchDrawWaves(time, travelTimes.jma2001)
            break
        }
        default:{
            let time = calcPassedTime(props.eqMessage.originTime, 8) / 1000
            switchDrawWaves(time, travelTimes.jma2001)
            break
        }
    }
}
watch(()=>props.eqMessage, ()=>{
    setMark()
    drawWaves()
})
watch(()=>timeStore.currentTime, ()=>{
    if(props.isActive){
        blink()
        drawWaves()
    }
    else{
        if(!map.hasLayer(crossMarker)){
            crossMarker.addTo(map)
        }
        if(pWave && map.hasLayer(pWave)) map.removeLayer(pWave)
        if(sWave && map.hasLayer(sWave)) map.removeLayer(sWave)
    }
})
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    height: 100%;
    .container{
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: black 1px solid;
        border-radius: 10px;
        overflow: hidden;
        #map{
            width: 100%;
            height: 100%;
            // padding-bottom: 50%;
        }
        .crossDivIcon{
            background: none;
            border: none;
        }
    }
}
</style>