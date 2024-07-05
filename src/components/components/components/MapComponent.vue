<template>
    <div class="outer">
        <div class="container">
            <div id="map" @wheel="isAutoZoom = false"></div>
            <div class="eew">
                <div class="bar" :class="barClass">{{ props.eqMessage.titleText + ' ' + props.eqMessage.reportNumText }}</div>
                <div class="info gray">
                    <div class="intensity" :class="props.eqMessage.className">
                        <div class="intText">
                            {{ formattedIntensity }}
                        </div>
                    </div>
                    <div class="right">
                        <div class="location">{{ props.eqMessage.hypocenter }}</div>
                        <div class="time">{{ props.eqMessage.originTime + (useJst?' (UTC+9)':' (UTC+8)') }}</div>
                        <div class="bottom">
                            <div class="magnitude">M{{ props.eqMessage.magnitude.toFixed(1) }}</div>
                            <div class="depth">{{ props.eqMessage.depthText }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <el-button
            class="home"
            :icon="HomeFilled"
            v-show="!isAutoZoom"
            @click="handleHome"></el-button>
            <el-button
            class="more"
            v-if="!props.eqMessage.isEew"
            @click="handleMore">查看更多<el-icon class="el-icon--right"><Right /></el-icon></el-button>
        </div>
    </div>
</template>

<script setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, computed, onMounted, onBeforeUnmount, watch, toRaw } from 'vue';
import { calcPassedTime, calcWaveDistance } from '@/utils/Utils';
import travelTimes from '@/utils/TravelTimes';
import '@/assets/background.css'
import { HomeFilled, Right } from '@element-plus/icons-vue';
import { useDataStore } from '@/stores/data';
import router from '@/router';

