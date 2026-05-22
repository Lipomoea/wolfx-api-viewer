<template>
    <div class="outer">
        <div class="container">
            <div class="info" v-for="(item, index) of eqlists" :key="itemActionKey(item)" :class="{ 'show-actions': activeActionIndex == index }" :style="{
                border: `var(--${item.className}) 2px solid`
            }" @pointerenter="showActions(index)" @pointerleave="hideActions(index)" @click="showActions(index)">
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
                        {{ formatCsis(item.maxIntensity) }}
                    </div>
                </div>
                <div class="right">
                    <div class="location">{{ item.hypocenter || '震源 調査中' }}</div>
                    <div class="time">{{ item.originTime + ` (${formatTimeZone(item.timeZone)})` }}</div>
                    <div class="bottom">
                        <div class="magnitude">M{{ item.magnitude ? item.magnitude.toFixed(1) : '不明' }}</div>
                        <div class="depth">{{ item.depth.toFixed(0) }}km</div>
                        <div class="source">{{ (item.intReportId ? '*' : '') + item.source }}</div>
                    </div>
                </div>
                <div class="buttons" @contextmenu.prevent="handleCopy(item)">
                    <el-button class="button" type="warning" plain @click.stop="openUrl(item.url)">查看网页</el-button>
                    <el-button class="button" :type="isReplaying(item) ? 'danger' : 'primary'" plain @click.stop="handleReplay(item)">{{ isReplaying(item) ? '停止回放' : '测站回放' }}</el-button>
                    <el-button class="button" :type="displayIds.has(itemActionKey(item)) ? 'danger' : 'success'" plain @click.stop="displayOnMap(item)">{{ displayIds.has(itemActionKey(item)) ? '取消显示' : '地图显示' }}</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import '@/assets/background.css';
