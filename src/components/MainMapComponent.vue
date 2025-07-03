<template>
    <div class="outer">
        <div class="container">
            <div class="mapContainer">
                <div id="mainMap" @wheel.passive="handleManual" @dblclick="handleManual"></div>
                <div class="eewList">
                    <div class="event" v-for="(event, index) of activeEewList" :key="index" v-show="menuId != 'eqlists'">
                        <div class="eew">
                            <div class="bar" :class="getBarClass(event.eqMessage)">{{ event.eqMessage.titleText + ' ' + event.eqMessage.reportNumText }}</div>
                            <div class="info" @click="event.showMenu = !event.showMenu">
                                <div class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">{{ event.eqMessage.useShindo?'最大震度':'最大烈度' }}</div>
                                    <div :class="event.eqMessage.useShindo && formatIntensity(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                        {{ formatIntensity(event.eqMessage.maxIntensity) }}
                                    </div>
                                </div>
                                <div class="right">
                                    <div class="location">{{ event.eqMessage.hypocenter }}</div>
                                    <div class="time">{{ event.eqMessage.originTime + (event.useJst?' (+9)':' (+8)') }}</div>
                                    <div class="bottom">
                                        <div class="magnitude">{{ event.eqMessage.isAssumption?'仮定震源要素':'M' + event.eqMessage.magnitude.toFixed(1) }}</div>
                                        <div class="depth">{{ event.eqMessage.isAssumption?'':event.eqMessage.depthText }}</div>
                                        <div class="type" v-if="settingsStore.advancedSettings.displayApiType">{{ types[event.eqMessage.source][event.eqMessage.type] }}</div>
                                    </div>
                                </div>
                                <div class="eew-buttons" v-if="event.showMenu">
                                    <el-button class="eew-button" type="primary" plain @click="event.mute = !event.mute">{{ event.mute ? '取消静默' : '静默' }}</el-button>
                                    <el-button class="eew-button" type="danger" plain @click.stop="event.terminate(true)">关闭预警</el-button>
                                </div>
                            </div>
                        </div>
                        <div class="countdown eew realtime" v-if="settingsStore.mainSettings.displayCountdown">
                            <div class="shindo-bar" :class="event.countdown <= 0 || event.eqMessage.isCanceled?'gray':event.countdown <= 10?'red':event.countdown <= 60?'orange':'yellow'">{{ event.countdown == -1?'-':Math.ceil(event.countdown) }}秒</div>
                            <div class="info" v-if="event.nearestJmaLoc">
                                <div class="intensity" :class="setClassName(event.userShindo, true)">
                                    <div class="intensity-title">本地震度</div>
                                    <div :class="event.userShindo != '?'?'shindo':'csis'">
                                        {{ event.userShindo }}
                                    </div>
                                </div>
                            </div>
                            <div class="info" v-else>
                                <div class="intensity" :class="setClassName(event.userCsis, false)">
                                    <div class="intensity-title">本地烈度</div>
                                    <div class="csis">
                                        {{ event.userCsis }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="event" v-for="(event, index) of activeEqlistList" :key="index" v-show="menuId != 'eews'">
                        <div class="eew">
                            <div class="bar" :class="getBarClass(event.eqMessage)">{{ event.eqMessage.titleText + ' ' + event.eqMessage.reportNumText }}</div>
                            <div class="info" @click="event.showMenu = !event.showMenu">
                                <div class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">{{ event.eqMessage.useShindo?'最大震度':'最大烈度' }}</div>
                                    <div :class="event.eqMessage.useShindo && formatIntensity(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                        {{ formatIntensity(event.eqMessage.maxIntensity) }}
                                    </div>
                                </div>
                                <div class="right">
                                    <div class="location">{{ event.eqMessage.hypocenter || '震源 調査中' }}</div>
                                    <div class="time">{{ event.eqMessage.originTime + (event.useJst?' (+9)':' (+8)') }}</div>
                                    <div class="bottom">
                                        <div class="magnitude">{{ event.eqMessage.magnitude != -1 ? 'M' + event.eqMessage.magnitude.toFixed(1) : '規模・深さ 調査中' }}</div>
                                        <div class="depth">{{ event.eqMessage.magnitude != -1 ? event.eqMessage.depthText : '' }}</div>
                                        <div class="type" v-if="settingsStore.advancedSettings.displayApiType">{{ types[event.eqMessage.source][event.eqMessage.type] }}</div>
                                    </div>
                                </div>
                                <div class="eew-buttons" v-if="event.showMenu">
                                    <el-button class="eew-button" type="danger" plain @click.stop="event.deactivate()">关闭信息</el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="event" v-if="settingsStore.mainSettings.source.jmaTsunami && statusStore.isActive.jmaTsunami">
                        <div class="eew">
                            <div class="bar" :class="statusStore.tsunamiMessage.jmaTsunami.className">{{ statusStore.tsunamiMessage.jmaTsunami.titleText }}</div>
                            <div class="tsunami-info">
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 3" class="text">大津波警報</div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 3" class="legend tsunami-purple"></div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 2" class="text">津波警報</div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 2" class="legend tsunami-red"></div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 1" class="text">津波注意報</div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 1" class="legend tsunami-yellow"></div>
                            </div>
                        </div>
                    </div>
                    <div class="event">
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.mainSettings.displaySeisNet.displayNiedShindo">
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
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.nied && settingsStore.mainSettings.displaySeisNet.displayNiedShindo && niedPeriodMaxShindo != '?'">
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
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.trem && settingsStore.mainSettings.displaySeisNet.displayTremShindo">
                            <div class="shindo-bar gray">TREM实时</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(tremMaxShindo, true)">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="tremMaxShindo != '?'?'shindo':'csis'">
                                        {{ tremMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.trem && settingsStore.mainSettings.displaySeisNet.displayTremShindo && tremPeriodMaxShindo != '?'">
                            <div class="shindo-bar gray">TREM区间</div>
                            <div class="info">
                                <div class="intensity" :class="setClassName(tremPeriodMaxShindo, true)">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="tremPeriodMaxShindo != '?'?'shindo':'csis'">
                                        {{ tremPeriodMaxShindo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="left-bottom">
                    <div class="legend" v-if="settingsStore.mainSettings.displayLegend && (activeSources.some(source=>source.includes('Eew')) || menuId == 'eqlists')">
                        <div class="single-legend" v-for="(className, index) of classNameArray" :key="index">
                            <div class="align-right">{{ csisArray[index] }}</div>
                            <div class="color" :class="className"></div>
                            <div class="align-left">{{ shindoArray[index] }}</div>
                        </div>
                        <div class="sub-title single-legend">
                            <div class="align-right">烈度</div>
                            <div class="color"></div>
                            <div class="align-left">震度</div>
                        </div>
                        <div class="legend-title">地图颜色</div>
                    </div>
                    <div class="ws-status">
                        WebSocket状态: 
                        <div class="dot" :class="'s' + wolfxRS"></div>
                        <div class="dot" :class="'s' + fanRS"></div>
                        <div class="dot" :class="'s' + p2pquakeRS"></div>
                        <div v-if="settingsStore.advancedSettings.enableGqEew" class="dot" :class="'s' + gqRS"></div>
                    </div>
                    <div class="update-time" :class="settingsStore.mainSettings.displaySeisNet.delay > 0 ? 'replay' : isNiedDelayed ? 'delayed' : ''" v-if="settingsStore.mainSettings.displaySeisNet.nied" @dblclick="resetSeisNetDelay">
                        強震モニタ: {{ niedUpdateTime }} (UTC+9)
                    </div>
                    <div class="update-time" :class="settingsStore.mainSettings.displaySeisNet.delay > 0 ? 'replay' : isTremDelayed ? 'delayed' : ''" v-if="settingsStore.mainSettings.displaySeisNet.trem" @dblclick="resetSeisNetDelay">
                        TREM-Net : {{ tremUpdateTime }} (UTC+8)
                    </div>
                </div>
                <div class="int-list" v-if="settingsStore.mainSettings.displayAreaIntensities">
                    <div class="csis-list" v-show="csisList.length">
                        <div class="row" v-for="(item, index) of csisList" :key="index">
                            <div class="name">{{ item.name }}</div>
                            <div class="int" :class="setClassName(item.intensity, false)">
                                <div class="csis">{{ item.intensity }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="shindo-list" v-show="shindoList.length">
                        <div class="row" v-for="(item, index) of shindoList" :key="index">
                            <div class="name">{{ item.name }}</div>
                            <div class="int" :class="setClassName(item.intensity, true)">
                                <div class="shindo">{{ item.intensity }}</div>
                            </div>
                        </div>
                    </div>
                </div>
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
            <div class="drawer" v-show="(menuId == 'eews' || menuId == 'eqlists') && !settingsStore.mainSettings.hideDrawer || menuId == 'settings'">
                <EewComponent v-show="menuId == 'eews'"></EewComponent>
                <SeisNetComponent v-show="false"></SeisNetComponent>
                <EqlistComponent v-show="menuId == 'eqlists'"></EqlistComponent>
                <SettingsComponent v-show="menuId == 'settings'"></SettingsComponent>
            </div>
        </div>
    </div>
</template>

<script setup>
import L from 'leaflet';
import 'leaflet.vectorgrid'
import 'leaflet/dist/leaflet.css';
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, watchEffect, provide } from 'vue';
import '@/assets/background.css'
import { HomeFilled, FullScreen, WarnTriangleFilled, InfoFilled, Setting } from '@element-plus/icons-vue';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import EewComponent from './EewComponent.vue';
import SeisNetComponent from './SeisNetComponent.vue';
import EqlistComponent from './EqlistComponent.vue';
import SettingsComponent from './SettingsComponent.vue';
import { verifyUpToDate, setClassName, getClassLevel, classNameArray, pointDistToPolygon, csisArray, shindoArray, calcCsisLevel, calcJmaShindoLevel } from '@/utils/Utils';
import { geojsonUrls } from '@/utils/Urls';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';
import { isTauri } from '@tauri-apps/api/core';
import { storeToRefs } from 'pinia';
import { simpleShindo } from '@/classes/StationClasses';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
let map, jpEewBaseMap, cnEewBaseMap, jpTsunamiBaseMap
let eewMarkerPane, eqlistMarkerPane, wavePane, waveFillPane, niedGridPane, tremGridPane, cnFaultBasePane, jpEewBasePane, cnEewBasePane, jpTsunamiBasePane
const defaultLatLng = [38.1, 104.6]
const { isValidUserLatLng, isDisplayUser, numUserLatLng: userLatLng, nearestJmaLoc } = storeToRefs(settingsStore)
let userMarker
const isValidViewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.every(item=>item !== ''))
const viewLatLng = computed(()=>settingsStore.mainSettings.viewLatLng.map(val=>Number(val)))
const zoomLevel = computed(()=>settingsStore.mainSettings.defaultZoom)
const resetSeisNetDelay = () => settingsStore.mainSettings.displaySeisNet.delay = 0
const types = {
    jmaEew: {
        0: 'Wolfx',
        1: 'NIED'
    },
    cwaEew: {
        0: 'Wolfx',
        1: 'TREM'
    },
    ceaEew: {
        1: 'FAN'
    },
    iclEew: {
        0: 'Lipo',
        1: 'FAN'
    },
    scEew: {
        0: 'Wolfx',
        1: 'FAN'
    },
    fjEew: {
        0: 'Wolfx',
        1: 'FAN'
    },
    gqEew: {
        0: 'S',
        1: 'A',
        2: 'B',
        3: 'C',
        4: 'D',
        5: 'E',
        6: 'F'
    },
    jmaEqlist: {
        0: 'P2PQ'
    },
    cwaEqlist: {
        0: 'TREM'
    },
    cencEqlist: {
        1: 'FAN'
    }
}
const tempEqlists = ref(false)
let tempEqlistsTimer
const handleTempEqlists = (time) => {
    if(time) {
        tempEqlists.value = true
        clearTimeout(tempEqlistsTimer)
        tempEqlistsTimer = setTimeout(() => {
            tempEqlists.value = false
        }, time);
    }
    else {
        clearTimeout(tempEqlistsTimer)
        tempEqlists.value = false
    }
}
provide('handleTempEqlists', handleTempEqlists)
const defaultMenuId = computed(() => {
    let defaultMenuId = 'main'
    if(settingsStore.mainSettings.cinemaMode) {
        if(tempEqlists.value) {
            defaultMenuId = 'eqlists'
        }
        else {
            const isActive = statusStore.isActive
            const keys = Object.keys(isActive)
            const isEewOrNetActive = keys.filter(key => key.includes('Eew') || key.includes('Net')).some(key => isActive[key])
            const isEqlistOrTsunamiActive = keys.filter(key => key.includes('Eqlist') || key.includes('Tsunami')).some(key => isActive[key])
            if(isEewOrNetActive && isEqlistOrTsunamiActive) {
                defaultMenuId = 'main'
            }
            else if(isEewOrNetActive) {
                defaultMenuId = 'eews'
            }
            else if(isEqlistOrTsunamiActive) {
                defaultMenuId = 'eqlists'
            }
            else {
                defaultMenuId = settingsStore.mainSettings.eqlistsAsDefault ? 'eqlists' : 'main'
            }
        }
    }
    return defaultMenuId
})
const menuId = ref(defaultMenuId.value)
provide('menuId', menuId)
let autoZoomTimer
let firstMsg = false
let blinkStatus = true
let tsunamiFlickerCounter = -1
const handleManual = ()=>{
    isAutoZoom.value = false
    clearTimeout(autoZoomTimer)
    autoZoomTimer = setTimeout(() => {
        handleHome()
    }, 60 * 1000);
}
const handleHome = ()=>{
    isAutoZoom.value = true
    setView()
}
const handleMenu = (index)=>{
    const shouldHandleHome = menuId.value == index
    if(shouldHandleHome && (index == 'eews' || index == 'eqlists') && isAutoZoom.value) settingsStore.mainSettings.hideDrawer = !settingsStore.mainSettings.hideDrawer
    menuId.value = index
    setTimeout(() => {
        map.invalidateSize()
        if(shouldHandleHome || isAutoZoom.value) handleHome()
    }, 0);  //语句推迟到容器大小变化后再执行
}
provide('handleHome', handleHome)
const wolfxRS = ref(4)
const fanRS = ref(4)
const p2pquakeRS = ref(4)
const gqRS = ref(4)
const niedUpdateTime = ref('1970-01-01 09:00:00')
const niedMaxShindo = ref('?')
const niedPeriodMaxShindo = ref('?')
provide('niedUpdateTime', niedUpdateTime)
provide('niedMaxShindo', niedMaxShindo)
provide('niedPeriodMaxShindo', niedPeriodMaxShindo)
const isNiedDelayed = ref(true)
const tremUpdateTime = ref('1970-01-01 08:00:00')
const tremMaxShindo = ref('?')
const tremPeriodMaxShindo = ref('?')
provide('tremUpdateTime', tremUpdateTime)
provide('tremMaxShindo', tremMaxShindo)
provide('tremPeriodMaxShindo', tremPeriodMaxShindo)
const isTremDelayed = ref(true)
const isAutoZoom = ref(true)
const activeEewList = reactive([])
const eqlistList = reactive([])
const activeEqlistList = computed(()=>eqlistList.filter(event=>event.isActive))
provide('activeEewList', activeEewList)
provide('eqlistList', eqlistList)
const jmaTsunamiWarnArea = computed(() => {
    const warnArea = JSON.parse(statusStore.tsunamiMessage.jmaTsunami.warnArea)
    const jmaTsunamiWarnArea = {}
    warnArea.forEach(item => {
        jmaTsunamiWarnArea[item.name] = item
    })
    return jmaTsunamiWarnArea
})
provide('jmaTsunamiWarnArea', jmaTsunamiWarnArea)
const activeSources = computed(()=>
    [...new Set(activeEewList.map(event=>event.eqMessage.source)), ...new Set(activeEqlistList.value.map(event=>event.eqMessage.source))]
)
watch(activeSources, newVal=>{
    for(let source in statusStore.isActive){
        if(source.includes('Eew') || source.includes('Eqlist')){
            statusStore.isActive[source] = newVal.includes(source)
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
let mainInterval
onMounted(()=>{
    map = L.map('mainMap', {
        attributionControl: false,
        center: defaultLatLng,
        zoom: 4,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true
    })
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
    map.createPane('cnEewBasePane')
    cnEewBasePane = map.getPane('cnEewBasePane')
    cnEewBasePane.style.zIndex = 21
    map.createPane('cnFaultBasePane')
    cnFaultBasePane = map.getPane('cnFaultBasePane')
    cnFaultBasePane.style.zIndex = 30
    map.createPane('jpTsunamiBasePane')
    jpTsunamiBasePane = map.getPane('jpTsunamiBasePane')
    jpTsunamiBasePane.style.zIndex = 40
    for(let i = -1; i <= 20; i++){
        map.createPane(`niedStationPane${i}`)
        map.getPane(`niedStationPane${i}`).style.zIndex = i + 50
        map.createPane(`tremStationPane${i}`)
        map.getPane(`tremStationPane${i}`).style.zIndex = i + 50
    }
    map.createPane('userPane')
    map.getPane('userPane').style.zIndex = 90
    map.createPane('niedGridPane')
    niedGridPane = map.getPane('niedGridPane')
    niedGridPane.style.zIndex = 100
    map.createPane('tremGridPane')
    tremGridPane = map.getPane('tremGridPane')
    tremGridPane.style.zIndex = 100
    map.createPane('wavePane')
    wavePane = map.getPane('wavePane')
    wavePane.style.zIndex = 150
    map.createPane('eewMarkerPane')
    eewMarkerPane = map.getPane('eewMarkerPane')
    eewMarkerPane.style.zIndex = 201
    map.createPane('eqlistMarkerPane')
    eqlistMarkerPane = map.getPane('eqlistMarkerPane')
    eqlistMarkerPane.style.zIndex = 200
    map.on('dragstart', handleManual)
    if(settingsStore.advancedSettings.preventFlickerMode){
        map.on('zoomstart', ()=>{setMapHeight('calc(100% - 1px)');})
        map.on('zoomend', ()=>{setMapHeight('100%');})
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && pendingSetView) {
            pendingSetView = false
            setView(true)
        }
    })
    watchEffect(()=>{
        if(userMarker && map.hasLayer(userMarker)) map.removeLayer(userMarker)
        if(isDisplayUser.value){
            userMarker = L.circleMarker(userLatLng.value, {
                radius: 8,
                fillOpacity: 0.5,
                weight: 2,
                pane: 'userPane',
                interactive: false
            })
            userMarker.addTo(map)
        }
        nearestJmaLoc.value
    })
    loadMaps()
    watch(()=>settingsStore.mainSettings.displayCnFault, newVal=>{
        cnFaultBasePane.style.display = newVal ? 'block' : 'none'
    }, { immediate: true })
    if(settingsStore.mainSettings.cinemaMode) {
        watch(defaultMenuId, newVal => {
            if(menuId.value != 'settings' && isAutoZoom.value) {
                menuId.value = newVal
                setTimeout(() => {
                    map.invalidateSize()
                    setView()
                }, 0);
            }
        }, { immediate: true })
    }
    watch(menuId, (newVal)=>{
        document.removeEventListener('mousemove', resetDefaultMenuTimer)
        if(newVal == defaultMenuId.value){
            clearTimeout(defaultMenuTimer)
        }
        else{
            resetDefaultMenuTimer()
            document.addEventListener('mousemove', resetDefaultMenuTimer)
        }
        if(newVal == 'eews'){
            eqlistMarkerPane.style.opacity = 0.3
            jpTsunamiBasePane.style.opacity = 0.3 * (tsunamiFlickerCounter ? 1 : 0)
        }
        else{
            eqlistMarkerPane.style.opacity = 1
            jpTsunamiBasePane.style.opacity = 1 * (tsunamiFlickerCounter ? 1 : 0)
        }
        if(newVal == 'eqlists'){
            eewMarkerPane.style.opacity = 0.3 * (blinkStatus ? 1 : 0)
            wavePane.style.opacity = 0.3
            waveFillPane.style.opacity = 0.3
            niedGridPane.style.opacity = 0.3 * (blinkStatus && !statusStore.isActive.jmaEew ? 1 : 0)
            tremGridPane.style.opacity = 0.3 * (blinkStatus && !statusStore.isActive.cwaEew ? 1 : 0)
        }
        else{
            eewMarkerPane.style.opacity = 1 * (blinkStatus ? 1 : 0)
            wavePane.style.opacity = 1
            waveFillPane.style.opacity = 1
            niedGridPane.style.opacity = 1 * (blinkStatus && !statusStore.isActive.jmaEew ? 1 : 0)
            tremGridPane.style.opacity = 1 * (blinkStatus && !statusStore.isActive.cwaEew ? 1 : 0)
        }
        simpleShindo.value = newVal == 'eqlists'
    }, { immediate: true })
    intervalEvents()
    mainInterval = setInterval(() => {
        intervalEvents()
    }, 500);
})
const loadMaps = async (retries = 0) => {
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
    if(!isTauri() && ('caches' in window)){
        const cache = await caches.open('geojson')
        promises = Object.keys(geojsonUrls).map(key=>cache.match(geojsonUrls[key]).then(res=>res?.json()))
    }
    else{
        promises = Object.keys(geojsonUrls).map(key=>fetch(geojsonUrls[key]).then(res=>res?.json()))
    }
    const resps = await Promise.all(promises)
    const [global, cn, cn_eew, cn_fault, jp, jp_eew, jp_tsunami] = resps
    if(global && cn && cn_eew && cn_fault && jp && jp_eew && jp_tsunami){
        clearTimeout(msgTimer)
        loadBaseMap(global, 'globalBasePane')
        loadBaseMap(cn, 'cnBasePane')
        cnEewBaseMap = loadBaseMap(cn_eew, 'cnEewBasePane', false, {
            color: '#bbbbbb00',
            opacity: 1,
            fillColor: '#55555500',
            fillOpacity: 1,
            weight: 1,
        })
        loadBaseMap(cn_fault, 'cnFaultBasePane', true, {
            color: 'red',
            opacity: 0.5,
            weight: 1,
        })
        loadBaseMap(jp, 'jpBasePane')
        jpEewBaseMap = loadBaseMap(jp_eew, 'jpEewBasePane', false, {
            color: '#bbbbbb00',
            opacity: 1,
            fillColor: '#55555500',
            fillOpacity: 1,
            weight: 1,
        })
        jpTsunamiBaseMap = loadBaseMap(jp_tsunami, 'jpTsunamiBasePane', false, {
            color: '#ffffff00',
            opacity: 1,
            weight: 6,
        })
        watch(jmaWarnArea, (newVal)=>{
            jpEewBaseMap.eachLayer(layer=>{
                const layerName = layer.feature.properties.name
                if(layerName in newVal){
                    if(layer.options.fillColor != `var(--${newVal[layerName].className})`){
                        layer.setStyle({
                            color: '#bbbbbb',
                            fillColor: `var(--${newVal[layerName].className})`
                        })
                    }
                }
                else{
                    if(layer.options.fillColor != '#55555500'){
                        layer.setStyle({
                            color: '#bbbbbb00',
                            fillColor: '#55555500'
                        })
                    }
                }
            })
        }, { deep: true, immediate: true })
        if(settingsStore.advancedSettings.forceCalcInt){
            watch(cnEewInfoList, newVal=>{
                const newCsisList = {}
                cnEewBaseMap.eachLayer(layer=>{
                    let maxInt = 0
                    newVal.forEach(info=>{
                        const dist = pointDistToPolygon([info.lat, info.lng], layer.feature)
                        const int = Number(calcCsisLevel(info.magnitude, info.depth, dist))
                        if(int > maxInt) maxInt = int
                    })
                    if(maxInt > 0){
                        const className = setClassName(maxInt, false)
                        if(layer.options.fillColor != `var(--${className})`){
                            layer.setStyle({
                                color: '#bbbbbb',
                                fillColor: `var(--${className})`
                            })
                        }
                        const layerName = layer.feature.properties.name
                        if(!(maxInt in newCsisList)) newCsisList[maxInt] = []
                        newCsisList[maxInt].push(layerName)
                    }
                    else{
                        if(layer.options.fillColor != '#55555500'){
                            layer.setStyle({
                                color: '#bbbbbb00',
                                fillColor: '#55555500'
                            })
                        }
                    }
                })
                const newNewCsisList = []
                for(let int = 12; int > 0; int--) {
                    if(newNewCsisList.length >= 50) break
                    newCsisList[int]?.forEach(name => {
                        newNewCsisList.push({
                            name,
                            intensity: int
                        })
                    })
                }
                csisList.value = newNewCsisList.slice(0, 50)
            }, { deep: true, immediate: true })
        }
        if(settingsStore.mainSettings.source.jmaTsunami) {
            watch(jmaTsunamiWarnArea, newVal => {
                jpTsunamiBaseMap.eachLayer(layer => {
                    const layerName = layer.feature.properties.name
                    if(layerName in newVal){
                        if(layer.options.color != `var(--tsunami-${newVal[layerName].className})`){
                            layer.setStyle({
                                color: `var(--tsunami-${newVal[layerName].className})`
                            })
                        }
                    }
                    else{
                        if(layer.options.color != '#ffffff00'){
                            layer.setStyle({
                                color: '#ffffff00'
                            })
                        }
                    }
                })
                if(isAutoZoom.value) setView()
            }, { deep: true, immediate: true })
        }
    }
    else{
        if(retries < 50) {
            setTimeout(() => {
                loadMaps(retries + 1)
            }, 2000);
        }
        else {
            ElMessage({
                message: '地图加载失败，请稍后重试！',
                type: 'error',
                duration: 5000
            })
        }
    }
}
const intervalEvents = ()=>{
    blinkStatus = !blinkStatus
    tsunamiFlickerCounter = (tsunamiFlickerCounter + 1) % 6
    eewMarkerPane.style.opacity = (blinkStatus ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    niedGridPane.style.opacity = (blinkStatus && !statusStore.isActive.jmaEew ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    tremGridPane.style.opacity = (blinkStatus && !statusStore.isActive.cwaEew ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    jpTsunamiBasePane.style.opacity = (tsunamiFlickerCounter ? 1 : 0) * (menuId.value == 'eews' ? 0.3 : 1)
    isNiedDelayed.value = !verifyUpToDate(niedUpdateTime.value, 9, 10000)
    isTremDelayed.value = !verifyUpToDate(tremUpdateTime.value, 8, 10000)
    wolfxRS.value = statusStore.wolfxSocket?.socket.readyState ?? 4
    fanRS.value = statusStore.fanSocket?.socket.readyState ?? 4
    p2pquakeRS.value = statusStore.p2pquakeSocket?.socket.readyState ?? 4
    gqRS.value = statusStore.gqSocket?.socket.readyState ?? 4
}
const setMapHeight = (height) => {
    const mapElement = map.getContainer()
    mapElement.style.height = height
    setTimeout(() => {
        map.invalidateSize()
    }, 0);
}
let pendingSetView = false
const setView = (force = false)=>{
    if(document.visibilityState === 'visible' || force) {
        const bounds = L.latLngBounds([])
        //Eew和SeisNet
        if(menuId.value != 'eqlists'){
            map?.eachLayer(layer=>{
                if(['waveFillPane', 'eewMarkerPane'].includes(layer.options.pane)){
                    if(layer.getBounds){
                        bounds.extend(layer.getBounds())
                    }
                    else if(layer.getLatLng){
                        bounds.extend(layer.getLatLng())
                    }
                }
                if(layer.options.pane == 'niedGridPane' && !statusStore.isActive.jmaEew){
                    if(layer.getBounds){
                        bounds.extend(layer.getBounds())
                    }
                    else if(layer.getLatLng){
                        bounds.extend(layer.getLatLng())
                    }
                }
                if(layer.options.pane == 'tremGridPane' && !statusStore.isActive.cwaEew){
                    if(layer.getBounds){
                        bounds.extend(layer.getBounds())
                    }
                    else if(layer.getLatLng){
                        bounds.extend(layer.getLatLng())
                    }
                }
            })
        }
        //活跃的Eqlist和Tsunami
        if(!bounds.isValid() && menuId.value != 'eews') {
            jpTsunamiBaseMap?.eachLayer(layer => {
                if(statusStore.isActive.jmaTsunami && layer.options.pane.includes('TsunamiBasePane') && layer.options.color && layer.options.color != '#ffffff00') {
                    if(layer.getBounds){
                        bounds.extend(layer.getBounds())
                    }
                    else if(layer.getLatLng){
                        bounds.extend(layer.getLatLng())
                    }
                }
            })
            activeEqlistList.value.forEach(event=>{
                if(event.eqMessage.source == 'jmaEqlist') {
                    if(event.isValidHypo){
                        bounds.extend(event.hypoLatLng)
                    }
                    jpEewBaseMap?.eachLayer(layer => {
                        if(layer.options.fillColor && layer.options.fillColor != '#55555500') {
                            if(layer.getBounds){
                                bounds.extend(layer.getBounds())
                            }
                            else if(layer.getLatLng){
                                bounds.extend(layer.getLatLng())
                            }
                        }
                    })
                    if(!bounds.isValid()) {
                        bounds.extend([46, 148])
                        bounds.extend([23.5, 122])
                    }
                }
                else {
                    if(event.isValidHypo){
                        bounds.extend(event.hypoLatLng)
                    }
                }
            })
        }
        //不活跃的Eqlist
        if(!bounds.isValid() && menuId.value == 'eqlists') {
            map?.eachLayer(layer => {
                if(layer.options.pane == 'eqlistMarkerPane' || 
                layer.options.pane.includes('EewBasePane') && layer.options.fillColor && layer.options.fillColor != '#55555500'){
                    if(layer.getBounds){
                        bounds.extend(layer.getBounds())
                    }
                    else if(layer.getLatLng){
                        bounds.extend(layer.getLatLng())
                    }
                }
            })
        }
        //应用bounds
        if(bounds.isValid()){
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 8,
                animate: true
            })
        }
        //默认视野
        else{
            let targetCenter
            if(isValidViewLatLng.value){
                targetCenter = viewLatLng.value
            }
            else if(isValidUserLatLng.value){
                targetCenter = userLatLng.value
            }
            else{
                targetCenter = defaultLatLng
            }
            map.setView(targetCenter, zoomLevel.value, { animate: true })
        }
    }
    else {
        pendingSetView = true
    }
}
provide('setView', setView)
provide('isAutoZoom', isAutoZoom)
const loadBaseMap = (geojson, pane, useVector = true, style = {
        color: '#ccc',
        fillColor: '#333',
        fillOpacity: 1,
        weight: 1,
        fill: true
    })=>{
    if(Object.keys(geojson).length != 0){
        if(useVector) {
            const vectorGrid = L.vectorGrid.slicer(geojson, {
                pane,
                rendererFactory: L.canvas.tile,
                vectorTileLayerStyles: {
                    sliced: style
                },
                interactive: false
            });
            vectorGrid.addTo(map);
            return vectorGrid;
        }
        else {
            const baseMap = L.geoJson(geojson, {
                pane,
                style,
                onEachFeature
            })
            baseMap.addTo(map)
            return baseMap
        }
    }
}
const onEachFeature = (feature, layer)=>{
    layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: 'top'
    })
}
let defaultMenuTimer
const resetDefaultMenuTimer = ()=>{
    clearTimeout(defaultMenuTimer)
    defaultMenuTimer = setTimeout(() => {
        menuId.value = defaultMenuId.value
        setTimeout(() => {
            map.invalidateSize()
            if(isAutoZoom.value) setView()
        }, 0);
    }, 60 * 1000);
}
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
    const jmaWarnArea = {}
    if(menuId.value != 'eqlists') {
        const jmaEewList = activeEewList.filter(event=>event.eqMessage.source == 'jmaEew' && !event.eqMessage.isCanceled)
        jmaEewList.forEach(event=>{
            const warnArea = JSON.parse(event.eqMessage.warnArea)
            warnArea.forEach(item=>{
                if(!jmaWarnArea[item.name] || getClassLevel(item.className) > getClassLevel(jmaWarnArea[item.name].className)){
                    jmaWarnArea[item.name] = item
                }
            })
        })
        if(settingsStore.advancedSettings.forceCalcInt) {
            for(let id in jmaSeisIntLoc) {
                for(let eew of jpEewInfoList.value) {
                    const { magnitude, depth, lat, lng } = eew
                    if(depth > 150) continue
                    const intensity = calcJmaShindoLevel(magnitude, depth, lat, lng, jmaSeisIntLoc[id], false)
                    if(intensity < '1') continue
                    const name = jmaSeisIntLoc[id].sect
                    const className = setClassName(intensity, true)
                    if(!jmaWarnArea[name] || getClassLevel(className) > getClassLevel(jmaWarnArea[name].className)) {
                        jmaWarnArea[name] = {
                            name,
                            intensity,
                            className
                        }
                    }
                }
            }
        }
    }
    else {
        const jmaEqlistEvent = eqlistList.find(event => event.eqMessage.source == 'jmaEqlist')
        if(!jmaEqlistEvent) return {}
        const warnArea = JSON.parse(jmaEqlistEvent.eqMessage.warnArea)
        warnArea.forEach(point => {
            const { name, className } = point
            if(!name) return
            if(!jmaWarnArea[name] || getClassLevel(className) > getClassLevel(jmaWarnArea[name].className)) {
                jmaWarnArea[name] = point
            }
        })
    }
    return jmaWarnArea
})
const csisList = ref([])
const shindoList = computed(() => {
    const shindoList = {}
    for(let name in jmaWarnArea.value) {
        const intensity = formatIntensity(jmaWarnArea.value[name].intensity)
        if(!(intensity in shindoList)) shindoList[intensity] = []
        shindoList[intensity].push(name)
    }
    const newShindoList = []
    const order = ['7', '6+', '6-', '5+', '5-', '4', '3', '2', '1']
    for(let int of order) {
        if(newShindoList.length >= 50) break
        shindoList[int]?.forEach(name => {
            newShindoList.push({
                name,
                intensity: int
            })
        })
    }
    return newShindoList.slice(0, 50)
})
const jpEewInfoList = computed(()=>{
    const jpEewList = activeEewList.filter(event=>!(event.eqMessage.isCanceled || event.eqMessage.isAssumption))
    const jpEewInfoList = jpEewList.map(event=>{
        const { magnitude, depth, lat, lng } = event.eqMessage
        return { magnitude, depth, lat, lng }
    })
    return jpEewInfoList
})
const cnEewInfoList = computed(()=>{
    const cnEewList = menuId.value == 'eqlists'?eqlistList.filter(event=>!(isNaN(event.eqMessage.magnitude) || isNaN(event.eqMessage.depth) || !event.eqMessage.lat && !event.eqMessage.lng)):activeEewList.filter(event=>!(event.eqMessage.isCanceled || event.eqMessage.isAssumption))
    const cnEewInfoList = cnEewList.map(event=>{
        const { magnitude, depth, lat, lng } = event.eqMessage
        return { magnitude, depth, lat, lng }
    })
    return cnEewInfoList
})
onBeforeUnmount(()=>{
    clearInterval(mainInterval)
    clearInterval(autoZoomInterval)
    clearTimeout(autoZoomTimer)
    clearTimeout(defaultMenuTimer)
    clearTimeout(tempEqlistsTimer)
    document.removeEventListener('mousemove', resetDefaultMenuTimer)
    activeEewList.length = 0
    eqlistList.length = 0
})
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    height: 100%;
    .container{
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        .mapContainer{
            height: 100%;
            position: relative;
            background-color: #222;
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
                background-color: #222;
            }
            .leaflet-grab{
                cursor: default;
            }
            .eewList{
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 500;   // >=400才会显示在地图上方？
                pointer-events: none;
                .event{
                    display: flex;
                }
                .eew{
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border: #3f3f3f 1px solid;
                    border-top: 0px;
                    border-left: 0px;
                    user-select: none;
                    .bar{
                        width: 100%;
                        height: 30px;
                        border-bottom: #3f3f3f 1px solid;
                        display: flex;
                        align-items: center;
                        font-size: 18px;
                        font-weight: 700;
                        padding-left: 5px;
                    }
                    .shindo-bar{
                        width: 100px;
                        height: 30px;
                        border-right: #3f3f3f 1px solid;
                        border-bottom: #3f3f3f 1px solid;
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
                        background-color: #ffffff9f;
                        backdrop-filter: blur(2px);
                        pointer-events: auto;
                        .intensity{
                            width: 100px;
                            height: 100%;
                            border-right: #3f3f3f 1px solid;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            position: relative;
                            pointer-events: none;
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
                            width: 300px;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-evenly;
                            .location{
                                width: 100%;
                                font-size: 28px;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                                overflow: hidden;
                            }
                            .time{
                                width: 100%;
                                font-size: 22px;
                                white-space: nowrap;
                                text-overflow: ellipsis;
                                overflow: hidden;
                            }
                            .bottom{
                                width: 100%;
                                display: flex;
                                align-items: center;
                                gap: 15px;
                                .magnitude{
                                    font-size: 24px;
                                }
                                .depth{
                                    font-size: 22px;
                                }
                                .type {
                                    margin-left: auto;
                                    margin-right: 4px;
                                    font-size: 16px;
                                    color: #7f7f7f;
                                    align-self: flex-end;
                                }
                            }
                        }
                        .eew-buttons {
                            width: 100%;
                            height: 100%;
                            position: absolute;
                            background-color: #ffffff9f;
                            backdrop-filter: blur(10px);
                            display: flex;
                            justify-content: space-evenly;
                            align-items: center;
                            .eew-button {
                                width: 80px;
                                height: 40px;
                            }
                        }
                    }
                    .tsunami-info {
                        width: 410px;
                        height: 100px;
                        padding: 10px 40px;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        column-gap: 50px;
                        align-items: center;
                        background-color: #ffffff9f;
                        backdrop-filter: blur(2px);
                        .text {
                            justify-self: end;
                            text-align: right;
                            font-size: 20px;
                        }
                        .legend {
                            width: 90px;
                            height: 6px;
                        }
                        .tsunami-purple {
                            background-color: var(--tsunami-purple);
                        }
                        .tsunami-red {
                            background-color: var(--tsunami-red);
                        }
                        .tsunami-yellow {
                            background-color: var(--tsunami-yellow);
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
                z-index: 499;
                font-size: 18px;
                color: #ffffff;
                pointer-events: none;
                user-select: none;
                .legend{
                    width: 90px;
                    font-size: 16px;
                    display: flex;
                    flex-direction: column-reverse;
                    justify-content: flex-start;
                    padding: 5px 0px;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: inset 0 0 10px #ffffff3f, 0 4px 10px #0000003f;
                    backdrop-filter: blur(1px);
                    .align-right{
                        text-align: right;
                        padding-right: 2px;
                    }
                    .align-left{
                        text-align: left;
                        padding-left: 2px;
                    }
                    .color{
                        height: 20px;
                    }
                    .single-legend{
                        display: grid;
                        grid-template-columns: 1fr 0.15fr 1fr;
                        justify-content: center;
                        align-items: center;
                        div{
                            line-height: 1em;
                        }
                    }
                    .legend-title{
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        font-size: 18px;
                        margin-bottom: 5px;
                    }
                }
                .ws-status{
                    display: flex;
                    align-items: center;
                    column-gap: 5px;
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
                    .s2,.s3{
                        background-color: red;
                    }
                    .s4{
                        background-color: white;
                    }
                }
                .update-time{
                    pointer-events: auto;
                    cursor: default;
                }
                .delayed{
                    color: red;
                }
                .replay{
                    color: yellow;
                }
            }
            .int-list{
                position: absolute;
                right: 1px;
                top: 236px;
                z-index: 599;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 10px;
                height: calc(100% - 280px);
                overflow: hidden;
                user-select: none;
                pointer-events: none;
                .csis-list,.shindo-list{
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    overflow: hidden;
                    padding: 5px;
                    border-radius: 10px;
                    box-shadow: inset 0 0 10px #ffffff3f, 0 4px 10px #0000003f;
                    backdrop-filter: blur(1px);
                    .row{
                        display: flex;
                        justify-content: space-between;
                        gap: 3px;
                        align-items: center;
                        .name{
                            color: #ffffff;
                            width: 120px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            line-height: 1em;
                        }
                        .int{
                            width: 22px;
                            height: 22px;
                            border-radius: 5px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            pointer-events: none;
                            user-select: none;
                            .csis {
                                font-size: 16px;
                            }
                            .shindo {
                                font-size: 12px;
                            }
                            .shindo::first-letter {
                                font-size: 16px;
                                vertical-align: top;
                            }
                        }
                    }
                }
            }
            .home{
                position: absolute;
                right: 1px;
                bottom: 1px;
                z-index: 600;
                border-radius: 10px;
                overflow: hidden;
                width: 32px;
                height: 32px;
                padding: 0;
            }
            .menu{
                position: absolute;
                right: 1px;
                top: 1px;
                z-index: 600;
                border-radius: 10px;
                overflow: hidden;
                background-color: #ffffff9f;
                backdrop-filter: blur(4px);
            }
        }
        .drawer{
            height: 100%;
            width: 450px;
            overflow: auto;
            z-index: 600;
            background-color: #fff;
        }
    }
}
</style>