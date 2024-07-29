<template>
    <div class="outer">
        <div class="container">
            <div class="mapContainer">
                <div id="mainMap" @wheel="isAutoZoom = false" @dblclick="isAutoZoom = false"></div>
                <div class="eewList">
                    <div class="eew" v-for="source of activeEewList" :key="source" v-show="menuId != 'eqlists'">
                        <div class="bar" :class="getBarClass(eewEvents[source].eqMessage)">{{ eewEvents[source].eqMessage.titleText + ' ' + eewEvents[source].eqMessage.reportNumText }}</div>
                        <div class="info gray">
                            <div class="intensity" :class="eewEvents[source].eqMessage.className">
                                <div :class="eewEvents[source].eqMessage.useShindo?'shindo':'csis'">
                                    {{ formatIntensity(eewEvents[source].eqMessage.maxIntensity) }}
                                </div>
                            </div>
                            <div class="right">
                                <div class="location">{{ eewEvents[source].eqMessage.hypocenter }}</div>
                                <div class="time">{{ eewEvents[source].eqMessage.originTime + (eewEvents[source].useJst?' (UTC+9)':' (UTC+8)') }}</div>
                                <div class="bottom">
                                    <div class="magnitude">{{ 'M' + eewEvents[source].eqMessage.magnitude.toFixed(1) }}</div>
                                    <div class="depth">{{ eewEvents[source].eqMessage.depthText }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="eew" v-for="source of activeEqlistList" :key="source" v-show="menuId != 'eews'">
                        <div class="bar" :class="getBarClass(eqlistEvents[source].eqMessage)">{{ eqlistEvents[source].eqMessage.titleText + ' ' + eqlistEvents[source].eqMessage.reportNumText }}</div>
                        <div class="info gray">
                            <div class="intensity" :class="eqlistEvents[source].eqMessage.className">
                                <div :class="eqlistEvents[source].eqMessage.useShindo?'shindo':'csis'">
                                    {{ formatIntensity(eqlistEvents[source].eqMessage.maxIntensity) }}
                                </div>
                            </div>
                            <div class="right">
                                <div class="location">{{ eqlistEvents[source].eqMessage.hypocenter?eqlistEvents[source].eqMessage.hypocenter:'震源: 調査中' }}</div>
                                <div class="time">{{ eqlistEvents[source].eqMessage.originTime + (eqlistEvents[source].useJst?' (UTC+9)':' (UTC+8)') }}</div>
                                <div class="bottom">
                                    <div class="magnitude">{{ eqlistEvents[source].eqMessage.magnitude?'M' + eqlistEvents[source].eqMessage.magnitude.toFixed(1):'規模: 調査中' }}</div>
                                    <div class="depth">{{ eqlistEvents[source].eqMessage.depthText }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex;">
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.advancedSettings.displayNiedShindo">
                            <div class="shindo-bar gray">最大震度</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(niedMaxShindo, true)">
                                    <div class="shindo">
                                        {{ niedMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.advancedSettings.displayNiedShindo && niedPeriodMaxShindo != '?'">
                            <div class="shindo-bar gray">区间最大</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(niedPeriodMaxShindo, true)">
                                    <div class="shindo">
                                        {{ niedPeriodMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="left-bottom">
                    <div class="nied-update-time" :class="compareTime(niedUpdateTime.slice(0, -6), 9, 10000)?'':'delayed'" v-if="settingsStore.mainSettings.displaySeisNet.nied">
                        強震モニタ: {{ niedUpdateTime.slice(0, -6) }} (UTC+9)
                    </div>
                </div>
                <!-- <div class="countdown" v-if="isDisplayCountdown">
                    <div class="arrive" :class="untilPReach <= 10?'urgent':''">距离P波抵达：{{ formatTime(untilPReach) }}</div>
                    <div class="arrive" :class="untilSReach <= 10?'urgent':''">距离S波抵达：{{ formatTime(untilSReach) }}</div>
                </div> -->
                <el-button
                class="home"
                :icon="HomeFilled"
                v-show="!isAutoZoom"
                @click="handleHome"></el-button>
                <el-menu
                class="menu"
                :default-active="menuId"
                :collapse="true"
                @select="handleMenu">
                    <el-menu-item index="main">
                        <el-icon>
                            <FullScreen></FullScreen>
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="eews">
                        <el-icon>
                            <WarnTriangleFilled></WarnTriangleFilled>
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="eqlists">
                        <el-icon>
                            <InfoFilled></InfoFilled>
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="settings">
                        <el-icon>
                            <Setting></Setting>
                        </el-icon>
                    </el-menu-item>
                </el-menu>
            </div>
            <div class="drawer" v-show="menuId != 'main'">
                <EewComponent v-show="menuId == 'eews'"></EewComponent>
                <SeisNetComponent></SeisNetComponent>
                <EqlistComponent v-show="menuId == 'eqlists'"></EqlistComponent>
                <SettingsComponent v-show="menuId == 'settings'"></SettingsComponent>
            </div>
        </div>
    </div>
</template>

<script setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, toRaw, provide } from 'vue';
import '@/assets/background.css'
import { HomeFilled, FullScreen, WarnTriangleFilled, InfoFilled, Setting } from '@element-plus/icons-vue';
import { useDataStore } from '@/stores/data';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import EewComponent from './EewComponent.vue';
import SeisNetComponent from './SeisNetComponent.vue';
import EqlistComponent from './EqlistComponent.vue';
import SettingsComponent from './SettingsComponent.vue';
import { EewEvent, EqlistEvent } from '@/classes/EewEqlistClasses';
import { compareTime, setClassName } from '@/utils/Utils';

const settingsStore = useSettingsStore()
let map, baseMap
let eewMarkerPane, eqlistMarkerPane, wavePane, waveFillPane
const isValidUserLatLng = computed(()=>settingsStore.mainSettings.userLatLng.every(item=>item !== ''))
const isDisplayUser = computed(()=>isValidUserLatLng.value && settingsStore.mainSettings.displayUser)
const userLatLng = computed(()=>settingsStore.mainSettings.userLatLng.map(val=>Number(val)))
let userMarker
const isValidViewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.every(item=>item !== ''))
const viewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.map(val=>Number(val)))
const zoomLevel = computed(()=>settingsStore.mainSettings.defaultZoom)
const menuId = ref('main')
const handleHome = ()=>{
    isAutoZoom.value = true
    setView()
}
const handleMenu = (index)=>{
    menuId.value = index
    setTimeout(() => {
        map.invalidateSize()
        handleHome()
    }, 0);  //语句推迟到容器大小变化后再执行
}
provide('handleMenu', handleMenu)
provide('handleHome', handleHome)
const niedUpdateTime = ref('')
const niedMaxShindo = ref('?')
const niedPeriodMaxShindo = ref('?')
provide('niedUpdateTime', niedUpdateTime)
provide('niedMaxShindo', niedMaxShindo)
provide('niedPeriodMaxShindo', niedPeriodMaxShindo)
const isAutoZoom = ref(true)
const dataStore = useDataStore()
const statusStore = useStatusStore()
const eewEvents = {
    jmaEew: null,
    cwaEew: null,
    scEew: null,
    fjEew: null,
}  //使用reactive()时会导致类中计算属性失效，原因不明
const eqlistEvents = {
    jmaEqlist: null,
    cencEqlist: null,
}
const activeEewList = computed(()=>{
    let list = []
    for(let source in eewEvents){
        if(statusStore.isActive[source]) list.push(source)
    }
    return list
})
const activeEqlistList = computed(()=>{
    let list = []
    for(let source in eqlistEvents){
        if(statusStore.isActive[source]) list.push(source)
    }
    return list
})
const formatIntensity = (intensity)=>intensity.replace('強', '+').replace('弱', '-').replace('不明', '?')
const getBarClass = (eqMessage)=>{
    if(eqMessage.isEew){
        if(eqMessage.isCanceled) return 'gray'
        else if(eqMessage.isWarn) return 'red'
        else return 'orange'
    }
    return 'gray'
}
onMounted(()=>{
    map = L.map('mainMap', {attributionControl: false})
    //傻逼Leaflet
    L.Marker.prototype._animateZoom = function (opt) {
        if (!this._map) {
            return;
        }
        const pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
        this._setPos(pos);
    }
    statusStore.map = map
    map.removeControl(map.zoomControl)
    map.createPane('basePane')
    map.getPane('basePane').style.zIndex = 0
    map.createPane('waveFillPane')
    waveFillPane = map.getPane('waveFillPane')
    waveFillPane.style.zIndex = 5
    for(let i = -1; i <= 20; i++){
        map.createPane(`stationPane${i}`)
        map.getPane(`stationPane${i}`).style.zIndex = i + 10
    }
    map.createPane('gridPane')
    map.getPane('gridPane').style.zIndex = 50
    map.createPane('wavePane')
    wavePane = map.getPane('wavePane')
    wavePane.style.zIndex = 100
    map.createPane('userPane')
    map.getPane('userPane').style.zIndex = 150
    map.createPane('eewMarkerPane')
    eewMarkerPane = map.getPane('eewMarkerPane')
    eewMarkerPane.style.zIndex = 200
    map.createPane('eqlistMarkerPane')
    eqlistMarkerPane = map.getPane('eqlistMarkerPane')
    eqlistMarkerPane.style.zIndex = 200
    loadBaseMap(toRaw(dataStore.geojson.global))
    map.setView([0, 0], 2)
    map.on('dragstart', ()=>{
        isAutoZoom.value = false
    })
    if(isDisplayUser.value){
        userMarker = L.circleMarker(userLatLng.value, {
            radius: 8,
            fillOpacity: 0.5,
            weight: 2,
            pane: 'userPane',
        })
        userMarker.addTo(map)
    }
    for(let source in eewEvents){
        watch(()=>statusStore.eqMessages[source], (newVal)=>{
            if(statusStore.isActive[source]){
                if(!newVal.isCanceled){
                    if(!eewEvents[source]){
                        eewEvents[source] = new EewEvent(source, map, newVal)
                        eewEvents[source].renderStart()
                    }
                    else{
                        eewEvents[source].update(newVal)
                    }
                }
                else{
                    eewEvents[source].handleCancel(newVal)
                }
                if(isAutoZoom.value) setView()
            }
        }, { deep: true })
        watch(()=>statusStore.isActive[source], (newVal)=>{
            if(!newVal && eewEvents[source]){
                eewEvents[source].renderStop()
                eewEvents[source] = null
            }
        })
    }
    for(let source in eqlistEvents){
        watch(()=>statusStore.eqMessages[source], (newVal)=>{
            if(!eqlistEvents[source]){
                eqlistEvents[source] = new EqlistEvent(source, map, newVal)
                eqlistEvents[source].setMark()
            }
            else{
                eqlistEvents[source].update(newVal)
                eqlistEvents[source].setMark()
            }
            if(isAutoZoom.value) setView()
        }, { deep: true })
    }
})
const setView = ()=>{
    const bounds = L.latLngBounds([])
    map.eachLayer(layer=>{
        if(menuId.value != 'eqlists'){
            if(layer.options.pane == 'wavePane' || layer.options.pane == 'gridPane'){
                if(layer.getBounds){
                    bounds.extend(layer.getBounds())
                }
                else if(layer.getLatLng){
                    bounds.extend(layer.getLatLng())
                }
            }
        }
        else if(activeEqlistList.value == false){
            if(layer.options.pane == 'eqlistMarkerPane'){
                if(layer.getBounds){
                    bounds.extend(layer.getBounds())
                }
                else if(layer.getLatLng){
                    bounds.extend(layer.getLatLng())
                }
            }
        }
    })
    if(menuId.value != 'eqlists'){
        activeEewList.value.forEach(source=>{
            if(eewEvents[source]) bounds.extend(eewEvents[source].hypoLatLng.value)
        })
    }
    if(menuId.value != 'eews'){
        activeEqlistList.value.forEach(source=>{
            if(eqlistEvents[source]){
                if(eqlistEvents[source].isValidHypo.value){
                    bounds.extend(eqlistEvents[source].hypoLatLng.value)
                }
                else{
                    bounds.extend([46, 148])
                    bounds.extend([23.5, 122])
                }
            }
        })
    }
    if(bounds.isValid()) map.fitBounds(bounds, {maxZoom: 8, minZoom: 4, padding:[50, 50]})
    else if(isValidViewLatLng.value) map.setView(viewLatLng.value, zoomLevel.value)
    else if(isValidUserLatLng.value) map.setView(userLatLng.value, zoomLevel.value)
    else map.setView([38.1, 104.6], zoomLevel.value)
}
provide('setView', setView)
provide('isAutoZoom', isAutoZoom)
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
watch(()=>dataStore.geojson.global, (newVal)=>{
    loadBaseMap(toRaw(newVal))
})
let returnMainTimer, time
const resetMainTimer = ()=>{
    clearTimeout(returnMainTimer)
    returnMainTimer = setTimeout(() => {
        handleMenu('main')
    }, time * 1000);
}
watch(menuId, (newVal)=>{
    document.removeEventListener('mousemove', resetMainTimer)
    if(newVal == 'main'){
        clearTimeout(returnMainTimer)
    }
    else{
        document.addEventListener('mousemove', resetMainTimer)
    }
    if(newVal == 'eews'){
        time = 60
        resetMainTimer()
        eqlistMarkerPane.style.display = 'none'
    }
    else{
        eqlistMarkerPane.style.display = 'block'
    }
    if(newVal == 'eqlists'){
        time = 30
        resetMainTimer()
        eewMarkerPane.style.display = 'none'
        wavePane.style.display = 'none'
        waveFillPane.style.display = 'none'
    }
    else{
        eewMarkerPane.style.display = 'block'
        wavePane.style.display = 'block'
        waveFillPane.style.display = 'block'
    }
    if(newVal == 'settings'){
        time = 60
        resetMainTimer()
    }
})
let autoZoomInterval
watch(isAutoZoom, (newVal)=>{
    if(newVal){
        autoZoomInterval = setInterval(() => {
            setView()
        }, 1000);
    }
    else{
        clearInterval(autoZoomInterval)
    }
}, { immediate: true })
watch([isDisplayUser, userLatLng], ()=>{
    if(userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker)
    if(isDisplayUser.value){
        userMarker = L.circleMarker(userLatLng.value, {
            radius: 8,
            fillOpacity: 0.5,
            weight: 2,
            pane: 'userPane',
        })
        userMarker.addTo(map)
    }
})
watch(()=>(statusStore.isActive.jmaEew || statusStore.isActive.niedNet), newVal=>{
    if(newVal){
        if(niedPeriodMaxShindo.value == '?'){
            niedPeriodMaxShindo.value = '0'
        }
    }
    else{
        niedPeriodMaxShindo.value = '?'
    }
})
onBeforeUnmount(()=>{
    clearInterval(autoZoomInterval)
    clearTimeout(returnMainTimer)
    document.removeEventListener('mousemove', resetMainTimer)
})
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    height: 100vh;
    .container{
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        .mapContainer{
            height: 100%;
            position: relative;
            #mainMap{
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
            .eewList{
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 500;   // >=400才会显示在地图上方？
                .eew{
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
                    .shindo-bar{
                        width: 100px;
                        height: 30px;
                        border-right: black 1px solid;
                        border-bottom: black 1px solid;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 18px;
                        font-weight: 500;
                    }
                    .info{
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        .intensity{
                            width: 100px;
                            height: 100px;
                            border-right: black 1px solid;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            .shindo{
                                font-size: 60px;
                                text-align: center;
                                letter-spacing: -5px;
                                padding-right: 5px;
                            }
                            .shindo::first-letter{
                                font-size: 80px;
                                vertical-align: top;
                            }
                            .csis{
                                font-size: 80px;
                                text-align: center;
                                letter-spacing: -5px;
                                padding-right: 5px;
                            }
                        }
                        .right{
                            width: 350px;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-around;
                            .location{
                                display: flex;
                                align-items: center;
                                font-size: 28px;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                                overflow: hidden;
                            }
                            .time{
                                display: flex;
                                align-items: center;
                                font-size: 22px;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                                overflow: hidden;
                            }
                            .bottom{
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                .magnitude{
                                    font-size: 22px;
                                }
                                .depth{
                                    font-size: 22px;
                                }
                            }
                        }
                    }
                }
                .realtime{
                    width: 100px;
                    border-right: 0px;
                }
            }
            .left-bottom{
                display: flex;
                flex-direction: column;
                position: absolute;
                bottom: 0;
                left: 0;
                z-index: 500;
                .nied-update-time{
                    color: #ffffff;
                    font-size: 18px;
                    background-color: #333;
                }
                .delayed{
                    color: red;
                }
                .countdown{
                    position: absolute;
                    width: 220px;
                    height: 80px;
                    background-color: #cfcfcf;
                    bottom: 0;
                    left: 0;
                    z-index: 500;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    align-items: center;
                    border: black 1px solid;
                    border-bottom: 0px;
                    border-left: 0px;
                    pointer-events: none;
                    user-select: none;
                    font-size: 20px;
                    .urgent{
                        color: red;
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
            .menu{
                position: absolute;
                right: 1px;
                top: 1px;
                z-index: 500;
                border-radius: 10px;
                overflow: hidden;
            }
        }
        .drawer{
            height: 100%;
            width: 450px;
            overflow: auto;
        }
    }
}
</style>