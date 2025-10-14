<template>
    <div class="outer">
        <div class="container">
            <div class="info" v-for="(item, index) of eqlists" :key="index" :style="{
                border: `var(--${item.className}) 2px solid`
            }">
                <div class="background" :class="item.className"></div>
                <div v-if="item.useShindo" class="intensity" :class="item.className">
                    <div class="intensity-title">最大震度</div>
                    <div :class="formatShindo(item.maxIntensity) != '?' ? 'shindo' : 'csis'">
                        {{ formatShindo(item.maxIntensity) }}
                    </div>
                </div>
                <div v-else class="intensity" :class="item.className">
                    <div class="intensity-title">最大烈度</div>
                    <div class="csis" :class="{
                        'roman': settingsStore.mainSettings.useRomanCsis,
                        'scale-75': item.maxIntensity == '8',
                        'scale-9': item.maxIntensity == '7' || item.maxIntensity == '12'
                    }">
                        {{ formatCsis(item.maxIntensity, settingsStore.mainSettings.useRomanCsis) }}
                    </div>
                </div>
                <div class="right">
                    <div class="location">{{ item.hypocenter || '震源 調査中' }}</div>
                    <div class="time">{{ item.originTime + ` (${formatTimeZone(item.timeZone)})` }}</div>
                    <div class="bottom">
                        <div class="magnitude">M{{ item.magnitude ? item.magnitude.toFixed(1) : '不明' }}</div>
                        <div class="depth">{{ item.depth.toFixed(0) }}km</div>
                        <div class="source">{{ item.source }}</div>
                    </div>
                </div>
                <div class="buttons">
                    <el-button class="button" type="warning" plain @click="openUrl(item.url)">查看网页</el-button>
                    <el-button class="button" type="primary" plain @click="handleReplay(item)">测站回放</el-button>
                    <el-button class="button" type="success" plain @click="handleCopy(item)">复制信息</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import '@/assets/background.css';
import '@/assets/opacity.css';
import { ref, onMounted, onBeforeUnmount, watchEffect } from 'vue';
import Http from '@/classes/Http';
import { useSettingsStore } from '@/stores/settings';
import { eqlistSources } from '@/stores/status';
import { eqUrls } from '@/utils/Urls';
import { openUrl, setClassName, stampToTime, shindoScale, formatTimeZone, formatCsis, calcCsisLevel, calcTimeDiff, formatShindo, calcPassedTime } from '@/utils/Utils';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getFEName } from '@/utils/FERegions';
dayjs.extend(utc);
dayjs.extend(timezone);

const settingsStore = useSettingsStore()