import { reactive, computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { defaultEqMessage, useStatusStore } from '@/stores/status';
import { openUrl, formatTimeZone, formatCsis, calcTimeDiff, formatShindo, calcPassedTime, stampToTime, setClassName } from '@/utils/Utils';
import { useTimeStore } from '@/stores/time';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const timeStore = useTimeStore()

const smartSetView = inject('smartSetView')
const historyList = inject('historyList')
const activeEewList = inject('activeEewList')
const handleTempEqlists = inject('handleTempEqlists')

const maxHistoryNumber = 100
// 按行记展开状态；历史源的 id 可能为空，不能拿它控制按钮浮层。
const activeActionIndex = ref(-1)
// 只记这次回放自己开的东西，别顺手关掉用户手动开的模拟预警。
const replayId = ref(null)
const replayMockId = ref(null)
let mockTimer
const flatted = computed(() => Object.values(statusStore.history).flat())
const sorted = computed(() => flatted.value.sort((a, b) => calcTimeDiff(b.originTime, b.timeZone, a.originTime, a.timeZone)))
const eqlists = computed(() => sorted.value.filter(item => (settingsStore.mainSettings.historyMagThres == 0 || item.magnitude >= settingsStore.mainSettings.historyMagThres) && settingsStore.mainSettings.historySources.includes(item.source)).slice(0, maxHistoryNumber))
const hasItemId = item => item.id != null && item.id !== ''
// 历史列表有些接口不给 id，地图显示和回放必须自己拼一个稳定键。
const itemActionKey = item => hasItemId(item) ? `${item.source}|${item.id}` : [
    item.source,
    item.originTime,
    item.timeZone,
    item.hypocenter,
    item.lat,
    item.lng,
    item.depth,
    item.magnitude,
    item.url
].join('|')
const showActions = index => activeActionIndex.value = index
const hideActions = index => {
    if(activeActionIndex.value == index) activeActionIndex.value = -1
}
const isReplaying = item => replayId.value == itemActionKey(item) && settingsStore.mainSettings.displaySeisNet.delay > 0
const handleReplay = (item) => {
    if(isReplaying(item)) {
        stopReplay()
        return
    }
    stopReplay()
    const passedTime = Math.max(calcPassedTime(item.originTime, item.timeZone) / 60000 + 0.1, 0)
    replayId.value = itemActionKey(item)
    settingsStore.mainSettings.displaySeisNet.delay = passedTime
    if (settingsStore.advancedSettings.mockOnReplay && settingsStore.advancedSettings.mockEew) {
        void createMockEew(item)
    }
}
const stopReplayMock = () => {
    clearTimeout(mockTimer)
    mockTimer = null
    const mockId = replayMockId.value
    if(mockId != null) {
        const mockEvents = activeEewList?.filter(event => event.eqMessage.source == 'mockEew' && event.eqMessage.id == mockId) ?? []
        mockEvents.forEach(event => event.terminate(true))
    }
    replayMockId.value = null
}
const stopReplay = () => {
    if(replayId.value == null && replayMockId.value == null && !mockTimer) return
    // 停止回放时顺手把测站时间拨回实时。
    replayId.value = null
    settingsStore.mainSettings.displaySeisNet.delay = 0
    stopReplayMock()
}
watch(() => settingsStore.mainSettings.displaySeisNet.delay, newVal => {
    if(newVal <= 0) stopReplay()
})
watch(() => `${settingsStore.advancedSettings.mockEew}|${settingsStore.advancedSettings.mockOnReplay}`, () => {
    if(!settingsStore.advancedSettings.mockEew || !settingsStore.advancedSettings.mockOnReplay) stopReplayMock()
})
onBeforeUnmount(stopReplay)
let clipboardModulePromise
const loadClipboardModule = () => {
    clipboardModulePromise ||= import('@/utils/Clipboard')
    return clipboardModulePromise
}
const handleCopy = async (item) => {
    const content = `${item.hypocenter} ${item.originTime} (UTC${formatTimeZone(item.timeZone)}) M${item.magnitude ? item.magnitude.toFixed(1) : '不明'} ${item.depth.toFixed(0)}km ${item.useShindo ? ('最大震度' + formatShindo(item.maxIntensity, false)) : ('预估最大烈度' + item.maxIntensity)}`
    try {
        const { copyText } = await loadClipboardModule()
        await copyText(content)
        ElMessage({
            message: '复制成功',
            type: 'success'
        })
    } catch (e) {
        console.log(e)
        ElMessage({
            message: '复制失败',
            type: 'error'
        })
    }
}
const displayIds = computed(() => new Set(historyList.map(event => event.eqMessage.historyActionKey ?? event.eqMessage.id)))
let historyClassModulePromise
const loadHistoryClassModule = () => {
    historyClassModulePromise ||= import('@/classes/EewEqlistClasses')
    return historyClassModulePromise
}
const displayOnMap = async (item) => {
    const actionKey = itemActionKey(item)
    const event = historyList.find(event => (event.eqMessage.historyActionKey ?? event.eqMessage.id) == actionKey)
    if(event) {
        event.deactivate()
    }
    else {
        const eqMessage = Object.assign({}, defaultEqMessage, item)
        // 有些历史源不给id，前端操作需要自己补一个稳定键。
        eqMessage.id = hasItemId(item) ? item.id : actionKey
        eqMessage.historyActionKey = actionKey
        eqMessage.historySource = item.source
        eqMessage.source = 'history'
        eqMessage.title = eqMessage.titleText = '历史地震 ' + `(${item.source})`
        eqMessage.depthText = '深度: ' + eqMessage.depth.toFixed(0) + 'km'
        eqMessage.reportTime = stampToTime(timeStore.getTimeStamp(), eqMessage.timeZone)
        if(!statusStore.map) return
        const { HistoryEvent } = await loadHistoryClassModule()
        const newEvent = reactive(new HistoryEvent(statusStore.map, eqMessage, smartSetView, historyList))
        historyList.unshift(newEvent)
        newEvent.update(eqMessage)
    }
}
const createMockEew = async (item) => {
    const now = timeStore.getTimeStamp()
    replayMockId.value = now
    const originTime = dayjs(now).add(6, 'seconds').utcOffset(item.timeZone * 60).format('YYYY-MM-DD HH:mm:ss')
    const eqMessage = {
        source: 'mockEew',
        id: now,
        isEew: true,
        timeZone: item.timeZone,
        reportNum: 1,
        reportNumText: '第1报（最终）',
        reportTime: originTime,
        isAssumption: false,
        isWarn: item.useShindo ? item.maxIntensity >= '5' : item.maxIntensity >= 6.5,
        isFinal: true,
        isCanceled: false,
        title: `模拟回放·${item.source}`,
        titleText: `模拟回放·${item.source}`,
        hypocenter: '模拟·' + item.hypocenter,
        hypocenterText: '震中: 模拟·' + item.hypocenter,
        lat: item.lat,
        lng: item.lng,
        depth: item.depth,
        depthText: '深度: ' + item.depth.toFixed(0) + 'km',
        originTime,
        originTimeText: '发震时间: ' + originTime,
        magnitude: item.magnitude,
        magnitudeText: '震级: ' + item.magnitude.toFixed(1),
        useShindo: item.useShindo,
        maxIntensity: item.maxIntensity,
        maxIntensityText: (item.useShindo ? '推定最大震度: ' : '预估最大烈度: ') + item.maxIntensity,
        className: setClassName(item.maxIntensity, item.useShindo)
    }
    clearTimeout(mockTimer)
    mockTimer = setTimeout(async () => {
        if(replayMockId.value != now || !statusStore.map) return
        // 直接放进主地图事件队列，避免依赖状态面板是否挂载。
        const { EewEvent } = await loadHistoryClassModule()
        const displayTime = (eqMessage.isWarn ? Math.max(eqMessage.magnitude, 6) : Math.max(eqMessage.magnitude, 3)) * 60 * 1000
        const newEvent = reactive(new EewEvent(statusStore.map, Object.assign({}, eqMessage), activeEewList, handleTempEqlists, smartSetView))
        activeEewList.unshift(newEvent)
        newEvent.update(Object.assign({}, eqMessage), displayTime, true)
    }, 6000);
}
</script>

<style lang="scss" scoped>
.outer {
    width: 100%;
    .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
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
            &:hover .buttons,
            &:focus-within .buttons,
            &.show-actions .buttons {
                opacity: 1;
                pointer-events: auto;
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
                width: 78px;
                flex-shrink: 0;
                height: 100%;
                padding-right: 2px;
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
                display: flex;
                justify-content: space-evenly;
                align-items: center;
                z-index: 2;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.12s ease-out;
                .button {
                    width: 88px;
                    height: 32px;
                }
            }
        }
    }
}
</style>
