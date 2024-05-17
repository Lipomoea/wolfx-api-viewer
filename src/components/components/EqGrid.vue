<template>
    <div class="outer">
        <div class="container" :style="gridStyle">
            <div :style='{fontWeight: 700}'>{{ formatText(eqMessage.titleText) }}</div>
            <div v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNumText) }}</div>
            <div>{{ formatText(eqMessage.hypocenterText) }}</div>
            <div>{{ formatText(eqMessage.depthText) }}</div>
            <div>{{ formatText(eqMessage.originTimeText) }}</div>
            <div>{{ formatText(eqMessage.magnitudeText) }}</div>
            <div>{{ formatText(eqMessage.maxIntensityText) }}</div>
            <div v-if="props.source == 'jmaEqlist'">{{ formatText(eqMessage.info) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
import { formatNumber, formatText, compareTime } from '@/utils/Utils';
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
    maxIntensity: '',
    maxIntensityText: '',
    info: '',
})
const props = defineProps({
    source: String,
})
const useWebSocket = ['jmaEew', 'scEew', 'fjEew', 'jmaEqlist', 'cencEqlist']
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
            eqMessage.maxIntensity = data.MaxIntensity
            eqMessage.maxIntensityText = '推定最大震度: ' + data.MaxIntensity
            break
        }
        case 'cwaEew':{
            eqMessage.id = data.ID
            eqMessage.isEew = true
            eqMessage.reportNum = data.ReportNum
            eqMessage.reportNumText = '第' + data.ReportNum + '報'
            eqMessage.reportTime = data.ReportTime
            eqMessage.isWarn = data.MaxIntensity > '4'
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
            eqMessage.maxIntensity = data.MaxIntensity
            eqMessage.maxIntensityText = '預估最大震度: ' + data.MaxIntensity
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
            eqMessage.depthText = '深度: ' + (data.Depth?data.Depth + 'km':'未知')
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
            eqMessage.maxIntensity = data.MaxIntensity.toFixed(1)
            eqMessage.maxIntensityText = '估计最大烈度: ' + data.MaxIntensity.toFixed(1)
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
            eqMessage.depthText = '深度: 未知'
            eqMessage.originTime = data.OriginTime
            eqMessage.originTimeText = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = data.Magunitude
            eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
            eqMessage.maxIntensityText = '估计最大烈度: 未知'
            break
        }
        case 'jmaEqlist':{
            eqMessage.id = data.md5
            eqMessage.title = data.No1.Title
            eqMessage.titleText = '日本気象庁' + data.No1.Title
            eqMessage.hypocenter = data.No1.location
            eqMessage.hypocenterText = '震源地: ' + data.No1.location
            eqMessage.lat = Number(data.No1.latitude)
            eqMessage.lng = Number(data.No1.longitude)
            eqMessage.depth = Number(data.No1.depth.replace('km', ''))
            eqMessage.depthText = '深さ: ' + (data.No1.depth == '0km'?'ごく浅い':data.No1.depth)
            eqMessage.originTime = data.No1.time_full
            eqMessage.originTimeText = '発震時刻: ' + data.No1.time_full + ' (JST)'
            eqMessage.magnitude = Number(data.No1.magnitude)
            eqMessage.magnitudeText = 'マグニチュード: ' + data.No1.magnitude
            eqMessage.maxIntensity = data.No1.shindo
            eqMessage.maxIntensityText = '最大震度: ' + data.No1.shindo
            eqMessage.info = data.No1.info
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
            break
        }
        default:{
            console.log(data);
            break
        }
    }
}
const connect = ()=>{
    const source = props.source + '_' + protocol
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[source] + `?t=${Date.now()}`).then(data=>{
                    setEqMessage(data)
                })
            }, httpInterval);
            break;
        }
        case 'ws': {
            socketObj = new WebSocketObj(urls[source])
            socketObj.setMessageHandler((e)=>{
                let data = JSON.parse(e.data)
                if(data.type != 'heartbeat'){
                    setEqMessage(data)
                }
            })
            break;
        }
        default: {
            throw new Error('Unrecognized protocol type.')
        }
    }
}
const disconnect = ()=>{
    if(request) clearInterval(request)
    if(socketObj) socketObj.close()
}
const reconnect = ()=>{
    disconnect()
    connect()
}