const props = defineProps({
    eqMessage: Object,
    source: String,
    isActive: Boolean,
})
const useJst = computed(()=>{
    if(props.source.includes('jma')) return true
    else return false
})
const barClass = computed(()=>{
    if(props.eqMessage.isEew){
        if(props.isActive){
            if(props.eqMessage.isCanceled) return 'gray'
            else if(props.eqMessage.isWarn) return 'red'
            else return 'orange'
        }
        else return 'gray'
    }
    else{
        return props.eqMessage.className
    }
})
let map, baseMap, crossMarker
let userLatLng = [30.3, 120.1]
const hypoLatLng = computed(()=>[props.eqMessage.lat, props.eqMessage.lng])
let zoomLevel = 7
let crossIcon = `<svg t="1719226920212" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2481" width="40" height="40"><path d="M602.512147 511.99738l402.747939-402.747939a63.999673 63.999673 0 0 0-90.509537-90.509537L512.00261 421.487843 109.254671 18.749904a63.999673 63.999673 0 0 0-90.509537 90.509537L421.493073 511.99738 18.755134 914.745319a63.999673 63.999673 0 0 0 90.509537 90.509537L512.00261 602.506917l402.747939 402.747939a63.999673 63.999673 0 0 0 90.509537-90.509537z" p-id="2482" fill="#d81e06"></path></svg>`
let crossDivIcon = L.divIcon({
    html: crossIcon,
    className: 'crossDivIcon',
    iconAnchor: [20, 20],
})
const isAutoZoom = ref(true)
const dataStore = useDataStore()
onMounted(()=>{
    map = L.map('map', {attributionControl: false})
    map.removeControl(map.zoomControl)
    map.createPane('basePane')
    map.getPane('basePane').style.zIndex = 0
    map.createPane('wavePane')
    map.getPane('wavePane').style.zIndex = 10
    map.createPane('markerPane')
    map.getPane('markerPane').style.zIndex = 20
    loadBaseMap(toRaw(dataStore.geojson.global))
    map.setView(hypoLatLng.value, zoomLevel)
    map.on('dragstart', ()=>{
        isAutoZoom.value = false
    })
    setMark()
    if(props.eqMessage.isEew && !props.eqMessage.isCanceled) drawWaves()
    setView()
})
const formattedIntensity = computed(()=>props.eqMessage.maxIntensity.replace('強', '+').replace('弱', '-').replace('不明', '?'))
const setView = ()=>{
    let bounds = null
    if(pWave && map.hasLayer(pWave)){
        bounds = pWave.getBounds()
    }
    else if(sWave && map.hasLayer(sWave)){
        bounds = sWave.getBounds()
    }
    if(bounds){
        map.fitBounds(bounds, {
            maxZoom: 8,
            minZoom: 5,
        })
    }
    else map.setView(hypoLatLng.value, zoomLevel)
}
const handleHome = ()=>{
    isAutoZoom.value = true
    setView()
}
const handleMore = ()=>{
    router.push('/eq-history')
}
const blinkOnce = ()=>{
    if(!map.hasLayer(crossMarker)){
        crossMarker.addTo(map)
    }
    else{
        map.removeLayer(crossMarker)
    }
}
const setMark = ()=>{
    if(crossMarker && map.hasLayer(crossMarker)) map.removeLayer(crossMarker)
    crossMarker = L.marker(hypoLatLng.value, {icon: crossDivIcon, pane: 'markerPane'})
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
            color: 'white',
            weight: 1,
            fillOpacity: 0,
            radius: p_radius * 1000,
            pane: 'wavePane',
        })
        pWave.addTo(map)
    }
    if(sWave && map.hasLayer(sWave)) map.removeLayer(sWave)
    if(s_radius > 0 && s_radius < maxRadius){
        sWave = L.circle(hypoLatLng.value, {
            color: props.eqMessage.isWarn?'red':'orange',
            weight: 1,
            fillOpacity: 0.3,
            radius: s_radius * 1000,
            pane: 'wavePane',
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
let drawWavesInterval, blinkInterval
const goStatic = ()=>{
    if(drawWavesInterval) clearInterval(drawWavesInterval)
    if(blinkInterval) clearInterval(blinkInterval)
    if(crossMarker && !map.hasLayer(crossMarker)) crossMarker.addTo(map)
    if(pWave && map.hasLayer(pWave)) map.removeLayer(pWave)
    if(sWave && map.hasLayer(sWave)) map.removeLayer(sWave)
}
const loadBaseMap = (geojson)=>{
    if(Object.keys(geojson).length != 0){
        if(baseMap && map.hasLayer(baseMap)) map.removeLayer(baseMap)
        baseMap = L.geoJson(geojson, {
            pane: 'basePane',
            style: {
                color: '#ccc',
            }
        })
        baseMap.addTo(map)
    }
}
watch(()=>dataStore.geojson, (newVal)=>{
    loadBaseMap(toRaw(newVal.global))
})
watch(()=>props.eqMessage, (newVal)=>{
    setMark()
    if(newVal.isEew && !newVal.isCanceled){
        drawWaves()
    }
    else{
        goStatic()
    }
}, { deep: true })
watch(()=>props.isActive, (newVal)=>{
    if(newVal && props.eqMessage.isEew && !props.eqMessage.isCanceled){
        drawWavesInterval = setInterval(() => {
            drawWaves()
        }, 100);
        blinkInterval = setInterval(() => {
            blinkOnce()
        }, 500);
    }
    else{
        goStatic()
    }
}, { immediate: true })
let autoZoomInterval
watch(isAutoZoom, (newVal)=>{
    if(newVal){
        autoZoomInterval = setInterval(() => {
            setView()
        }, 10000);
    }
    else{
        if(autoZoomInterval) clearInterval(autoZoomInterval)
    }
}, { immediate: true })
onBeforeUnmount(()=>{
    if(drawWavesInterval) clearInterval(drawWavesInterval)
    if(blinkInterval) clearInterval(blinkInterval)
    if(autoZoomInterval) clearInterval(autoZoomInterval)
})
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    height: 100%;
    .container{
        width: 100%;
        height: 100%;
        position: relative;
        #map{
            width: 100%;
            height: 100%;
        }
        .crossDivIcon{
            background: none;
            border: none;
        }
        .leaflet-container{
            background-color: #333;
        }
        .leaflet-grab {
            cursor: default;
        }
        .eew{
            position: absolute;
            top: 0;
            left: 0;
            z-index: 500;   // >=400才会显示在地图上方？
            display: flex;
            flex-direction: column;
            align-items: center;
            border: black 1px solid;
            border-top: 0px;
            border-left: 0px;
            pointer-events: none;
            user-select: none;
            .bar{
                width: 100%;
                height: 30px;
                border-bottom: black 1px solid;
                display: flex;
                align-items: center;
                font-size: 18px;
                font-weight: 700;
                padding-left: 5px;
            }
            .info{
                display: flex;
                gap: 10px;
                align-items: center;
                .intensity{
                    width: 80px;
                    height: 80px;
                    border-right: black 1px solid;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    .intText{
                        font-size: 50px;
                        text-align: center;
                        letter-spacing: -10px;
                        padding-right: 10px;
                    }
                    .intText::first-letter{
                        font-size: 70px;
                        vertical-align: top;
                    }
                }
                .right{
                    width: 300px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    .location{
                        font-size: 1.3em;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        overflow: hidden;
                    }
                    .time{
                        font-size: 1.1em;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        overflow: hidden;
                    }
                    .bottom{
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        .magnitude{
                            font-size: 1.2em;
                        }
                        .depth{
                            font-size: 1.1em;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            overflow: hidden;
                        }
                    }
                }
            }
        }
        .home{
            position: absolute;
            right: 1px;
            bottom: 1px;
            z-index: 500;
            border-radius: 10px;
            overflow: hidden;
            width: 20px;
        }
        .more{
            position: absolute;
            right: 1px;
            top: 1px;
            z-index: 500;
            border-radius: 10px;
            overflow: hidden;
            padding: 8px;
        }
    }
}
</style>