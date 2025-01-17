<template>
    <div class="outer">
        <div class="container" @click="handleClick">
            <div class="bg" :class="className"></div>
            <div class="intensity">{{ eqMessage.maxIntensity }}</div>
            <div class="text title">{{ formatText(eqMessage.titleText) }}</div>
            <div class="text" v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNumText) }}</div>
            <div class="text">{{ formatText(eqMessage.hypocenterText) }}</div>
            <div class="text">{{ formatText(eqMessage.depthText) }}</div>
            <div class="text">{{ formatText(eqMessage.originTimeText) }}</div>
            <div class="text">{{ formatText(eqMessage.magnitudeText) }}</div>
            <div class="text">{{ formatText(eqMessage.maxIntensityText) }}</div>
            <div class="text" v-if="props.source == 'jmaEqlist'">{{ formatText(eqMessage.info) }}</div>
            <div class="text">经过时间: {{ formatText(msToTime(passedTimeFromOrigin)) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onBeforeUnmount, ref, reactive, computed, watch, inject } from 'vue'
import { formatText, msToTime, calcPassedTime, judgeSameEvent } from '@/utils/Utils';
import { eqUrls } from '@/utils/Urls';
import { EewEvent, EqlistEvent } from '@/classes/EewEqlistClasses';
import { useTimeStore } from '@/stores/time';
import { useStatusStore } from '@/stores/status';
import '@/assets/background.css'
import '@/assets/opacity.css'

const props = defineProps({
    source: String,
})

const activeEewList = inject('activeEewList')
const eqlistList = inject('eqlistList')
const isAutoZoom = inject('isAutoZoom')
const setView = inject('setView')
const timeStore = useTimeStore()
const statusStore = useStatusStore()
const useJst = props.source.includes('jma')
const eqMessage = computed(()=>statusStore.eqMessage[props.source])

const handleClick = ()=>{
    window.open(eqUrls[props.source + '_http'], '_blank')
}

onBeforeUnmount(()=>{
    clearTimeout(timer)
})

const className = ref('white midOpacity')
let timer
let isLoad = true

watch(eqMessage, (newVal)=>{
    className.value = newVal.className + ' midOpacity'
    let passedTime = 0
    if(isLoad){
        isLoad = false
        if(props.source == 'jmaEew'){
            passedTime = calcPassedTime(newVal.reportTime, 9)
        }
        else if(props.source == 'jmaEqlist'){
            passedTime = Math.max(calcPassedTime(newVal.originTime, 9) - 300 * 1000, 0)
        }
        else if(props.source == 'cwaEqlist'){
            passedTime = Math.max(calcPassedTime(newVal.originTime, 8) - 300 * 1000, 0)
        }
        else{
            passedTime = calcPassedTime(newVal.reportTime, 8)
        }
    }
    let time
    if(newVal.isEew){
        if(newVal.isCanceled) time = 30 * 1000
        else if(newVal.isWarn || newVal.magnitude >= 6.0) time = 600 * 1000
        else time = 300 * 1000
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
    if(!newVal.isEew){
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
                eqlistList.unshift(reactive(new EqlistEvent(statusStore.map, Object.assign({}, newVal), time)))
            }
        }
    }
    if(time > 0){
        if(newVal.isEew){
            let i = 0
            while(i < activeEewList.length){
                if(judgeSameEvent(newVal, activeEewList[i].eqMessage)){
                    if(newVal.isCanceled){
                        activeEewList[i].handleCancel(Object.assign({}, newVal), time)
                    }
                    else{
                        activeEewList[i].update(Object.assign({}, newVal), time)
                    }
                    break
                }
                i++
            }
            if(i == activeEewList.length){
                if(statusStore.map){
                    activeEewList.unshift(reactive(new EewEvent(statusStore.map, Object.assign({}, newVal), activeEewList, time)))
                }
            }
        }
        if(isAutoZoom.value) setView()
        className.value = newVal.className + ' highOpacity'
        clearTimeout(timer)
        timer = setTimeout(() => {
            className.value = newVal.className + ' midOpacity'
        }, time);
    }
}, { deep: true })
const passedTimeFromOrigin = ref()
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
        border: black 1px solid;
        border-radius: 5px;
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