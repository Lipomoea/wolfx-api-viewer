<template>
    <div class="outer">
        <div class="container">
            <div class="mapContainer">
                <div id="mainMap" @wheel="handleManual" @dblclick="handleManual"></div>
                <div class="eewList">
                    <div class="eew" v-for="(event, index) of activeEewList" :key="index" v-show="menuId != 'eqlists'">
                        <div class="bar" :class="getBarClass(event.eqMessage)">{{ event.eqMessage.titleText + ' ' + event.eqMessage.reportNumText }}</div>
                        <div class="info gray">
                            <div class="intensity" :class="event.eqMessage.className">
                                <div class="intensity-title">{{ event.eqMessage.useShindo?'最大震度':'最大CSIS' }}</div>
                                <div :class="event.eqMessage.useShindo && formatIntensity(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                    {{ formatIntensity(event.eqMessage.maxIntensity) }}
                                </div>
                            </div>
                            <div class="right">
                                <div class="location">{{ event.eqMessage.hypocenter }}</div>
                                <div class="time">{{ event.eqMessage.originTime + (event.useJst?' (UTC+9)':' (UTC+8)') }}</div>
                                <div class="bottom">
                                    <div class="magnitude">{{ event.eqMessage.isAssumption?'仮定震源要素':'M' + event.eqMessage.magnitude.toFixed(1) }}</div>
                                    <div class="depth">{{ event.eqMessage.isAssumption?'':event.eqMessage.depthText }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="eew" v-for="(event, index) of activeEqlistList" :key="index" v-show="menuId != 'eews'">
                        <div class="bar" :class="getBarClass(event.eqMessage)">{{ event.eqMessage.titleText + ' ' + event.eqMessage.reportNumText }}</div>
                        <div class="info gray">
                            <div class="intensity" :class="event.eqMessage.className">
                                <div class="intensity-title">{{ event.eqMessage.useShindo?'最大震度':'最大CSIS' }}</div>
                                <div :class="event.eqMessage.useShindo && formatIntensity(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                    {{ formatIntensity(event.eqMessage.maxIntensity) }}
                                </div>
                            </div>
                            <div class="right">
                                <div class="location">{{ event.eqMessage.hypocenter?event.eqMessage.hypocenter:'震源: 調査中' }}</div>
                                <div class="time">{{ event.eqMessage.originTime + (event.useJst?' (UTC+9)':' (UTC+8)') }}</div>
                                <div class="bottom">
                                    <div class="magnitude">{{ event.eqMessage.magnitude?'M' + event.eqMessage.magnitude.toFixed(1):'規模: 調査中' }}</div>
                                    <div class="depth">{{ event.eqMessage.depthText }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex;">
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.advancedSettings.displayNiedShindo">
                            <div class="shindo-bar gray">NIED实时</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(niedMaxShindo, true)">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="niedMaxShindo != '?'?'shindo':'csis'">
                                        {{ niedMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.advancedSettings.displayNiedShindo && niedPeriodMaxShindo != '?'">
                            <div class="shindo-bar gray">NIED区间</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(niedPeriodMaxShindo, true)">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="niedPeriodMaxShindo != '?'?'shindo':'csis'">
                                        {{ niedPeriodMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="left-bottom">
                    <div class="ws-status">
                        WebSocket状态: 
                        <div class="dot" :class="'s' + wsStatusCode"></div>
                        {{ statusList[wsStatusCode] }}
                    </div>
                    <div class="nied-update-time" :class="isNiedDelayed?'delayed':''" v-if="settingsStore.mainSettings.displaySeisNet.nied">
                        強震モニタ: {{ niedUpdateTime }} (UTC+9)
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
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { useTimeStore } from '@/stores/time';
import EewComponent from './EewComponent.vue';
import SeisNetComponent from './SeisNetComponent.vue';
import EqlistComponent from './EqlistComponent.vue';
import SettingsComponent from './SettingsComponent.vue';
import { verifyUpToDate, setClassName, getClassLevel } from '@/utils/Utils';
import { geojsonUrls } from '@/utils/Urls';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()
let map, jpEewBaseMap
let eewMarkerPane, eqlistMarkerPane, wavePane, waveFillPane, gridPane, cnFaultBasePane, jpEewBasePane
const isValidUserLatLng = computed(()=>settingsStore.mainSettings.userLatLng.every(item=>item !== ''))
const isDisplayUser = computed(()=>isValidUserLatLng.value && settingsStore.mainSettings.displayUser)
const userLatLng = computed(()=>settingsStore.mainSettings.userLatLng.map(val=>Number(val)))
let userMarker
const isValidViewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.every(item=>item !== ''))
const viewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.map(val=>Number(val)))
const zoomLevel = computed(()=>settingsStore.mainSettings.defaultZoom)
const menuId = ref('main')
let autoZoomTimer
let firstMsg = false
let isEewBlink = true
let blinkStatus = true
const handleManual = ()=>{
    isAutoZoom.value = false
    clearTimeout(autoZoomTimer)
    autoZoomTimer = setTimeout(() => {
        handleHome()
    }, 120 * 1000);
}
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
const wsStatusCode = ref(4)
const statusList = ['正在连接', '已连接', '正在断开', '已断开', '未连接', '不使用']
const niedUpdateTime = ref('')
const niedMaxShindo = ref('?')
const niedPeriodMaxShindo = ref('?')
provide('niedUpdateTime', niedUpdateTime)
provide('niedMaxShindo', niedMaxShindo)
provide('niedPeriodMaxShindo', niedPeriodMaxShindo)
const isNiedDelayed = ref(true)
const isAutoZoom = ref(true)
const activeEewList = reactive([])
const eqlistList = reactive([])
const activeEqlistList = computed(()=>eqlistList.filter(event=>event.isActive))
provide('activeEewList', activeEewList)
provide('eqlistList', eqlistList)
const activeSources = computed(()=>
    [...new Set(activeEewList.map(event=>event.eqMessage.source)), ...new Set(activeEqlistList.value.map(event=>event.eqMessage.source))]
)
watch(activeSources, newVal=>{
    for(let source in statusStore.isActive){
        if(source != 'niedNet'){
            if(newVal.includes(source)) statusStore.isActive[source] = true
            else statusStore.isActive[source] = false
        }
    }
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
let unwatchEewBlink
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
    L.Tooltip.prototype._animateZoom = function (e) {
        if (!this._map) {
            return;
        }
        const pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center).round();
        this._setPosition(pos);
    }
    L.Tooltip.prototype._updatePosition = function () {
        if (!this._map) {
            return;
        }
        const pos = this._map.latLngToLayerPoint(this._latlng);
        this._setPosition(pos);
    }
    statusStore.map = map
    map.removeControl(map.zoomControl)
    map.createPane('globalBasePane')
    map.getPane('globalBasePane').style.zIndex = 0
    map.createPane('cnBasePane')
    map.getPane('cnBasePane').style.zIndex = 2
    map.createPane('jpBasePane')
    map.getPane('jpBasePane').style.zIndex = 1
    map.createPane('waveFillPane')
    waveFillPane = map.getPane('waveFillPane')
    waveFillPane.style.zIndex = 10
    map.createPane('jpEewBasePane')
    jpEewBasePane = map.getPane('jpEewBasePane')
    jpEewBasePane.style.zIndex = 20
    map.createPane('cnFaultBasePane')
    cnFaultBasePane = map.getPane('cnFaultBasePane')
    cnFaultBasePane.style.zIndex = 30
    for(let i = -1; i <= 20; i++){
        map.createPane(`stationPane${i}`)
        map.getPane(`stationPane${i}`).style.zIndex = i + 50
    }
    map.createPane('userPane')
    map.getPane('userPane').style.zIndex = 90
    map.createPane('gridPane')
    gridPane = map.getPane('gridPane')
    gridPane.style.zIndex = 100
    map.createPane('wavePane')
    wavePane = map.getPane('wavePane')
    wavePane.style.zIndex = 150
    map.createPane('eewMarkerPane')
    eewMarkerPane = map.getPane('eewMarkerPane')
    eewMarkerPane.style.zIndex = 200
    map.createPane('eqlistMarkerPane')
    eqlistMarkerPane = map.getPane('eqlistMarkerPane')
    eqlistMarkerPane.style.zIndex = 200
    map.setView([0, 0], 2)
    map.on('dragstart', handleManual)
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
    }, { immediate: true })
    loadMaps()
    watch(()=>settingsStore.mainSettings.displayCnFault, newVal=>{
        cnFaultBasePane.style.display = newVal?'block':'none'
    }, { immediate: true })
    intervalEvents()
    setInterval(() => {
        blinkStatus = !blinkStatus
        intervalEvents()
    }, 500);
})
const loadMaps = async () => {
    let msgTimer
    if(!firstMsg){
        msgTimer = setTimeout(() => {
            ElMessage({
                message: '正在加载地图，请稍候…',
                duration: 5000
            })
            firstMsg = true
        }, 1000);
    }
    let promises
    if('caches' in window){
        const cache = await caches.open('geojson')
        promises = Object.keys(geojsonUrls).map(key=>cache.match(geojsonUrls[key]).then(res=>res?.json()))
    }
    else{
        promises = Object.keys(geojsonUrls).map(key=>fetch(geojsonUrls[key]).then(res=>res?.json()))
    }
    const resps = await Promise.all(promises)
    const [global, cn, cn_eew, cn_fault, jp, jp_eew] = resps
    if(global && cn && cn_eew && cn_fault && jp && jp_eew){
        clearTimeout(msgTimer)
        loadBaseMap(global, 'globalBasePane')
        loadBaseMap(cn, 'cnBasePane')
        loadBaseMap(cn_fault, 'cnFaultBasePane', {
            color: 'red',
            opacity: 0.5,
            fillColor: 'red',
            fillOpacity: 0,
            weight: 1,
        })
        loadBaseMap(jp, 'jpBasePane')
        jpEewBaseMap = loadBaseMap(jp_eew, 'jpEewBasePane', {
            opacity: 0,
            fillColor: '#55555500',
            fillOpacity: 1,
            weight: 0,
        })
        watch(jmaWarnArea, (newVal)=>{
            const areas = Object.keys(newVal)
            jpEewBaseMap.eachLayer(layer=>{
                const layerName = layer.feature.properties.name
                if(areas.includes(layerName)){
                    layer.setStyle({
                        fillColor: `var(--${newVal[layerName].className})`
                    })
                }
                else{
                    layer.setStyle({
                        fillColor: '#55555500'
                    })
                }
            })
        }, { deep: true, immediate: true })
    }
    else{
        setTimeout(() => {
            loadMaps()
        }, 2000);
    }
}
const intervalEvents = ()=>{
    gridPane.style.display = blinkStatus && !statusStore.isActive.jmaEew?'block':'none'
    isNiedDelayed.value = !verifyUpToDate(niedUpdateTime.value, 9, 10000)
    wsStatusCode.value = statusStore.allEewSocketObj?statusStore.allEewSocketObj.socket.readyState:4
    if(isEewBlink) eewMarkerPane.style.display = blinkStatus?'block':'none'
}
const setView = ()=>{
    const bounds = L.latLngBounds([])
    map.eachLayer(layer=>{
        if(menuId.value != 'eqlists'){
            if(['waveFillPane', 'eewMarkerPane'].includes(layer.options.pane)){
                if(layer.getBounds){
                    bounds.extend(layer.getBounds())
                }
                else if(layer.getLatLng){
                    bounds.extend(layer.getLatLng())
                }
            }
            if(layer.options.pane == 'gridPane' && !statusStore.isActive.jmaEew){
                if(layer.getBounds){
                    bounds.extend(layer.getBounds())
                }
                else if(layer.getLatLng){
                    bounds.extend(layer.getLatLng())
                }
            }
        }
        else if(activeEqlistList.value.length == 0){
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
    if(menuId.value != 'eews'){
        activeEqlistList.value.forEach(event=>{
            if(event.isValidHypo){
                bounds.extend(event.hypoLatLng)
            }
            else{
                bounds.extend([46, 148])
                bounds.extend([23.5, 122])
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
const loadBaseMap = (geojson, pane, style = {
        color: '#ccc',
        fillColor: '#555',
        fillOpacity: 1,
        weight: 1,
    })=>{
    if(Object.keys(geojson).length != 0){
        const baseMap = L.geoJson(geojson, {
            pane,
            style,
            onEachFeature: pane == 'globalBasePane'?onEachFeature('name_zh'):onEachFeature('name'),
        })
        baseMap.addTo(map)
        return baseMap
    }
}
const onEachFeature = (name)=>(feature, layer)=>{
    layer.bindTooltip(feature.properties[name], {
        permanent: false,
        direction: 'auto'
    })
}
let returnMainTimer, time
const resetMainTimer = ()=>{
    clearTimeout(returnMainTimer)
    returnMainTimer = setTimeout(() => {
        handleMenu('main')
    }, time * 1000);
}
watch(menuId, (newVal)=>{
    document.removeEventListener('mousemove', resetMainTimer)
    isEewBlink = false
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
        jpEewBasePane.style.display = 'none'
    }
    else{
        isEewBlink = true
        wavePane.style.display = 'block'
        waveFillPane.style.display = 'block'
        jpEewBasePane.style.display = 'block'
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
const jmaWarnArea = computed(()=>{
    const jmaEewList = activeEewList.filter(event=>event.eqMessage.source == 'jmaEew' && !event.eqMessage.isCanceled)
    const jmaWarnArea = {}
    jmaEewList.forEach(event=>{
        const warnArea = JSON.parse(event.eqMessage.warnArea)
        warnArea.forEach(item=>{
            if(jmaWarnArea[item.name]){
                if(getClassLevel(item.className) > getClassLevel(jmaWarnArea[item.name].className)){
                    jmaWarnArea[item.name] = item
                }
            }
            else{
                jmaWarnArea[item.name] = item
            }
        })
    })
    return jmaWarnArea
})
onBeforeUnmount(()=>{
    clearInterval(autoZoomInterval)
    clearTimeout(autoZoomTimer)
    clearTimeout(returnMainTimer)
    document.removeEventListener('mousemove', resetMainTimer)
    activeEewList.length = 0
    eqlistList.length = 0
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
                *{
                    cursor: default;
                }
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
                        font-weight: 700;
                    }
                    .info{
                        height: 100px;
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        .intensity{
                            width: 100px;
                            height: 100%;
                            border-right: black 1px solid;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            position: relative;
                            .intensity-title{
                                height: 20px;
                                font-size: 16px;
                                line-height: 1;
                                position: absolute;
                                top: 0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            }
                            .shindo,.csis{
                                height: 80px;
                                text-align: center;
                                letter-spacing: -5px;
                                padding-right: 5px;
                                position: absolute;
                                bottom: 10px;
                            }
                            .shindo{
                                font-size: 60px;
                            }
                            .shindo::first-letter{
                                font-size: 80px;
                                vertical-align: top;
                            }
                            .csis{
                                font-size: 80px;
                            }
                        }
                        .right{
                            width: 350px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-evenly;
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
                font-size: 18px;
                color: #ffffff;
                // background-color: #3333333f;
                .ws-status{
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    .dot{
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        overflow: hidden;
                    }
                    .s0{
                        background-color: yellow;
                    }
                    .s1{
                        background-color: green;
                    }
                    .s2,.s3,.s4{
                        background-color: red;
                    }
                    .s5{
                        background-color: white;
                    }
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