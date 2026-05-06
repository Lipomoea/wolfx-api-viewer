<template>
    <div class="outer2">
        <div class="container" @contextmenu.prevent="handleCopy">
            <div class="bg" :class="className"></div>
            <div class="intensity" :class="fontClass">{{ eqMessage.useShindo ? eqMessage.maxIntensity : formatCsis(eqMessage.maxIntensity) }}</div>
            <div class="text title" :class="fontClass">{{ formatText(eqMessage.titleText) }}</div>
            <div class="text" :class="fontClass" v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNumText) }}</div>
            <div class="text" :class="fontClass">{{ formatText(eqMessage.hypocenterText) }}</div>
            <div class="text" :class="fontClass">{{ formatText(eqMessage.depthText) }}</div>
            <div class="text" :class="fontClass">{{ formatText(eqMessage.originTimeText) }}</div>
            <div class="text" :class="fontClass">{{ formatText(eqMessage.magnitudeText) }}</div>
            <div class="text" :class="fontClass">{{ formatText(eqMessage.maxIntensityText) }}</div>
            <div class="text" :class="fontClass">经过时间: {{ formatText(msToTime(passedTimeFromOrigin)) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, reactive, computed, watch, inject } from 'vue';
import { formatText, msToTime, calcPassedTime, judgeSameEvent, calcTimeDiff, formatCsis } from '@/utils/Utils';
import { useTimeStore } from '@/stores/time';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { isTauri } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import '@/assets/background.css';
import '@/assets/opacity.css';

const props = defineProps({
    source: String,
})

const activeEewList = inject('activeEewList')
const eqlistList = inject('eqlistList')
const smartSetView = inject('smartSetView')
const handleTempEqlists = inject('handleTempEqlists')
const timeStore = useTimeStore()
const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const eqMessage = computed(()=>statusStore.eqMessage[props.source])

onBeforeUnmount(()=>{
    clearTimeout(timer)
})

const className = ref('white midOpacity')
const fontClass = computed(() => className.value.includes('dark-orange') || className.value.includes('red') || className.value.includes('purple') ? 'font-white' : 'font-black')
let timer
let eewClassModulePromise
const loadEewClassModule = () => {
    eewClassModulePromise ||= import('@/classes/EewEqlistClasses')
    return eewClassModulePromise
}

watch(eqMessage, async (newVal)=>{
    const message = Object.assign({}, newVal)
    className.value = message.className + ' midOpacity'
    const passedTime = Math.max(calcPassedTime(message.reportTime, message.timeZone) ?? Infinity, 0)
    let time
    if(message.isEew){
        if(message.isCanceled) time = 20 * 1000
        else if(message.isWarn) time = Math.max(message.magnitude, 6) * 60 * 1000
        else time = Math.max(message.magnitude, 3) * 60 * 1000
    }
    else{
        time = 300 * 1000
        if(message.className.includes('orange') || message.magnitude >= 6.0){
            time = 600 * 1000
        }
        if(message.className.includes('red') || message.magnitude >= 7.0){
            time = 900 * 1000
        }
        if(message.className == 'purple' || message.magnitude >= 7.5){
            time = 1200 * 1000
        }
        if(message.isCanceled) time = 60 * 1000
    }
    time -= passedTime
    if(message.isEew){
        const { EewEvent, ignoredIds } = await loadEewClassModule()
        if(!(ignoredIds[`${message.source}|${message.id}`] > message.reportNum)) {
            let i = 0
            while(i < activeEewList.length){
                if(judgeSameEvent(message, activeEewList[i].eqMessage)){
                    activeEewList[i].update(Object.assign({}, message), time)
                    break
                }
                i++
            }
            if(i == activeEewList.length){
                if(statusStore.map){
                    if(time > 0 && (settingsStore.actionWhiteListArr.some(key => message.hypocenter.includes(key)) || props.source != 'gqEew' 
                        || (settingsStore.mainSettings.gqActionMag == 0 || message.magnitude >= settingsStore.mainSettings.gqActionMag)
                    )) {
                        const newEvent = reactive(new EewEvent(statusStore.map, Object.assign({}, message), activeEewList, handleTempEqlists, smartSetView))
                        activeEewList.unshift(newEvent)
                        newEvent.update(Object.assign({}, message), time, true)
                    }
                }
            }
        }
    }
    else {
        const { EqlistEvent } = await loadEewClassModule()
        let i = 0
        const shouldUpdate = settingsStore.actionWhiteListArr.some(key => message.hypocenter.includes(key)) || message.source != 'fssnEqlist' && message.source != 'usgsEqlist'
            || message.source == 'fssnEqlist'
            && (message.title == 'FSSN正式测定' || message.title == 'FSSN自动测定' && settingsStore.mainSettings.fssnActionType == 0)
            && (settingsStore.mainSettings.fssnActionMag == 0 || message.magnitude >= settingsStore.mainSettings.fssnActionMag)
            || message.source == 'usgsEqlist'
            && (settingsStore.mainSettings.usgsActionMag == 0 || message.magnitude >= settingsStore.mainSettings.usgsActionMag)
        while(i < eqlistList.length){
            if(message.source == eqlistList[i].eqMessage.source){
                if(shouldUpdate) {
                    eqlistList[i].update(Object.assign({}, message), time)
                }
                break
            }
            i++
        }
        if(i == eqlistList.length){
            if(statusStore.map){
                if(shouldUpdate) {
                    const newEvent = reactive(new EqlistEvent(statusStore.map, Object.assign({}, message), handleTempEqlists, smartSetView))
                    eqlistList.unshift(newEvent)
                    newEvent.update(Object.assign({}, message), time, true)
                }
            }
        }
        eqlistList.sort((a, b) => calcTimeDiff(b.eqMessage.reportTime, b.eqMessage.timeZone, a.eqMessage.reportTime, a.eqMessage.timeZone) + (b.eqMessage.source == props.source) - (a.eqMessage.source == props.source))
        eqlistList.forEach((event, index) => {
            if(index == 0) {
                event.isLatest = true
            }
            else {
                event.isLatest = false
                if(settingsStore.mainSettings.eqlistsDisplayMode == 1 && !event.isActive) event.removeMark()
            }
        })
    }
    if(time > 0) {
        className.value = message.className + ' highOpacity'
        clearTimeout(timer)
        timer = setTimeout(() => {
            className.value = message.className + ' midOpacity'
        }, time);
    }
}, { deep: true })
const passedTimeFromOrigin = ref(0)
watch(()=>timeStore.currentTimeStamp, ()=>{
    passedTimeFromOrigin.value = calcPassedTime(eqMessage.value.originTime, eqMessage.value.timeZone)
})

const handleCopy = async () => {
    const content = JSON.stringify(eqMessage.value)
    try {
        if(isTauri()) {
            await writeText(content)
        }
        else {
            await navigator.clipboard.writeText(content)
        }
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
</script>

<style lang="scss" scoped>
.outer2{
    width: 100%;
    max-width: 500px;
    .container{
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 270px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        border-radius: 20px;
        user-select: none;
        box-shadow: 0 4px 10px #0000003f;
        transition: box-shadow 0.3s ease, transform 0.3s ease;
        &:hover {
            box-shadow: 0 2px 5px #0000003f;
            transform: translateY(2px);
        }
        *{
            z-index: 10;
            pointer-events: none;
        }
        .bg{
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: auto;
        }
        .intensity{
            position: absolute;
            z-index: 5;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 180px;
            font-weight: 700;
        }
        .text{
            text-align: center;
            max-width: 90%;
        }
        .title{
            font-size: 18px;
            font-weight: 700;
        }
        .font-black {
            color: #000000;
        }
        .font-white {
            color: #ffffff;
        }
        .intensity.font-black {
            color: #0000003f;
        }
        .intensity.font-white {
            color: #ffffff3f;
        }
    }
}
</style>
