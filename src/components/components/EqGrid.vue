<template>
    <div class="outer">
        <div class="container" @dblclick="handleDblClick">
            <div class="bg" :class="className"></div>
            <div class="intensity">{{ eqMessage.maxIntensity }}</div>
            <div class="text title">{{ formatText(eqMessage.titleText) }}</div>
            <div class="text" v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNumText) }}</div>
            <div class="text">{{ formatText(eqMessage.hypocenterText) }}</div>
            <div class="text">{{ formatText(eqMessage.depthText) }}</div>
            <div class="text">{{ formatText(eqMessage.originTimeText) }}</div>
            <div class="text">{{ formatText(eqMessage.magnitudeText) }}</div>
            <div class="text">{{ formatText(eqMessage.maxIntensityText) }}</div>
            <div class="text">经过时间: {{ formatText(msToTime(passedTimeFromOrigin)) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, reactive, computed, watch, inject } from 'vue';
import { formatText, msToTime, calcPassedTime, judgeSameEvent, openUrl } from '@/utils/Utils';
import { EewEvent, EqlistEvent, ignoredIds } from '@/classes/EewEqlistClasses';
import { useTimeStore } from '@/stores/time';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import '@/assets/background.css'
import '@/assets/opacity.css'

const props = defineProps({
    source: String,
})

const activeEewList = inject('activeEewList')
const eqlistList = inject('eqlistList')
const isAutoZoom = inject('isAutoZoom')
const setView = inject('setView')
const handleTempEqlists = inject('handleTempEqlists')
const timeStore = useTimeStore()
const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const useJst = props.source.includes('jma')
const eqMessage = computed(()=>statusStore.eqMessage[props.source])

const handleDblClick = ()=>{
    settingsStore.mainSettings.displaySeisNet.delay = Math.max(Math.round(passedTimeFromOrigin.value / 600) / 100 + 0.1, 0)
}

onBeforeUnmount(()=>{
    clearTimeout(timer)
})

const className = ref('white midOpacity')
let timer

watch(eqMessage, (newVal)=>{
    className.value = newVal.className + ' midOpacity'
    let passedTime = 0
    if(useJst){
        passedTime = Math.max(calcPassedTime(newVal.reportTime, 9), 0)
    }
    else if(props.source == 'cwaEqlist'){
        passedTime = Math.max(calcPassedTime(newVal.originTime, 8) - 300 * 1000, 0)
    }
    else{
        passedTime = Math.max(calcPassedTime(newVal.reportTime, 8), 0)
    }
    let time
    if(newVal.isEew){
        if(newVal.isCanceled) time = 20 * 1000
        else if(newVal.isWarn || newVal.magnitude >= 6.0) time = Math.max(newVal.magnitude, 6) * 60 * 1000
        else time = 240 * 1000
    }
    else{
        time = 300 * 1000
        if(newVal.className.includes('orange') || newVal.magnitude >= 6.0){
            time = 600 * 1000
        }
        if(newVal.className.includes('red') || newVal.magnitude >= 7.0){
            time = 900 * 1000
        }
        if(newVal.className == 'purple' || newVal.magnitude >= 7.5){
            time = 1200 * 1000
        }
    }
    time -= passedTime
    if(newVal.isEew){
        if(!ignoredIds.has(`${newVal.source}|${newVal.id}`)) {
            let i = 0
            while(i < activeEewList.length){
                if(judgeSameEvent(newVal, activeEewList[i].eqMessage)){
                    activeEewList[i].update(Object.assign({}, newVal), time)
                    break
                }
                i++
            }
            if(i == activeEewList.length){
                if(statusStore.map){
                    if(time > 0 && (props.source != 'gqEew' || (newVal.magnitude >= settingsStore.mainSettings.gqActionMag || newVal.maxIntensity >= settingsStore.mainSettings.gqActionCsis))) {
                        const newEvent = reactive(new EewEvent(statusStore.map, Object.assign({}, newVal), activeEewList, handleTempEqlists))
                        activeEewList.unshift(newEvent)
                        newEvent.update(Object.assign({}, newVal), time, true)
                    }
                }
            }
        }
    }
    else {
        let i = 0
        while(i < eqlistList.length){
            if(newVal.source == eqlistList[i].eqMessage.source){
                eqlistList[i].update(Object.assign({}, newVal), time)
                break
            }
            i++
        }
        if(i == eqlistList.length){
            if(statusStore.map){
                const newEvent = reactive(new EqlistEvent(statusStore.map, Object.assign({}, newVal), handleTempEqlists))
                eqlistList.unshift(newEvent)
                newEvent.update(Object.assign({}, newVal), time)
            }
        }
    }
    if(time > 0) {
        if(isAutoZoom.value) {
            setTimeout(() => {
                setView()
            }, 0);
        }
        className.value = newVal.className + ' highOpacity'
        clearTimeout(timer)
        timer = setTimeout(() => {
            className.value = newVal.className + ' midOpacity'
        }, time);
    }
}, { deep: true })
const passedTimeFromOrigin = ref(0)
watch(()=>timeStore.currentTime, ()=>{
    if(useJst){
        passedTimeFromOrigin.value = calcPassedTime(eqMessage.value.originTime, 9)
    }
    else{
        passedTimeFromOrigin.value = calcPassedTime(eqMessage.value.originTime, 8)
    }
})

</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    .container{
        position: relative;
        overflow: hidden;
        width: 100%;
        min-width: 410px;
        height: 300px;
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        border: #7f7f7f 1px solid;
        border-radius: 20px;
        user-select: none;
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
            font-size: 200px;
            font-weight: 700;
            color: #0000003f;
        }
        .text{
            text-align: center;
            max-width: 90%;
        }
        .title{
            font-size: 18px;
            font-weight: 700;
        }
    }
}
</style>