const maxHistoryNumber = 50
const activatedSources = eqlistSources.filter(source => settingsStore.mainSettings.source[source])
const useAnd = new Set(['cwaEqlist', 'fssnEqlist'])
const eqlists = ref([])
const repo = ref([])
const getEqList = async (source) => {
    const list = []
    const data = await Http.get(eqUrls[source + 'History'] + (useAnd.has(source) ? '&' : '?') + `time=${Date.now()}`)
    if(!data) return list
    let keys
    switch (source) {
        case 'usgsEqlist':
            keys = data.features ? Object.keys(data.features) : []
            break
        default:
            keys = Object.keys(data)
            break
    }
    for (let i = 0; i < Math.min(keys.length, maxHistoryNumber); i++) {
        switch (source) {
            case 'jmaEqlist': {
                const id = data[keys[i]].EventID
                list[i] = {
                    source: 'JMA',
                    id,
                    timeZone: 9,
                    useShindo: true,
                    originTime: data[keys[i]].time_full.replace(/\//g, '-'),
                    lat: Number(data[keys[i]].latitude),
                    lng: Number(data[keys[i]].longitude),
                    hypocenter: data[keys[i]].location,
                    depth: Number(data[keys[i]].depth.replace('km', '')),
                    magnitude: Number(data[keys[i]].magnitude),
                    maxIntensity: data[keys[i]].shindo,
                    className: setClassName(data[keys[i]].shindo, true),
                    url: `https://typhoon.yahoo.co.jp/weather/jp/earthquake/${id}.html`
                }
                break
            }
            case 'cwaEqlist': {
                const locStart = data[i].loc.indexOf('(位於')
                const locEnd = data[i].loc.indexOf(')')
                const hypocenter = locStart == -1 || locEnd == -1 || locStart + 3 >= locEnd ? data[i].loc : data[i].loc.slice(locStart + 3, locEnd)
                list[i] = {
                    source: 'CWA',
                    id: data[i].id,
                    timeZone: 8,
                    useShindo: true,
                    originTime: stampToTime(data[i].time, 8),
                    lat: data[i].lat,
                    lng: data[i].lon,
                    hypocenter,
                    depth: data[i].depth,
                    magnitude: data[i].mag,
                    maxIntensity: shindoScale[data[i].int],
                    className: setClassName(shindoScale[data[i].int], true),
                    url: 'https://scweb.cwa.gov.tw/zh-tw/earthquake/data'
                }
                break
            }
            case 'cencEqlist': {
                const depth = Number(data[keys[i]].depth)
                const magnitude = Number(data[keys[i]].magnitude)
                const maxIntensity = calcCsisLevel(magnitude, depth)
                list[i] = {
                    source: 'CENC',
                    id: data[keys[i]].EventID,
                    timeZone: 8,
                    useShindo: false,
                    originTime: data[keys[i]].time,
                    lat: Number(data[keys[i]].latitude),
                    lng: Number(data[keys[i]].longitude),
                    hypocenter: (data[keys[i]].type == 'reviewed' ? '' : '(A)') + data[keys[i]].placeName,
                    depth,
                    magnitude,
                    maxIntensity,
                    className: setClassName(maxIntensity, false),
                    url: 'https://news.ceic.ac.cn/'
                }
                break
            }
            case 'usgsEqlist': {
                const feature = data.features[i]
                const properties = feature.properties
                const lng = feature.geometry.coordinates[0]
                const lat = feature.geometry.coordinates[1]
                const depth = feature.geometry.coordinates[2]
                const magnitude = properties.mag
                const maxIntensity = calcCsisLevel(magnitude, depth)
                list[i] = {
                    source: 'USGS',
                    id: feature.id,
                    timeZone: 8,
                    useShindo: false,
                    originTime: stampToTime(properties.time, 8),
                    lat,
                    lng,
                    hypocenter: (properties.status == 'reviewed' ? '' : '(A)') + (getFEName(lat, lng) || properties.place),
                    depth,
                    magnitude,
                    maxIntensity,
                    className: setClassName(maxIntensity, false),
                    url: properties.url
                }
                break
            }
            case 'fssnEqlist': {
                let infoType
                switch (data[i].infoTypeName) {
                    case '自动(未核实)':
                        infoType = '(A)'
                        break
                    case '已确认':
                        infoType = '(C)'
                        break
                    case '正式(已核实)':
                        infoType = ''
                        break
                    case '取消':
                        infoType = '(X)'
                        break
                    default:
                        infoType = data[i].infoTypeName
                        break
                }
                const lat = Number(data[i].latitude)
                const lng = Number(data[i].longitude)
                const isCanceled = data[i].infoTypeName == '取消'
                const maxIntensity = Number(data[i].magnitude) ? calcCsisLevel(Number(data[i].magnitude), Number(data[i].depth), 0) : '不明'
                list[i] = {
                    source: 'FSSN',
                    id: data[i].ID,
                    timeZone: 8,
                    useShindo: false,
                    originTime: dayjs.utc(data[i].shockTime).tz('Asia/Shanghai').format("YYYY-MM-DD HH:mm:ss"),
                    lat,
                    lng,
                    hypocenter: infoType + (getFEName(lat, lng) || data[i].placeName_zh || data[i].placeName),
                    depth: Number(data[i].depth),
                    magnitude: Number(data[i].magnitude),
                    maxIntensity,
                    className: setClassName(maxIntensity, false, isCanceled),
                    url: 'https://seismic.fanstudio.tech/'
                }
                break
            }
        }
    }
    return list
}
const update = async () => {
    const promises = activatedSources.map(async source => {
        return await getEqList(source)
    })
    const result = await Promise.all(promises)
    const newList = result.flat()
    newList.sort((a, b) => calcTimeDiff(b.originTime, b.timeZone, a.originTime, a.timeZone))
    repo.value = newList
}
const handleReplay = (item) => {
    const passedTime = Math.max(calcPassedTime(item.originTime, item.timeZone) / 60000 + 0.1, 0)
    settingsStore.mainSettings.displaySeisNet.delay = passedTime
}
const handleCopy = (item) => {
    const content = `${item.hypocenter} ${item.originTime} (UTC${formatTimeZone(item.timeZone)}) M${item.magnitude ? item.magnitude.toFixed(1) : '不明'} ${item.depth.toFixed(0)}km`
    navigator.clipboard.writeText(content)
        .then(() => {
            ElMessage({
                message: '复制成功',
                type: 'success'
            })
        })
        .catch(() => {
            ElMessage({
                message: '复制失败',
                type: 'error'
            })
        })
}
watchEffect(() => {
    eqlists.value = repo.value.filter(item => item.magnitude >= settingsStore.mainSettings.historyMagThres).slice(0, maxHistoryNumber)
})
let updateInterval
onMounted(() => {
    update()
    updateInterval = setInterval(update, 10000);
})
onBeforeUnmount(() => {
    clearInterval(updateInterval)
})
</script>

<style lang="scss" scoped>
.outer {
    width: 100%;
    .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 10px;
        gap: 5px;
        .info{
            width: 100%;
            height: 80px;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            gap: 7px;
            align-items: center;
            pointer-events: auto;
            position: relative;
            &:hover .buttons {
                display: flex;
            }
            * {
                z-index: 1;
            }
            .background {
                position: absolute;
                width: 100%;
                height: 100%;
                z-index: 0;
                opacity: 0.2;
            }
            .intensity{
                width: 80px;
                flex-shrink: 0;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
                pointer-events: none;
                .intensity-title{
                    height: 16px;
                    font-size: 13px;
                    line-height: 1;
                    position: absolute;
                    top: 2px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .shindo,.csis{
                    height: 64px;
                    text-align: center;
                    letter-spacing: -4px;
                    padding-right: 4px;
                    position: absolute;
                    bottom: 4px;
                }
                .shindo{
                    font-size: 44px;
                }
                .shindo::first-letter{
                    font-size: 64px;
                    vertical-align: top;
                }
                .csis{
                    font-size: 64px;
                }
                .roman.scale-9{
                    transform: scaleX(0.9);
                }
                .roman.scale-75{
                    transform: scaleX(0.75);
                }
            }
            .right{
                flex: 1;
                min-width: 0;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                line-height: 1;
                vertical-align: middle;
                padding-top: 2px;
                .location{
                    width: 100%;
                    font-size: 24px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .time{
                    width: 100%;
                    font-size: 20px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .bottom{
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    overflow: hidden;
                    white-space: nowrap;
                    .magnitude{
                        font-size: 20px;
                    }
                    .depth{
                        font-size: 20px;
                    }
                    .source {
                        margin-left: auto;
                        margin-right: 4px;
                        font-size: 14px;
                        color: #7f7f7f;
                        align-self: flex-end;
                    }
                }
            }
            .buttons {
                width: 100%;
                height: 100%;
                position: absolute;
                background-color: #ffffff9f;
                backdrop-filter: blur(1px);
                display: none;
                justify-content: space-evenly;
                align-items: center;
                z-index: 2;
                .button {
                    width: 88px;
                    height: 32px;
                }
            }
        }
    }
}
</style>