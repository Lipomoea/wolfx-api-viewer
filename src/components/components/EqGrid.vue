<template>
    <div>
        <div class="container" @click="handleClick">
            <div class="bg" :class="className"></div>
            <div class="intensity">{{ eqMessage.maxIntensity }}</div>
            <div :style='{fontWeight: 700}'>{{ formatText(eqMessage.titleText) }}</div>
            <div v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNumText) }}</div>
            <div>{{ formatText(eqMessage.hypocenterText) }}</div>
            <div>{{ formatText(eqMessage.depthText) }}</div>
            <div>{{ formatText(eqMessage.originTimeText) }}</div>
            <div>{{ formatText(eqMessage.magnitudeText) }}</div>
            <div>{{ formatText(eqMessage.maxIntensityText) }}</div>
            <div v-if="props.source == 'jmaEqlist'">{{ formatText(eqMessage.info) }}</div>
            <div>经过时间: {{ formatText(msToTime(passedTimeFromOrigin)) }}</div>
            <div>WebSocket状态: {{ statusCode >= 0 && statusCode <= 5?statusList[statusCode]:'N/A' }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
import { formatText, msToTime, calcPassedTime, sendNotification, setClassName } from '@/utils/Utils';
import { useTimeStore } from '@/stores/time';
import { useSettingsStore } from '@/stores/settings';
import '@/assets/background.css'
import '@/assets/opacity.css'
import router from '@/router';

const statusList = ['正在连接', '已连接', '正在断开', '已断开', '未连接', '不使用']
const eqMessage = reactive({
    id: '',
    isEew: false,
    reportNum: 0,
    reportNumText: '',
    reportTime: '',
    isWarn: false,
    isFinal: false,
    isCanceled: false,
    title: '',
    titleText: '',
    hypocenter: '',
    hypocenterText: '',
    lat: 0,
    lng: 0,
    depth: 0,
    depthText: '',
    originTime: '',
    originTimeText: '',
    magnitude: 0,
    magnitudeText: '',
    useShindo: false,
    maxIntensity: '',
    maxIntensityText: '',
    className: '',
    info: '',
})
const props = defineProps({
    source: String,
})
const timeStore = useTimeStore()
const settingsStore = useSettingsStore()
const useWebSocket = ['jmaEew', 'scEew', 'fjEew', 'jmaEqlist', 'cencEqlist']
const useJst = ['jmaEew', 'jmaEqlist']
let request, socketObj;
const urls = eqUrls;
let protocol = 'http', httpInterval = 1000
const setEqMessage = (data)=>{
    switch(props.source){
        case 'jmaEew':{
            eqMessage.id = data.EventID
            eqMessage.isEew = true
            eqMessage.reportNum = data.Serial
            eqMessage.reportNumText = '第' + data.Serial + '報' + (data.isFinal?'（最終）':'')
            eqMessage.reportTime = data.AnnouncedTime
            eqMessage.isWarn = data.isWarn
            eqMessage.isCanceled = data.isCancel
            eqMessage.isFinal = data.isFinal
            eqMessage.title = data.Title
            eqMessage.titleText = data.Title + (data.isCancel?'（取消）':'')
            eqMessage.hypocenter = data.Hypocenter
            eqMessage.hypocenterText = '震源地: ' + data.Hypocenter
            eqMessage.lat = data.Latitude
            eqMessage.lng = data.Longitude
            eqMessage.depth = data.Depth
            eqMessage.depthText = '深さ: ' + data.Depth + 'km'
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '発震時刻: ' + data.OriginTime + ' (JST)'
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = 'マグニチュード: ' + data.Magunitude.toFixed(1)
            eqMessage.useShindo = true
            eqMessage.maxIntensity = data.MaxIntensity
            eqMessage.maxIntensityText = '推定最大震度: ' + data.MaxIntensity
            eqMessage.className = setClassName(data.MaxIntensity, true)
            break
        }
        case 'cwaEew':{
            eqMessage.id = data.ID
            eqMessage.isEew = true
            eqMessage.reportNum = data.ReportNum
            eqMessage.reportNumText = '第' + data.ReportNum + '報'
            eqMessage.reportTime = data.ReportTime
            eqMessage.isWarn = data.MaxIntensity >= '5'
            eqMessage.isCanceled = data.isCancel
            eqMessage.titleText = '中央氣象署地震速報' + (data.isCancel?'（取消）':'')
            eqMessage.hypocenter = data.HypoCenter
            eqMessage.hypocenterText = '震央: ' + data.HypoCenter
            eqMessage.lat = data.Latitude
            eqMessage.lng = data.Longitude
            eqMessage.depth = data.Depth
            eqMessage.depthText = '深度: ' + data.Depth + 'km'
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '時間: ' + data.OriginTime
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = '規模: ' + data.Magunitude.toFixed(1)
            eqMessage.useShindo = true
            eqMessage.maxIntensity = data.MaxIntensity
            eqMessage.maxIntensityText = '預估最大震度: ' + data.MaxIntensity
            eqMessage.className = setClassName(data.MaxIntensity, true)
            break
        }
        case 'scEew':{
            eqMessage.id = data.ID
            eqMessage.isEew = true
            eqMessage.reportNum = data.ReportNum
            eqMessage.reportNumText = '第' + data.ReportNum + '报'
            eqMessage.reportTime = data.ReportTime
            eqMessage.isWarn = data.MaxIntensity >= 6.5
            eqMessage.titleText = '四川地震局地震预警'
            eqMessage.hypocenter = data.HypoCenter
            eqMessage.hypocenterText = '震源: ' + data.HypoCenter
            eqMessage.lat = data.Latitude
            eqMessage.lng = data.Longitude
            eqMessage.depth = data.Depth
            eqMessage.depthText = '深度: ' + (data.Depth?data.Depth + 'km':'不明')
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
            eqMessage.maxIntensity = data.MaxIntensity.toFixed(0)
            eqMessage.maxIntensityText = '估计最大烈度: ' + data.MaxIntensity.toFixed(1)
            eqMessage.className = setClassName(data.MaxIntensity.toFixed(0), false)
            break
        }
        case 'fjEew':{
            eqMessage.id = data.EventID
            eqMessage.isEew = true
            eqMessage.reportNum = data.ReportNum
            eqMessage.reportNumText = '第' + data.ReportNum + '报' + (data.isFinal?'（最终）':'')
            eqMessage.reportTime = data.ReportTime
            eqMessage.isFinal = data.isFinal
            eqMessage.titleText = '福建地震局地震预警'
            eqMessage.hypocenter = data.HypoCenter
            eqMessage.hypocenterText = '震源: ' + data.HypoCenter
            eqMessage.lat = data.Latitude
            eqMessage.lng = data.Longitude
            eqMessage.depthText = '深度: 不明'
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
            eqMessage.maxIntensity = '不明'
            eqMessage.maxIntensityText = '估计最大烈度: 不明'
            eqMessage.className = 'gray'
            break
        }
        case 'jmaEqlist':{
            eqMessage.id = data.md5
            eqMessage.title = data.No1.Title
            eqMessage.titleText = '日本気象庁' + data.No1.Title
            eqMessage.hypocenter = data.No1.location
            eqMessage.hypocenterText = '震源地: ' + (data.No1.location?data.No1.location:'調査中')
            eqMessage.lat = Number(data.No1.latitude)
            eqMessage.lng = Number(data.No1.longitude)
            eqMessage.depth = Number(data.No1.depth.replace('km', ''))
            eqMessage.depthText = '深さ: ' + (data.No1.location?(data.No1.depth == '0km'?'ごく浅い':data.No1.depth):'調査中')
            eqMessage.originTime = data.No1.time_full
            eqMessage.originTimeText = '発震時刻: ' + data.No1.time_full + ' (JST)'
            eqMessage.magnitude = Number(data.No1.magnitude)
            eqMessage.magnitudeText = 'マグニチュード: ' + (data.No1.magnitude?data.No1.magnitude:'調査中')
            eqMessage.useShindo = true
            if(data.No1.Title != '震源に関する情報' || !eqMessage.maxIntensity){
                eqMessage.maxIntensity = data.No1.shindo
                eqMessage.maxIntensityText = '最大震度: ' + data.No1.shindo
            }
            eqMessage.info = data.No1.info
            eqMessage.className = setClassName(data.No1.shindo, true)
            break
        }
        case 'cencEqlist':{
            eqMessage.id = data.md5
            eqMessage.reportTime = data.No1.ReportTime
            eqMessage.title = data.No1.type
            eqMessage.titleText = '中国地震台网' + (data.No1.type == 'reviewed'?'正式':'自动') + '测定'
            eqMessage.hypocenter = data.No1.location
            eqMessage.hypocenterText = '震源: ' + data.No1.location
            eqMessage.lat = Number(data.No1.latitude)
            eqMessage.lng = Number(data.No1.longitude)
            eqMessage.depth = Number(data.No1.depth)
            eqMessage.depthText = '深度: ' + data.No1.depth + 'km'
            eqMessage.originTime = data.No1.time
            eqMessage.originTimeText = '发震时间: ' + data.No1.time
            eqMessage.magnitude = Number(data.No1.magnitude)
            eqMessage.magnitudeText = '震级: ' + data.No1.magnitude
            eqMessage.maxIntensity = data.No1.intensity
            eqMessage.maxIntensityText = '估计最大烈度: ' + data.No1.intensity
            eqMessage.className = setClassName(data.No1.intensity, false)
            break
        }
        default:{
            console.log(data);
            break
        }
    }
}
const connect = (protocol)=>{
    const source = props.source + '_' + protocol
    if(protocol == 'http'){
        if(request) clearInterval(request)
        request = setInterval(() => {
            Http.get(urls[source] + `?t=${Date.now()}`).then(data=>{
                setEqMessage(data)
            })
        }, httpInterval);
    }
    else if(protocol == 'ws'){
        if(socketObj) socketObj.close()
        socketObj = new WebSocketObj(urls[source])
        socketObj.setMessageHandler((e)=>{
            let data = JSON.parse(e.data)
            if(data.type == 'heartbeat'){
                socketObj.ping()
            }
            else if(data.type == 'pong'){
                // console.log('pong', props.source);
            }
            else{
                setEqMessage(data)
            }
        })
    }
    else{
        throw new Error('Unrecognized protocol type.')
    }
}
const disconnect = ()=>{
    if(request) clearInterval(request)
    if(socketObj) socketObj.close()
}
const reconnect = ()=>{
    disconnect()
    if(protocol == 'http'){
        connect('http')
    }
    else if(protocol == 'ws'){
        connect('http')
        connect('ws')
    }
    else{
        throw new Error('Unrecognized protocol type.')
    }
}
const handleClick = ()=>{
    if(!eqMessage.isEew){
        router.push('/eq-history')
    }
}

onMounted(()=>{
    protocol = 'http'
    httpInterval = 1000
    connect('http')
    if(useWebSocket.includes(props.source)){
        setTimeout(() => {
            protocol = 'ws'
            httpInterval = 30000
            reconnect()
        }, 3000);
    }
})
onBeforeUnmount(()=>{
    disconnect()
    if(blinkController) clearInterval(blinkController)
    if(blinkTimeout) clearTimeout(blinkTimeout)
    if(timer) clearTimeout(timer)
})

const className = ref('white midOpacity')
let timer, blinkController, blinkTimeout
let blinkState = ref(true)
let isLoad = true
const blinkTime = 4000
watch(eqMessage, ()=>{
    className.value = eqMessage.className + ' midOpacity'
    let passedTime = 0
    if(isLoad){
        isLoad = false
        if(props.source == 'jmaEew'){
            passedTime = calcPassedTime(eqMessage.reportTime, 9)
        }
        else if(props.source == 'jmaEqlist'){
            passedTime = Math.max(calcPassedTime(eqMessage.originTime, 9) - 300 * 1000, 0)
        }
        else{
            passedTime = calcPassedTime(eqMessage.reportTime, 8)
        }
    }
    let time
    if(eqMessage.isEew){
        time = 300 * 1000
        if(eqMessage.isWarn){
            time = 600 * 1000
        }
    }
    else{
        time = 300 * 1000
        if(eqMessage.className == 'orange' || eqMessage.magnitude >= 6.0){
            time = 600 * 1000
        }
        if(eqMessage.className == 'red' || eqMessage.magnitude >= 7.0){
            time = 900 * 1000
        }
        if(eqMessage.className == 'purple' || eqMessage.magnitude >= 7.5){
            time = 1200 * 1000
        }
    }
    time -= passedTime
    if(time > 0){
        let notification = false
        if(eqMessage.isEew){
            if(settingsStore.mainSettings.onEew.notification) notification = true
            else if(settingsStore.mainSettings.onEewWarn.notification && eqMessage.isWarn) notification = true
        }
        else{
            if(settingsStore.mainSettings.onReport.notification) notification = true
        }
        if(notification) sendNotification(`${eqMessage.titleText}`, `${eqMessage.hypocenterText}\n${eqMessage.depthText}\n${eqMessage.magnitudeText}\n${eqMessage.maxIntensityText}`)
        if(blinkController) clearInterval(blinkController)
        blinkController = setInterval(() => {
            if(blinkState.value){
                className.value = eqMessage.className + ' highOpacity'
            }
            else{
                className.value = eqMessage.className + ' zeroOpacity'
            }
            blinkState.value = !blinkState.value
        }, 500);
        if(blinkTimeout) clearTimeout(blinkTimeout)
        blinkTimeout = setTimeout(() => {
            clearInterval(blinkController)
            blinkState.value = true
            className.value = eqMessage.className + ' highOpacity'
        }, blinkTime);
        if(timer) clearTimeout(timer)
        timer = setTimeout(() => {
            className.value = eqMessage.className + ' midOpacity'
        }, Math.max(time, blinkTime));
    }
})
const statusCode = ref()
const passedTimeFromOrigin = ref()
watch(()=>timeStore.currentTime, ()=>{
    if(useJst.includes(props.source)){
        passedTimeFromOrigin.value = calcPassedTime(eqMessage.originTime, 9)
    }
    else{
        passedTimeFromOrigin.value = calcPassedTime(eqMessage.originTime, 8)
    }
    if(socketObj) statusCode.value = socketObj.socket.readyState
    else if(!useWebSocket.includes(props.source)) statusCode.value = 5
    else statusCode.value = 4
})
</script>

<style lang="scss" scoped>
.container{
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 350px;
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
}
</style>