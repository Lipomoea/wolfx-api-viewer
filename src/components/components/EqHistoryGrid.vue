<template>
    <div>
        <div class="container">
            <div class="title">{{ title }}</div>
            <div class="item white" v-for="(item, index) of eqList" :key="index" @click="handleClick(item)">
                <div class="intensity" :class="item.className">
                    <div v-if="item.useShindo" :class="item.maxIntensity != '不明' ? 'shindo' : 'csis'">
                        {{ item.maxIntensity == '不明' ? '?' : item.maxIntensity }}
                    </div>
                    <div v-else class="csis" :class="{
                        'roman': settingsStore.mainSettings.useRomanCsis,
                        'scale-75': item.maxIntensity == '8',
                        'scale-9': item.maxIntensity == '7' || item.maxIntensity == '12'
                    }">
                        {{ formatCsis(item.maxIntensity, settingsStore.mainSettings.useRomanCsis) }}
                    </div>
                </div>
                <div class="right">
                    <div class="location">{{ item.hypocenter || '震源 調査中' }}</div>
                    <div class="rightBottom">
                        <div class="timeDepth">
                            <div class="time">{{ item.originTime + ` (${formatTimeZone(item.timeZone)})` }}</div>
                            <div class="depth">{{ item.depth }}</div>
                        </div>
                        <div class="magnitude">M{{ item.magnitude }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Http from '@/classes/Http';
import { eqUrls } from '@/utils/Urls';
import { openUrl, setClassName, stampToTime, shindoScale, formatTimeZone, formatCsis, calcCsisLevel } from '@/utils/Utils';
import '@/assets/background.css'
import '@/assets/opacity.css'
import { useSettingsStore } from '@/stores/settings';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps({
    source: String,
})
const settingsStore = useSettingsStore()
const eqList = reactive([])
const httpInterval = 10000
const maxHistoryNumber = 50
let request
const source = props.source + 'History'
const useAnd = new Set(['cwaEqlist'])

const getEqList = () => {
    Http.get(eqUrls[source] + (useAnd.has(props.source) ? '&' : '?') + `time=${Date.now()}`).then(data => {
        let keys = Object.keys(data)
        for (let i = 0; i < maxHistoryNumber; i++) {
            switch (props.source) {
                case 'jmaEqlist': {
                    eqList[i] = {
                        id: data[keys[i]].EventID,
                        timeZone: 9,
                        useShindo: true,
                        originTime: data[keys[i]].time_full.replace(/\//g, '-'),
                        hypocenter: data[keys[i]].location,
                        depth: data[keys[i]].depth == '0km' ? 'ごく浅い' : data[keys[i]].depth,
                        magnitude: data[keys[i]].magnitude,
                        maxIntensity: data[keys[i]].shindo,
                        className: setClassName(data[keys[i]].shindo, true)
                    }
                    break
                }
                case 'cwaEqlist': {
                    eqList[i] = {
                        id: data[i].id,
                        timeZone: 8,
                        useShindo: true,
                        originTime: stampToTime(data[i].time, 8),
                        hypocenter: data[i].loc.split(' ').slice(-1)[0].slice(3, -1),
                        depth: data[i].depth + 'km',
                        magnitude: data[i].mag.toFixed(1),
                        maxIntensity: shindoScale[data[i].int],
                        className: setClassName(shindoScale[data[i].int], true)
                    }
                    break
                }
                case 'cencEqlist': {
                    eqList[i] = {
                        id: data[keys[i]].EventID,
                        timeZone: 8,
                        useShindo: false,
                        originTime: data[keys[i]].time,
                        hypocenter: data[keys[i]].placeName,
                        depth: data[keys[i]].depth + 'km',
                        magnitude: data[keys[i]].magnitude,
                        maxIntensity: data[keys[i]].intensity,
                        className: setClassName(data[keys[i]].intensity, false)
                    }
                    break
                }
                case 'fssnEqlist': {
                    let infoType
                    switch (data[i].infoTypeName) {
                        case '自动(未核实)':
                            infoType = '自动'
                            break
                        case '已确认':
                            infoType = '确认'
                            break
                        case '正式(已核实)':
                            infoType = '正式'
                            break
                        case '取消':
                            infoType = '取消'
                            break
                        default:
                            infoType = data[i].infoTypeName
                            break
                    }
                    const isCanceled = infoType == '取消'
                    const maxIntensity = data[i].magnitude ? calcCsisLevel(Number(data[i].magnitude), Number(data[i].depth), 0) : '不明'
                    eqList[i] = {
                        id: data[i].ID,
                        timeZone: 8,
                        useShindo: false,
                        originTime: dayjs.utc(data[i].shockTime).tz('Asia/Shanghai').format("YYYY-MM-DD HH:mm:ss"),
                        hypocenter: `(${infoType})` + data[i].placeName,
                        depth: Number(data[i].depth).toFixed(0) + 'km',
                        magnitude: data[i].magnitude ? Number(data[i].magnitude).toFixed(1) : '不明',
                        maxIntensity,
                        className: setClassName(maxIntensity, false, isCanceled)
                    }
                    break
                }
            }
        }
    })
}
const title = computed(() => {
    switch (props.source) {
        case 'jmaEqlist':
            return '日本気象庁地震情報'
        case 'cwaEqlist':
            return '中央氣象署地震報告'
        case 'cencEqlist':
            return '中国地震台网地震信息'
        case 'fssnEqlist':
            return 'FSSN地震测定'
    }
})
const handleClick = (item) => {
    switch (props.source) {
        case 'jmaEqlist': {
            const url = `https://typhoon.yahoo.co.jp/weather/jp/earthquake/${item.id}.html?t=2`
            openUrl(url)
            break
        }
    }
}
onMounted(() => {
    getEqList()
    clearInterval(request)
    request = setInterval(() => {
        getEqList()
    }, httpInterval);
})
onBeforeUnmount(() => {
    clearInterval(request)
})
</script>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;

    .title {
        font-size: 2em;
        margin-bottom: 10px;
    }

    .item {
        display: flex;
        gap: 10px;
        border: black 1px solid;
        align-items: center;
        padding-right: 10px;
        cursor: default;

        .intensity {
            width: 80px;
            height: 80px;
            pointer-events: none;
            border-right: black 1px solid;
            user-select: none;
            display: flex;
            justify-content: center;
            align-items: center;

            .shindo,
            .csis {
                text-align: center;
                letter-spacing: -5px;
                padding-right: 5px;
            }

            .shindo {
                font-size: 50px;
            }

            .shindo::first-letter {
                font-size: 70px;
                vertical-align: top;
            }

            .csis {
                font-size: 70px;
            }

            .roman.scale-75 {
                transform: scaleX(0.75);
            }

            .roman.scale-9 {
                transform: scaleX(0.9);
            }
        }

        .right {
            width: 340px;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .location {
                width: 100%;
                font-size: 1.5em;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }

            .rightBottom {
                display: flex;
                justify-content: space-between;

                .timeDepth {

                    .time,
                    .depth {
                        width: 100%;
                        font-size: 1.1em;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        overflow: hidden;
                    }
                }

                .magnitude {
                    font-size: 1.75em;
                    align-self: self-end;
                }
            }
        }
    }
}
</style>