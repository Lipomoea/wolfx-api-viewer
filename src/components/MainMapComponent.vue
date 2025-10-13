<template>
    <div class="outer">
        <div class="container">
            <div class="mapContainer">
                <div id="mainMap" @wheel.passive="handleManual" @dblclick="handleManual"></div>
                <div class="eewList">
                    <div class="event" v-for="(event, index) of currentEewInfoItems" :key="index" v-show="menuId != 'eqlists'">
                        <div class="eew">
                            <div class="bar" :class="getBarClass(event)">
                                <div><WarnTriangleFilled style="width: 1em; height: 1em; margin-right: 0.25em;" />{{ event.eqMessage.titleText + ' ' + event.eqMessage.reportNumText }}</div>
                                <div v-show="activeEewList.length > 1">{{ activeEewList.findIndex(e => e == event) + 1 }}/{{ activeEewList.length }}</div>
                            </div>
                            <div class="info" @click="() => {
                                event.handleClick();
                                infoPageCounter = infoPageCounter - infoPageCounter % 10;
                            }">
                                <div v-if="event.eqMessage.useShindo" class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="formatShindo(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                        {{ formatShindo(event.eqMessage.maxIntensity) }}
                                    </div>
                                </div>
                                <div v-else class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">最大烈度</div>
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-75': event.eqMessage.maxIntensity == '8',
                                        'scale-9': event.eqMessage.maxIntensity == '7' || event.eqMessage.maxIntensity == '12'
                                    }">
                                        {{ formatCsis(event.eqMessage.maxIntensity, settingsStore.mainSettings.useRomanCsis) }}
                                    </div>
                                </div>
                                <div class="right">
                                    <div class="location">{{ event.eqMessage.hypocenter }}</div>
                                    <div class="time">{{ event.eqMessage.originTime + ` (${formatTimeZone(event.eqMessage.timeZone)})` }}</div>
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
                            <div class="shindo-bar" @dblclick="event.showPCountdown = !event.showPCountdown"
                            :class="event.showPCountdown ? 'blue' 
                            : event.countdown < 0 || event.eqMessage.isCanceled ? 'gray' 
                            : event.countdown <= 15 ? 'red' 
                            : event.countdown <= 60 ? 'orange' 
                            : 'yellow'">
                                {{ event.countdown == -1 ? '-' : Math.ceil(event.showPCountdown ? event.pCountdown : event.countdown) }}秒
                            </div>
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
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-75': event.userCsis == '8',
                                        'scale-9': event.userCsis == '7' || event.userCsis == '12'
                                    }">
                                        {{ formatCsis(event.userCsis, settingsStore.mainSettings.useRomanCsis) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="event" v-for="(event, index) of currentEqlistInfoItems" :key="index" v-show="menuId != 'eews'">
                        <div class="eew">
                            <div class="bar" :class="getBarClass(event)">
                                <div><InfoFilled style="width: 1em; height: 1em; margin-right: 0.25em;" />{{ event.eqMessage.titleText }}</div>
                                <div v-show="displayEqlistList.length > 1">{{ displayEqlistList.findIndex(e => e == event) + 1 }}/{{ displayEqlistList.length }}</div>
                            </div>
                            <div class="info" @click="() => {
                                event.handleClick();
                                infoPageCounter = infoPageCounter - infoPageCounter % 10;
                            }">
                                <div v-if="event.eqMessage.useShindo" class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">最大震度</div>
                                    <div :class="formatShindo(event.eqMessage.maxIntensity) != '?'?'shindo':'csis'">
                                        {{ formatShindo(event.eqMessage.maxIntensity) }}
                                    </div>
                                </div>
                                <div v-else class="intensity" :class="event.eqMessage.className">
                                    <div class="intensity-title">最大烈度</div>
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-75': event.eqMessage.maxIntensity == '8',
                                        'scale-9': event.eqMessage.maxIntensity == '7' || event.eqMessage.maxIntensity == '12'
                                    }">
                                        {{ formatCsis(event.eqMessage.maxIntensity, settingsStore.mainSettings.useRomanCsis) }}
                                    </div>
                                </div>
                                <div class="right">
                                    <div class="location">{{ event.eqMessage.hypocenter || '震源 調査中' }}</div>
                                    <div class="time">{{ event.eqMessage.originTime + ` (${formatTimeZone(event.eqMessage.timeZone)})` }}</div>
                                    <div class="bottom">
                                        <div class="magnitude">{{ event.eqMessage.magnitude != -1 ? 'M' + event.eqMessage.magnitude.toFixed(1) : '規模 調査中' }}</div>
                                        <div class="depth">{{ event.eqMessage.depth != -1 ? event.eqMessage.depthText : '' }}</div>
                                        <div class="type" v-if="settingsStore.advancedSettings.displayApiType">{{ types[event.eqMessage.source][event.eqMessage.type] }}</div>
                                    </div>
                                </div>
                                <div class="eew-buttons" v-if="event.showMenu">
                                    <el-button 
                                    class="eew-button" 
                                    type="danger" 
                                    plain 
                                    :disabled="!event.isActive"
                                    @click.stop="() => {
                                        event.deactivate()
                                        if(tempEqlists == event.eqMessage.source) {
                                            tempEqlists = ''
                                        }
                                    }"
                                    >关闭信息</el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="event" v-if="settingsStore.mainSettings.source.nmefcTsunami && statusStore.isActive.nmefcTsunami">
                        <div class="eew" v-show="menuId != 'eews'">
                            <div class="bar" :class="statusStore.tsunamiMessage.nmefcTsunami.className">
                                <div><WarnTriangleFilled style="width: 1em; height: 1em; margin-right: 0.25em;" />{{ statusStore.tsunamiMessage.nmefcTsunami.titleText }}</div>
                            </div>
                            <div class="tsunami-info">
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 3" class="legend tsunami-purple"></div>
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 3" class="text">大海啸警报</div>
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 2" class="legend tsunami-red"></div>
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 2" class="text">海啸警报</div>
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 1" class="legend tsunami-yellow"></div>
                                <div v-show="statusStore.tsunamiMessage.nmefcTsunami.status >= 1" class="text">海啸注意报</div>
                            </div>
                        </div>
                    </div>
                    <div class="event" v-if="settingsStore.mainSettings.source.jmaTsunami && statusStore.isActive.jmaTsunami">
                        <div class="eew" v-show="menuId != 'eews'">
                            <div class="bar" :class="statusStore.tsunamiMessage.jmaTsunami.className">
                                <div><WarnTriangleFilled style="width: 1em; height: 1em; margin-right: 0.25em;" />{{ statusStore.tsunamiMessage.jmaTsunami.titleText }}</div>
                            </div>
                            <div class="tsunami-info">
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 3" class="legend tsunami-purple"></div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 3" class="text">大津波警報</div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 2" class="legend tsunami-red"></div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 2" class="text">津波警報</div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 1" class="legend tsunami-yellow"></div>
                                <div v-show="statusStore.tsunamiMessage.jmaTsunami.status >= 1" class="text">津波注意報</div>
                            </div>
                        </div>
                    </div>
                    <div class="event">
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.niedNet && settingsStore.mainSettings.displaySeisNet.displayNiedShindo">
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
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.niedNet && settingsStore.mainSettings.displaySeisNet.displayNiedShindo && niedPeriodMaxShindo != '?'">
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
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.tremNet && settingsStore.mainSettings.displaySeisNet.displayTremShindo">
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
                        <div class="eew realtime" v-if="settingsStore.mainSettings.displaySeisNet.tremNet && settingsStore.mainSettings.displaySeisNet.displayTremShindo && tremPeriodMaxShindo != '?'">
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
                    <div class="legend" v-if="settingsStore.mainSettings.displayLegend && !settingsStore.mainSettings.disableEewBaseMap && (activeEewList.length > 0 || menuId == 'eqlists')">
                        <div class="single-legend" v-for="(className, index) of classNameArray" :key="index">
                            <div class="align-right">{{ settingsStore.mainSettings.useRomanCsis ? csisRomanArray[index] : csisArray[index] }}</div>
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
                        <div>WebSocket状态: </div>
                        <div :class="'s' + wolfxRS">Wolfx</div>
                        <div :class="'s' + fanRS">FAN</div>
                        <div :class="'s' + p2pquakeRS">P2PQ</div>
                        <div v-if="settingsStore.advancedSettings.enableGqEew" :class="'s' + gqRS">GQ</div>
                    </div>
                    <div class="update-time" :class="settingsStore.mainSettings.displaySeisNet.delay > 0 ? 'replay' : isNiedDelayed ? 'delayed' : ''" v-if="settingsStore.mainSettings.displaySeisNet.niedNet" @dblclick="resetSeisNetDelay">
                        強震モニタ: {{ niedUpdateTime }} (UTC+9)
                    </div>
                    <div class="update-time" :class="settingsStore.mainSettings.displaySeisNet.delay > 0 ? 'replay' : isTremDelayed ? 'delayed' : ''" v-if="settingsStore.mainSettings.displaySeisNet.tremNet" @dblclick="resetSeisNetDelay">
                        TREM-Net : {{ tremUpdateTime }} (UTC+8)
                    </div>
                </div>
                <div class="int-list" v-if="settingsStore.mainSettings.displayAreaIntensities">
                    <div class="csis-list" v-show="csisList.length">
                        <div class="row" v-for="(item, index) of csisList" :key="index">
                            <div class="name">{{ item.name }}</div>
                            <div class="int" :class="setClassName(item.intensity, false)">
                                <div class="csis" :class="{
                                    'roman': settingsStore.mainSettings.useRomanCsis,
                                    'scale-9': item.intensity == '8'
                                }">{{ formatCsis(item.intensity, settingsStore.mainSettings.useRomanCsis) }}</div>
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
                <div class="bottom-right">
                    <div class="mocking" v-if="statusStore.isActive.mockEew" :class="blinkStatus ? 'mock-1' : 'mock-0'">模拟预警中</div>
                    <el-button
                    class="home"
                    :icon="HomeFilled"
                    v-show="!isAutoZoom"
                    @click="handleHome"></el-button>
                </div>
                <el-menu
                class="menu"
                :default-active="menuId"
                :collapse="true"
                @select="handleMenu">
                    <el-menu-item index="main">
                        <el-icon>
                            <FullScreen />
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="eews">
                        <el-icon>
                            <WarnTriangleFilled />
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="eqlists">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                    </el-menu-item>
                    <el-menu-item index="settings">
                        <el-icon>
                            <Setting />
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
import 'leaflet.vectorgrid';
import 'leaflet/dist/leaflet.css';
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, watchEffect, provide } from 'vue';
import '@/assets/background.css'
import { HomeFilled, FullScreen, WarnTriangleFilled, InfoFilled, Setting } from '@element-plus/icons-vue';
import { eewSources, eqlistSources, seisNetSources, tsunamiSources, useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { useTimeStore } from '@/stores/time';
import EewComponent from './EewComponent.vue';
import SeisNetComponent from './SeisNetComponent.vue';
import EqlistComponent from './EqlistComponent.vue';
import SettingsComponent from './SettingsComponent.vue';
import { verifyUpToDate, setClassName, getClassLevel, classNameArray, pointDistToCnArea, csisArray, shindoArray, calcCsisLevel, calcJmaShindoLevel, formatTimeZone, simplifyTopoJson, formatCsis, csisRomanArray } from '@/utils/Utils';
import { topojsonUrls } from '@/utils/Urls';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';
import { isTauri } from '@tauri-apps/api/core';
import { storeToRefs } from 'pinia';
import { simpleShindo } from '@/classes/StationClasses';
import { feature } from 'topojson-client';
import router from '@/router';
import { cnCityLabels, cnProvinceLabels, jpPrefLabels } from '@/utils/Labels';
import terminator from '@joergdietrich/leaflet.terminator';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()
let map, jpEewBaseMap, cnEewBaseMap, jpTsunamiBaseMap, cnTsunamiBaseMap, labelLayer1, labelLayer2, terminatorLayer, terminatorFillLayer, cnFaultBaseMap
let eewMarkerPane, eqlistMarkerPane, wavePane, waveFillPane, niedGridPane, tremGridPane, eewBasePane, tsunamiBasePane, labelPane1, labelPane2
let userMarker
const defaultLatLng = [38.1, 104.6]
const { isValidUserLatLng, isValidViewLatLng, isDisplayUser, nearestJmaLoc } = storeToRefs(settingsStore)
const userLatLng = computed(() => settingsStore.mainSettings.userLatLng)
const viewLatLng = computed(() => settingsStore.mainSettings.viewLatLng)
const zoomLevel = ref(settingsStore.mainSettings.defaultZoom)
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
        0: 'Wolfx',
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
    mockEew: {
        0: 'MOCK'
    },
    jmaEqlist: {
        0: 'P2PQ'
    },
    cwaEqlist: {
        0: 'TREM'
    },
    cencEqlist: {
        0: 'Wolfx',
        1: 'FAN'
    },
    usgsEqlist: {
        1: 'FAN'
    },
    fssnEqlist: {
        1: 'FAN'
    },
}
const tempEqlists = ref('')
let tempEqlistsTimer
const handleTempEqlists = (time, source = '') => {
    if(time && source) {
        tempEqlists.value = source
        clearTimeout(tempEqlistsTimer)
        tempEqlistsTimer = setTimeout(() => {
            tempEqlists.value = ''
        }, time);
    }
    else {
        clearTimeout(tempEqlistsTimer)
        tempEqlists.value = ''
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
            const isEewOrNetActive = [...eewSources, ...seisNetSources, 'mockEew'].some(key => isActive[key])
            const isEqlistOrTsunamiActive = [...eqlistSources, ...tsunamiSources].some(key => isActive[key])
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
const blinkStatus = ref(false)
let tsunamiFlickerCounter = 0
const infoPageCounter = ref(0)
const eventsPerPage = computed(() => (menuId.value == 'main' || menuId.value == 'settings') && (activeEewList.length > 0 && displayEqlistList.value.length > 0) ? 1 : 2)
const eewInfoTotalPages = computed(() => Math.ceil(activeEewList.length / eventsPerPage.value))
const currentEewInfoPage = computed(() => Math.floor(infoPageCounter.value / 10) % eewInfoTotalPages.value)
const currentEewInfoItems = computed(() => activeEewList.slice(eventsPerPage.value * currentEewInfoPage.value, eventsPerPage.value * (currentEewInfoPage.value + 1)))
const eqlistInfoTotalPages = computed(() => Math.ceil(displayEqlistList.value.length / eventsPerPage.value))
const currentEqlistInfoPage = computed(() => Math.floor(infoPageCounter.value / 10) % eqlistInfoTotalPages.value)
const currentEqlistInfoItems = computed(() => displayEqlistList.value.slice(eventsPerPage.value * currentEqlistInfoPage.value, eventsPerPage.value * (currentEqlistInfoPage.value + 1)))
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
const activeEqlistList = computed(() => eqlistList.filter(event => event.isActive))
const displayEqlistList = computed(() => eqlistList.filter(event => settingsStore.mainSettings.alwaysDisplayLatestInfo ? event.isActive || event.isLatest : event.isActive))
provide('activeEewList', activeEewList)
provide('eqlistList', eqlistList)
watch(() => `${activeEewList.length}|${displayEqlistList.value.length}|${menuId.value}`, () => {
    infoPageCounter.value = 0
})
const jmaTsunamiWarnArea = computed(() => {
    const warnArea = JSON.parse(statusStore.tsunamiMessage.jmaTsunami.warnArea)
    const jmaTsunamiWarnArea = {}
    warnArea.forEach(item => {
        jmaTsunamiWarnArea[item.name] = item
    })
    return jmaTsunamiWarnArea
})
const nmefcTsunamiWarnArea = computed(() => {
    const warnArea = JSON.parse(statusStore.tsunamiMessage.nmefcTsunami.warnArea)
    const nmefcTsunamiWarnArea = {}
    warnArea.forEach(item => {
        nmefcTsunamiWarnArea[item.name] = item
    })
    return nmefcTsunamiWarnArea
})
const activeSources = computed(() =>
    new Set([...activeEewList.map(event => event.eqMessage.source), ...activeEqlistList.value.map(event => event.eqMessage.source)])
)
watch(activeSources, newVal => {
    [...eewSources, ...eqlistSources, 'mockEew'].forEach(source => {
        statusStore.isActive[source] = newVal.has(source)
    })
})
const formatShindo = (intensity)=>intensity.replace('強', '+').replace('弱', '-').replace('不明', '?')
const getBarClass = (event)=>{
    const eqMessage = event.eqMessage
    if(eqMessage.isEew){
        if(eqMessage.isCanceled) return 'dark-gray'
        else if(eqMessage.isWarn) return 'red'
        else return 'orange'
    }
    else {
        if(event.isActive) return 'gray'
        else return 'dark-gray'
    }
}
let mainInterval, terminatorInterval
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
    map.createPane('jpBasePane')
    map.getPane('jpBasePane').style.zIndex = 1
    map.createPane('cnBasePane')
    map.getPane('cnBasePane').style.zIndex = 2
    map.createPane('terminatorFillPane')
    map.getPane('terminatorFillPane').style.zIndex = 9
    map.createPane('waveFillPane')
    waveFillPane = map.getPane('waveFillPane')
    waveFillPane.style.zIndex = 10
    map.createPane('eewBasePane')
    eewBasePane = map.getPane('eewBasePane')
    eewBasePane.style.zIndex = 20
    map.createPane('cnFaultBasePane')
    map.getPane('cnFaultBasePane').style.zIndex = 30
    map.createPane('tsunamiBasePane')
    tsunamiBasePane = map.getPane('tsunamiBasePane')
    tsunamiBasePane.style.zIndex = 40
    for(let i = -1; i <= 20; i++){
        map.createPane(`niedStationPane${i}`)
        map.getPane(`niedStationPane${i}`).style.zIndex = i + 50
        map.createPane(`tremStationPane${i}`)
        map.getPane(`tremStationPane${i}`).style.zIndex = i + 50
    }
    map.createPane('userPane')
    map.getPane('userPane').style.zIndex = 100
    map.createPane('terminatorPane')
    map.getPane('terminatorPane').style.zIndex = 130
    map.createPane('niedGridPane')
    niedGridPane = map.getPane('niedGridPane')
    niedGridPane.style.zIndex = 140
    map.createPane('tremGridPane')
    tremGridPane = map.getPane('tremGridPane')
    tremGridPane.style.zIndex = 140
    map.createPane('wavePane')
    wavePane = map.getPane('wavePane')
    wavePane.style.zIndex = 150
    map.createPane('labelPane1')
    labelPane1 = map.getPane('labelPane1')
    labelPane1.style.zIndex = 190
    map.createPane('labelPane2')
    labelPane2 = map.getPane('labelPane2')
    labelPane2.style.zIndex = 190
    map.createPane('eqlistMarkerPane')
    eqlistMarkerPane = map.getPane('eqlistMarkerPane')
    eqlistMarkerPane.style.zIndex = 199
    map.createPane('eewMarkerPane')
    eewMarkerPane = map.getPane('eewMarkerPane')
    eewMarkerPane.style.zIndex = 200
    map.on('dragstart', handleManual)
    map.on('zoomend', () => zoomLevel.value = map.getZoom())
    if(settingsStore.advancedSettings.preventFlickerMode){
        map.on('zoomstart', ()=>{setMapHeight('calc(100% - 1px)');})
        map.on('zoomend', ()=>{setMapHeight('100%');})
    }
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && pendingSetView) {
            pendingSetView = false
            setView()
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
            }).addTo(map)
        }
        nearestJmaLoc.value
    })
    watchEffect(() => {
        waveFillPane.style.display = settingsStore.mainSettings.fillSWave ? 'block' : 'none'
    })
    labelLayer1 = L.layerGroup().addTo(map);
    labelLayer2 = L.layerGroup().addTo(map);
    loadMaps()
    watch(()=>settingsStore.mainSettings.displayTerminator, newVal => {
        if(terminatorLayer && map.hasLayer(terminatorLayer)) map.removeLayer(terminatorLayer)
        if(terminatorFillLayer && map.hasLayer(terminatorFillLayer)) map.removeLayer(terminatorFillLayer)
        clearInterval(terminatorInterval)
        if(newVal) {
            const update = () => {
                const time = new Date(timeStore.getTimeStamp())
                terminatorLayer?.setTime(time)
                terminatorFillLayer?.setTime(time)
            }
            const time = new Date(timeStore.getTimeStamp())
            terminatorLayer = terminator({
                color: 'black',
                opacity: 0.5,
                weight: 2,
                fill: false,
                pane: 'terminatorPane',
                interactive: false,
                time
            }).addTo(map)
            terminatorFillLayer = terminator({
                fillColor: 'black',
                fillOpacity: 0.25,
                stroke: false,
                pane: 'terminatorFillPane',
                interactive: false,
                time
            }).addTo(map)
            setTimeout(update, 6000);
            terminatorInterval = setInterval(update, 30000);
        }
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
    watchEffect(() => {
        document.removeEventListener('mousemove', resetDefaultMenuTimer)
        if(menuId.value == defaultMenuId.value){
            clearTimeout(defaultMenuTimer)
        }
        else{
            resetDefaultMenuTimer()
            document.addEventListener('mousemove', resetDefaultMenuTimer)
        }
    })
    watch(menuId, (newVal) => {
        if(newVal == 'eews'){
            eqlistMarkerPane.style.opacity = 0.3
            tsunamiBasePane.style.opacity = 0.3 * (tsunamiFlickerCounter ? 1 : 0)
        }
        else{
            eqlistMarkerPane.style.opacity = 1
            tsunamiBasePane.style.opacity = 1 * (tsunamiFlickerCounter ? 1 : 0)
        }
        if(newVal == 'eqlists'){
            eewMarkerPane.style.opacity = 0.3 * (blinkStatus.value ? 1 : 0)
            wavePane.style.opacity = 0.3
            waveFillPane.style.opacity = 0.3
            niedGridPane.style.opacity = 0.3 * (blinkStatus.value && !statusStore.isActive.jmaEew ? 1 : 0)
            tremGridPane.style.opacity = 0.3 * (blinkStatus.value && !statusStore.isActive.cwaEew ? 1 : 0)
        }
        else{
            eewMarkerPane.style.opacity = 1 * (blinkStatus.value ? 1 : 0)
            wavePane.style.opacity = 1
            waveFillPane.style.opacity = 1
            niedGridPane.style.opacity = 1 * (blinkStatus.value && !statusStore.isActive.jmaEew ? 1 : 0)
            tremGridPane.style.opacity = 1 * (blinkStatus.value && !statusStore.isActive.cwaEew ? 1 : 0)
        }
        simpleShindo.value = newVal == 'eqlists'
    }, { immediate: true })
    intervalEvents()
    mainInterval = setInterval(() => {
        intervalEvents()
    }, 500);
    document.addEventListener('keydown', handleKeydown)
})
function handleKeydown(event) {
    const target = event.target
    const tag = target.tagName.toLowerCase()
    const isInput = tag === 'input' || tag === 'textarea' || target.isContentEditable || tag === 'select'
    if (!isInput) {
        switch (event.key) {
            case 'd':
                settingsStore.mainSettings.hideDrawer = !settingsStore.mainSettings.hideDrawer
                setTimeout(() => {
                    map.invalidateSize()
                }, 0);
                break
            case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight':
                isAutoZoom.value = false
                break
            case 'Tab':
                event.preventDefault()
                const menuArr = ['main', 'eews', 'eqlists']
                const length = menuArr.length
                const currIndex = menuArr.findIndex(id => id == menuId.value) ?? length
                const nextIndex = event.shiftKey ? (currIndex + length - 1) % length : (currIndex + 1) % length
                const nextMenu = menuArr[nextIndex]
                handleMenu(nextMenu)
                break
            case 'h':
                if (router.currentRoute.value.path == '/eq-history') {
                    router.back()
                }
                else {
                    router.push('/eq-history')
                }
                break
            case 'a':
                if(isAutoZoom.value) {
                    handleManual()
                }
                else {
                    isAutoZoom.value = true
                    setView()
                }
                break
            case 'm':
                if(settingsStore.advancedSettings.mockEew) {
                    statusStore.showMockDialog = !statusStore.showMockDialog
                }
                break
            case ',':
                infoPageCounter.value = (infoPageCounter.value - infoPageCounter.value % 10 + 25200 - 10) % 25200
                break
            case '.':
                infoPageCounter.value = (infoPageCounter.value - infoPageCounter.value % 10 + 10) % 25200
                break
        }
    }
}
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
    let promises, shouldRetry = false
    if(!isTauri() && ('caches' in window)){
        const cache = await caches.open('topojson')
        promises = Object.keys(topojsonUrls).map(key=>cache.match(topojsonUrls[key]).then(res=>res?.json()))
    }
    else{
        promises = Object.keys(topojsonUrls).map(key=>fetch(topojsonUrls[key]).then(res=>res?.json()))
    }
    const resps = await Promise.all(promises)
    const [global, cn, cn_eew, cn_fault, jp, jp_eew, jp_tsunami, cn_tsunami] = resps
    if(global && cn && cn_eew && cn_fault && jp && jp_eew && jp_tsunami){
        clearTimeout(msgTimer)
        loadBaseMap(global, 'globalBasePane')
        loadBaseMap(cn, 'cnBasePane')
        cnEewBaseMap = settingsStore.mainSettings.disableEewBaseMap 
        ? null : loadBaseMap(cn_eew, 'eewBasePane', false, {
            color: '#bbbbbb00',
            opacity: 1,
            fillColor: '#39393900',
            fillOpacity: 1,
            weight: 1,
        })
        loadBaseMap(jp, 'jpBasePane')
        jpEewBaseMap = settingsStore.mainSettings.disableEewBaseMap 
        ? null : loadBaseMap(jp_eew, 'eewBasePane', false, {
            color: '#bbbbbb00',
            opacity: 1,
            fillColor: '#39393900',
            fillOpacity: 1,
            weight: 1,
        })
        watch(()=>settingsStore.mainSettings.displayCnFault, newVal => {
            if(cnFaultBaseMap && map.hasLayer(cnFaultBaseMap)) map.removeLayer(cnFaultBaseMap)
            if(newVal) {
                cnFaultBaseMap = loadBaseMap(cn_fault, 'cnFaultBasePane', true, {
                    color: 'red',
                    opacity: 0.5,
                    weight: 1,
                })
            }
        }, { immediate: true })
        if(settingsStore.mainSettings.displayPlaceName) {
            const createTextIcon = (text, fontSize = 15) => {
                const dpr = settingsStore.mainSettings.uiScale * (window.devicePixelRatio || 1);
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.font = `${fontSize}px Arial`;
                const textWidth = tempCtx.measureText(text).width;
                const textHeight = fontSize;

                const canvas = document.createElement('canvas');
                canvas.width = (textWidth + 5) * dpr;
                canvas.height = (textHeight + 5) * dpr;
                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);
                ctx.font = `${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffffffcc';
                ctx.shadowColor = '#000000aa';
                ctx.shadowBlur = 5;
                ctx.fillText(text, canvas.width / dpr / 2, canvas.height / dpr / 2);

                return L.icon({
                    iconUrl: canvas.toDataURL(),
                    iconSize: [canvas.width / dpr, canvas.height / dpr],
                    iconAnchor: [canvas.width / dpr / 2, canvas.height / dpr / 2]
                });
            };
            cnProvinceLabels.forEach(item => {
                const { name, coord } = item
                const label = L.marker(coord, {
                    icon: createTextIcon(name),
                    pane: "labelPane1",
                    interactive: false
                })
                labelLayer1.addLayer(label)
            })
            cnCityLabels.forEach(item => {
                const { name, coord } = item
                const label = L.marker(coord, {
                    icon: createTextIcon(name),
                    pane: "labelPane2",
                    interactive: false
                })
                labelLayer2.addLayer(label)
            })
            jpPrefLabels.forEach(item => {
                const { name, coord } = item
                const label = L.marker(coord, {
                    icon: createTextIcon(name),
                    pane: "labelPane2",
                    interactive: false
                })
                labelLayer2.addLayer(label)
            })
            watchEffect(() => {
                labelPane1.style.display = zoomLevel.value >= 5 && zoomLevel.value < 8 ? 'block' : 'none'
                labelPane2.style.display = zoomLevel.value >= 8 ? 'block' : 'none'
            })
        }
        watch(jmaWarnArea, (newVal)=>{
            jpEewBaseMap?.eachLayer(layer=>{
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
                    if(layer.options.fillColor != '#39393900'){
                        layer.setStyle({
                            color: '#bbbbbb00',
                            fillColor: '#39393900'
                        })
                    }
                }
            })
        }, { deep: true, immediate: true })
        if(settingsStore.advancedSettings.forceCalcInt){
            watch(cnEewInfoList, newVal=>{
                const newCsisList = {}
                cnEewBaseMap?.eachLayer(layer=>{
                    let maxInt = 0
                    newVal.forEach(info=>{
                        const dist = pointDistToCnArea([info.lng, info.lat], layer.feature)
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
                        if(layer.options.fillColor != '#39393900'){
                            layer.setStyle({
                                color: '#bbbbbb00',
                                fillColor: '#39393900'
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
                            intensity: int.toString()
                        })
                    })
                }
                csisList.value = newNewCsisList.slice(0, 50)
            }, { deep: true, immediate: true })
        }
        if(settingsStore.mainSettings.source.jmaTsunami) {
            jpTsunamiBaseMap = loadBaseMap(jp_tsunami, 'tsunamiBasePane', false, {
                color: '#ffffff00',
                opacity: 1,
                weight: map.getZoom(),
            })
            map.on('zoomend', () => {
                jpTsunamiBaseMap.setStyle({
                    weight: map.getZoom()
                })
            })
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
                smartSetView()
            }, { deep: true, immediate: true })
        }
        if(settingsStore.mainSettings.source.nmefcTsunami) {
            if(cn_tsunami) {
                cnTsunamiBaseMap = loadBaseMap(cn_tsunami, 'tsunamiBasePane', false, {
                    color: '#ffffff00',
                    opacity: 1,
                    weight: map.getZoom(),
                })
                map.on('zoomend', () => {
                    cnTsunamiBaseMap.setStyle({
                        weight: map.getZoom()
                    })
                })
                watch(nmefcTsunamiWarnArea, newVal => {
                    cnTsunamiBaseMap.eachLayer(layer => {
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
                    smartSetView()
                }, { deep: true, immediate: true })
            }
            else {
                shouldRetry = true
            }
        }
    }
    else{
        shouldRetry = true
    }
    if(shouldRetry) {
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
    blinkStatus.value = !blinkStatus.value
    tsunamiFlickerCounter = (tsunamiFlickerCounter + 1) % 6
    infoPageCounter.value = (infoPageCounter.value + 1) % 25200
    eewMarkerPane.style.opacity = (blinkStatus.value ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    niedGridPane.style.opacity = (blinkStatus.value && !statusStore.isActive.jmaEew ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    tremGridPane.style.opacity = (blinkStatus.value && !statusStore.isActive.cwaEew ? 1 : 0) * (menuId.value == 'eqlists' ? 0.3 : 1)
    tsunamiBasePane.style.opacity = (tsunamiFlickerCounter ? 1 : 0) * (menuId.value == 'eews' ? 0.3 : 1)
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
const setView = () => {
    if(document.visibilityState === 'visible') {
        const bounds = L.latLngBounds([])
        //临时Eqlist
        if(settingsStore.mainSettings.cinemaMode && tempEqlists.value && menuId.value == 'eqlists') {
            if(tempEqlists.value == 'jmaTsunami') {
                statusStore.isActive.jmaTsunami && jpTsunamiBaseMap?.eachLayer(layer => {
                    if(layer.options.color && layer.options.color != '#ffffff00') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
                if(!bounds.isValid()) {
                    bounds.extend(jpTsunamiBaseMap?.getBounds())
                }
            }
            else if(tempEqlists.value == 'nmefcTsunami') {
                statusStore.isActive.nmefcTsunami && cnTsunamiBaseMap?.eachLayer(layer => {
                    if(layer.options.color && layer.options.color != '#ffffff00') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
                if(!bounds.isValid()) {
                    bounds.extend(cnTsunamiBaseMap?.getBounds())
                }
            }
            else if(activeEqlistList.value.length > 0) {
                activeEqlistList.value.forEach(event=>{
                    if(event.eqMessage.source == tempEqlists.value && event.isValidHypo) {
                        bounds.extend(event.hypoLatLng)
                    }
                })
                jpEewBaseMap?.eachLayer(layer => {
                    if(layer.options.fillColor && layer.options.fillColor != '#39393900') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
                cnEewBaseMap?.eachLayer(layer => {
                    if(layer.options.fillColor && layer.options.fillColor != '#39393900') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
            }
        }
        else {
            //Eew和SeisNet
            if(menuId.value != 'eqlists') {
                map?.eachLayer(layer => {
                    let shouldExtend = false
                    switch(layer.options.pane) {
                        case 'eewMarkerPane':
                        case 'waveFillPane':
                            shouldExtend = true
                            break
                        case 'niedGridPane':
                            if(!statusStore.isActive.jmaEew) {
                                shouldExtend = true
                            }
                            break
                        case 'tremGridPane':
                            if(!statusStore.isActive.cwaEew) {
                                shouldExtend = true
                            }
                            break
                    }
                    if(shouldExtend) {
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
                statusStore.isActive.jmaTsunami && jpTsunamiBaseMap?.eachLayer(layer => {
                    if(layer.options.color && layer.options.color != '#ffffff00') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
                statusStore.isActive.nmefcTsunami && cnTsunamiBaseMap?.eachLayer(layer => {
                    if(layer.options.color && layer.options.color != '#ffffff00') {
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            bounds.extend(layer.getLatLng())
                        }
                    }
                })
                if(activeEqlistList.value.length > 0) {
                    activeEqlistList.value.forEach(event=>{
                        if(event.isValidHypo){
                            bounds.extend(event.hypoLatLng)
                        }
                    })
                    jpEewBaseMap?.eachLayer(layer => {
                        if(layer.options.fillColor && layer.options.fillColor != '#39393900') {
                            if(layer.getBounds){
                                bounds.extend(layer.getBounds())
                            }
                            else if(layer.getLatLng){
                                bounds.extend(layer.getLatLng())
                            }
                        }
                    })
                    cnEewBaseMap?.eachLayer(layer => {
                        if(layer.options.fillColor && layer.options.fillColor != '#39393900') {
                            if(layer.getBounds){
                                bounds.extend(layer.getBounds())
                            }
                            else if(layer.getLatLng){
                                bounds.extend(layer.getLatLng())
                            }
                        }
                    })
                }
            }
            //不活跃的Eqlist
            if(!bounds.isValid() && menuId.value == 'eqlists') {
                const candidates = []
                map?.eachLayer(layer => {
                    if(layer.options.pane == 'eqlistMarkerPane' || 
                    layer.options.pane == 'eewBasePane' && layer.options.fillColor && layer.options.fillColor != '#39393900'){
                        if(layer.getBounds){
                            bounds.extend(layer.getBounds())
                        }
                        else if(layer.getLatLng){
                            const latLng = layer.getLatLng()
                            const { lat, lng } = latLng
                            if(
                                lat >= 18 && lat <= 54 && lng >= 73 && lng <= 149
                                ||
                                lat >= 3 && lat <= 18 && lng >= 107 && lng <= 120
                            ) {
                                bounds.extend(latLng)
                            }
                            else {
                                candidates.push(latLng)
                            }
                        }
                    }
                })
                if(!bounds.isValid()) {
                    candidates.forEach(latLng => bounds.extend(latLng))
                }
            }
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
            map.setView(targetCenter, settingsStore.mainSettings.defaultZoom, { animate: true })
        }
    }
    else {
        pendingSetView = true
    }
}
const smartSetView = () => {
    setTimeout(() => {
        if(isAutoZoom.value) setView()
    }, 0);
}
provide('smartSetView', smartSetView)
const loadBaseMap = (topojson, pane, isBaseMap = true, style = {
        color: '#ccc',
        fillColor: '#393939',
        fillOpacity: 1,
        weight: 1,
        fill: true
    })=>{
    if(Object.keys(topojson).length != 0){
        try {
            if(isBaseMap && !settingsStore.advancedSettings.useClassicMapLoader) {
                const geojson = feature(topojson, topojson.objects.region)
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
                const factor = isBaseMap ? 0 : settingsStore.mainSettings.mapSimplifyFactor
                const simplified = simplifyTopoJson(topojson, factor)
                const geojson = feature(simplified, simplified.objects.region)
                const baseMap = L.geoJson(geojson, {
                    pane,
                    style,
                    interactive: settingsStore.mainSettings.placeNameOnHover,
                    onEachFeature: settingsStore.mainSettings.placeNameOnHover && onEachFeature
                })
                baseMap.addTo(map)
                return baseMap
            }
        } catch (e) {
            console.log(e);
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
        const jmaEqlistEvent = activeEqlistList.value.length > 0
        ? settingsStore.mainSettings.cinemaMode && tempEqlists.value
        ? tempEqlists.value == 'jmaEqlist'
        ? activeEqlistList.value.find(event => event.eqMessage.source == 'jmaEqlist')
        : null
        : activeEqlistList.value.find(event => event.eqMessage.source == 'jmaEqlist')
        : eqlistList.find(event => event.eqMessage.source == 'jmaEqlist')
        if(!jmaEqlistEvent) return {}
        if(settingsStore.mainSettings.eqlistsDisplayMode == 1 && !jmaEqlistEvent.isLatest && !jmaEqlistEvent.isActive) return {}
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
        const intensity = formatShindo(jmaWarnArea.value[name].intensity)
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
    const cnEewList = menuId.value == 'eqlists'
        ? activeEqlistList.value.length > 0
        ? settingsStore.mainSettings.cinemaMode && tempEqlists.value
        ? activeEqlistList.value.filter(event=>event.eqMessage.source == tempEqlists.value && event.hypoMarker && !event.eqMessage.isCanceled)
        : activeEqlistList.value.filter(event=>event.hypoMarker && !event.eqMessage.isCanceled)
        : eqlistList.filter(event=>event.hypoMarker && !event.eqMessage.isCanceled)
        : activeEewList.filter(event=>!(event.eqMessage.isCanceled || event.eqMessage.isAssumption))
    const cnEewInfoList = cnEewList.map(event=>{
        const { magnitude, depth, lat, lng } = event.eqMessage
        return { magnitude, depth, lat, lng }
    })
    return cnEewInfoList
})
onBeforeUnmount(()=>{
    clearInterval(mainInterval)
    clearInterval(terminatorInterval)
    clearInterval(autoZoomInterval)
    clearTimeout(autoZoomTimer)
    clearTimeout(defaultMenuTimer)
    clearTimeout(tempEqlistsTimer)
    document.removeEventListener('mousemove', resetDefaultMenuTimer)
    document.removeEventListener('keydown', handleKeydown)
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
            background-color: #282828;
            #mainMap{
                width: 100%;
                height: 100%;
                *{
                    cursor: default;
                }
            }
            .leaflet-container{
                background-color: #282828;
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
                    margin: 5px 0 0 5px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 0 10px 2px #0000003f;
                    user-select: none;
                    .bar{
                        width: 100%;
                        height: 30px;
                        border-bottom: #00000020 1px solid;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 18px;
                        font-weight: 700;
                        padding: 0 0.25em;
                        div{
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                    }
                    .shindo-bar{
                        width: 100px;
                        height: 30px;
                        border-bottom: #00000020 1px solid;
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
                        backdrop-filter: blur(1px);
                        pointer-events: auto;
                        .intensity{
                            width: 100px;
                            height: 100%;
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
                                top: 2px;
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
                                bottom: 8px;
                            }
                            .shindo{
                                font-size: 55px;
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
                            width: 305px;
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
                                overflow: hidden;
                                white-space: nowrap;
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
                        width: 415px;
                        height: 100px;
                        padding: 1px 0;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        column-gap: 50px;
                        align-content: space-evenly;
                        align-items: center;
                        background-color: #ffffff9f;
                        backdrop-filter: blur(1px);
                        .legend {
                            width: 90px;
                            height: 5px;
                            justify-self: end;
                        }
                        .text {
                            justify-self: start;
                            text-align: left;
                            font-size: 18px;
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
                .countdown .shindo-bar{
                    pointer-events: auto;
                }
                .realtime{
                    width: 100px;
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
                    box-shadow: inset 0 0 10px #ffffff3f, 0 0 10px #0000003f;
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
                    column-gap: 0.5em;
                    margin-top: 0.25rem;
                    .s0{
                        color: yellow;
                    }
                    .s1{
                        color: green;
                    }
                    .s2,.s3{
                        color: red;
                    }
                    .s4{
                        color: white;
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
                user-select: none;
                pointer-events: none;
                .csis-list,.shindo-list{
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    overflow: hidden;
                    padding: 5px;
                    border-radius: 10px;
                    box-shadow: inset 0 0 10px #ffffff3f, 0 0 10px #0000003f;
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
                                font-size: 11px;
                                letter-spacing: -1px;
                                padding-right: 1px;
                            }
                            .shindo::first-letter {
                                font-size: 16px;
                                vertical-align: top;
                            }
                        }
                    }
                }
            }
            .bottom-right{
                position: absolute;
                right: 1px;
                bottom: 1px;
                z-index: 600;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                .mocking{
                    font-size: 24px;
                    color: yellow;
                }
                .mock-1{
                    opacity: 1;
                }
                .mock-0{
                    opacity: 0;
                }
                .home{
                    border-radius: 8px;
                    overflow: hidden;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                }
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
            width: 400px;
            overflow: auto;
            z-index: 600;
            background-color: #fff;
        }
        .roman.scale-9{
            transform: scaleX(0.9);
        }
        .roman.scale-75{
            transform: scaleX(0.75);
        }
    }
}
</style>