onMounted(()=>{
    protocol = 'http'
    httpInterval = 1000
    connect()
    if(useWebSocket.includes(props.source)){
        setTimeout(() => {
            disconnect()
            httpInterval = 30000
            connect()
            protocol = 'ws'
            connect()
        }, 3000);
    }
})
onBeforeUnmount(()=>{
    disconnect()
    if(blinkController) clearInterval(blinkController)
    if(blinkTimeout) clearTimeout(blinkTimeout)
    if(timer) clearTimeout(timer)
})

const gridStyle = reactive({
    backgroundColor: '#ffffff'
})
let timer, blinkController, blinkTimeout
let blinkState = ref(true)
let isLoad = true
watch(eqMessage, ()=>{
    if(isLoad){
        isLoad = false
        if(eqMessage.isEew){
            if(props.source == 'jmaEew'){
                if(!compareTime(eqMessage.reportTime, 9, 300 * 1000)){
                    return
                }
            }
            else{
                if(!compareTime(eqMessage.reportTime, 8, 300 * 1000)){
                    return
                }
            }
        }
        else{
            if(props.source == 'jmaEqlist'){
                if(!compareTime(eqMessage.originTime, 9, 600 * 1000)){
                    return
                }
            }
            else{
                if(!compareTime(eqMessage.reportTime, 8, 300 * 1000)){
                    return
                }
            }
        }
    }
    let color, time
    if(eqMessage.isEew){
        color = '#ff7f00'
        time = 300 * 1000
        switch(props.source){
            case 'jmaEew':
            case 'cwaEew':
            case 'scEew':{
                if(eqMessage.isWarn){
                    color = '#ff0000'
                    time = 600 * 1000
                }
                break
            }
        }
    }
    else{
        color = '#3fafff'
        time = 180 * 1000
        switch(props.source){
            case 'jmaEqlist':{
                if(eqMessage.maxIntensity >= '3' || eqMessage.magnitude >= 5.0 || eqMessage.info.includes('若干の海面変動')){
                    color = '#ffff00'
                    time = 300 * 1000
                }
                if(eqMessage.maxIntensity >= '5' || eqMessage.magnitude >= 6.0 || eqMessage.info.includes('津波警報')){
                    color = '#ff7f00'
                    time = 600 * 1000
                }
                if(eqMessage.maxIntensity >= '6' || eqMessage.magnitude >= 7.0){
                    color = '#ff0000'
                    time = 900 * 1000
                }
                if(eqMessage.info.includes('津波警報')){
                    time = 1200 * 1000
                }
                break
            }
            case 'cencEqlist':{
                if(eqMessage.maxIntensity >= '5' || eqMessage.magnitude >= 5.0){
                    color = '#ffff00'
                    time = 300 * 1000
                }
                if(eqMessage.maxIntensity >= '7' || eqMessage.magnitude >= 6.0){
                    color = '#ff7f00'
                    time = 600 * 1000
                }
                if(eqMessage.maxIntensity >= '9' || eqMessage.magnitude >= 7.0){
                    color = '#ff0000'
                    time = 900 * 1000
                }
                break
            }
        }
    }
    if(blinkController) clearInterval(blinkController)
    blinkController = setInterval(() => {
        if(blinkState.value){
            gridStyle.backgroundColor = color
        }
        else{
            gridStyle.backgroundColor = '#ffffff'
        }
        blinkState.value = !blinkState.value
    }, 500);
    if(blinkTimeout) clearTimeout(blinkTimeout)
    blinkTimeout = setTimeout(() => {
        clearInterval(blinkController)
        blinkState.value = true
        gridStyle.backgroundColor = color
    }, 4000);
    if(timer) clearTimeout(timer)
    timer = setTimeout(() => {
        gridStyle.backgroundColor = '#ffffff'
    }, time);
})
</script>

<style lang="scss" scoped>
.outer{
    // flex: 1 1 400px;
    .container{
        width: 100%;
        height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        border: black 1px solid;
        border-radius: 5px;
    }
}
</style>