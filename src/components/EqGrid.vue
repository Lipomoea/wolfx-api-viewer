<template>
    <div>
        <div class="container" :style="gridStyle">
            <div :style='{fontWeight: 700}'>{{ formatText(eqMessage.title) }}</div>
            <div v-if="eqMessage.isEew">{{ formatText(eqMessage.reportNo) }}</div>
            <div>{{ formatText(eqMessage.epicCenter) }}</div>
            <div>{{ formatText(eqMessage.depth) }}</div>
            <div>{{ formatText(eqMessage.originTime) }}</div>
            <div>{{ formatText(eqMessage.magnitude) }}</div>
            <div>{{ formatText(eqMessage.maxIntensity) }}</div>
            <div v-if="props.source == 'jmaEqlist'">{{ formatText(eqMessage.info) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, computed, watch } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
import { formatNumber, formatText, compareTime } from '@/utils/Utils';
const eqMessage = reactive({
    id: '',
    isEew: false,
    reportNo: '',
    reportTime: '',
    isWarning: false,
    isFinal: false,
    isCanceled: false,
    title: '',
    epicCenter: '',
    depth: '',
    originTime: '',
    magnitude: '',
    maxIntensity: '',
    info: '',
})
const props = defineProps({
    source: String,
})
let request, socketObj;
const urls = eqUrls;
let protocol
const setEqMessage = (data)=>{
    switch(props.source){
        case 'jmaEew':{
            eqMessage.id = data.EventID
            eqMessage.isEew = true
            eqMessage.reportNo = '第' + data.Serial + '報' + (data.isFinal?'（最終）':'')
            eqMessage.reportTime = data.AnnouncedTime
            eqMessage.isWarning = data.isWarn
            eqMessage.isCanceled = data.isCancel
            eqMessage.isFinal = data.isFinal
            eqMessage.title = data.Title + (data.isCancel?'（取消）':'')
            eqMessage.epicCenter = '震源地: ' + data.Hypocenter
            eqMessage.depth = '深さ: ' + data.Depth + 'km'
            eqMessage.originTime = '発震時刻: ' + data.OriginTime + ' (JST)'
            eqMessage.magnitude = 'マグニチュード: ' + data.Magunitude
            eqMessage.maxIntensity = '推定最大震度: ' + data.MaxIntensity
            break
        }
        case 'cwaEew':{
            eqMessage.id = data.ID
            eqMessage.isEew = true
            eqMessage.reportNo = '第' + data.ReportNum + '報'
            eqMessage.reportTime = data.ReportTime
            eqMessage.isWarning = data.MaxIntensity > '4'
            eqMessage.isCanceled = data.isCancel
            eqMessage.title = '中央氣象署地震速報' + (data.isCancel?'（取消）':'')
            eqMessage.epicCenter = '震央: ' + data.HypoCenter
            eqMessage.depth = '深度: ' + data.Depth + 'km'
            eqMessage.originTime = '時間: ' + data.OriginTime
            eqMessage.magnitude = '規模: ' + data.Magunitude
            eqMessage.maxIntensity = '預估最大震度: ' + data.MaxIntensity
            break
        }
        case 'scEew':{
            eqMessage.id = data.ID
            eqMessage.isEew = true
            eqMessage.reportNo = '第' + data.ReportNum + '报'
            eqMessage.reportTime = data.ReportTime
            eqMessage.isWarning = data.MaxIntensity >= 6.5
            eqMessage.title = '四川地震局地震预警'
            eqMessage.epicCenter = '震源: ' + data.HypoCenter
            eqMessage.depth = '深度: ' + (data.Depth?data.Depth + 'km':'未知')
            eqMessage.originTime = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = '震级: ' + data.Magunitude
            eqMessage.maxIntensity = '估计最大烈度: ' + data.MaxIntensity.toFixed(1)
            break
        }
        case 'fjEew':{
            eqMessage.id = data.EventID
            eqMessage.isEew = true
            eqMessage.reportNo = '第' + data.ReportNum + '报' + (data.isFinal?'（最终）':'')
            eqMessage.reportTime = data.ReportTime
            eqMessage.isFinal = data.isFinal
            eqMessage.title = '福建地震局地震预警'
            eqMessage.epicCenter = '震源: ' + data.HypoCenter
            eqMessage.depth = '深度: 未知'
            eqMessage.originTime = '发震时间: ' + data.OriginTime
            eqMessage.magnitude = '震级: ' + data.Magunitude
            eqMessage.maxIntensity = '估计最大烈度: 未知'
            break
        }
        case 'jmaEqlist':{
            eqMessage.id = data.md5
            eqMessage.title = '日本気象庁' + data.No1.Title
            eqMessage.epicCenter = '震源地: ' + data.No1.location
            eqMessage.depth = '深さ: ' + data.No1.depth
            eqMessage.originTime = '発震時刻: ' + data.No1.time_full + ' (JST)'
            eqMessage.magnitude = 'マグニチュード: ' + data.No1.magnitude
            eqMessage.maxIntensity = '最大震度: ' + data.No1.shindo
            eqMessage.info = data.No1.info
            break
        }
        case 'cencEqlist':{
            eqMessage.id = data.md5
            eqMessage.title = '中国地震台网' + (data.No1.type == 'reviewed'?'正式':'自动') + '测定'
            eqMessage.epicCenter = '震源: ' + data.No1.location
            eqMessage.depth = '深度: ' + data.No1.depth + 'km'
            eqMessage.originTime = '发震时间: ' + data.No1.time
            eqMessage.magnitude = '震级: ' + data.No1.magnitude
            eqMessage.maxIntensity = '估计最大烈度: ' + data.No1.intensity
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
    // console.log(protocol);
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[source]).then(data=>{
                    setEqMessage(data)
                })
            }, 1000);
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
    connect(protocol)
}

onMounted(()=>{
    protocol = 'http'
    connect(protocol)
    if(props.source != 'cwaEew'){
        setTimeout(() => {
            disconnect()
            protocol = 'ws'
            connect(protocol)
        }, 3000);
    }
    setTimeout(() => {
        gridStyle.backgroundColor = '#ffffff'
    }, 10000);
})
onBeforeUnmount(()=>{
    disconnect()
})

const gridStyle = reactive({
    backgroundColor: '#ffffff'
})
let time, timer
watch(eqMessage,()=>{
    let color = '#ffffff'
    time = 0
    if(eqMessage.isEew){
        color = '#ffff00'
        time = 300 * 1000
        switch(props.source){
            case 'jmaEew':
            case 'cwaEew':
            case 'scEew':{
                if(eqMessage.isWarning){
                    color = '#ff0000'
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
                if(eqMessage.maxIntensity.split(' ')[1] > '4'){
                    color = '#ffff00'
                    time = 300 * 1000
                }
                break
            }
            case 'cencEqlist':{
                if(eqMessage.maxIntensity.split(' ')[1] > '6'){
                    color = '#ffff00'
                    time = 300 * 1000
                }
                break
            }
        }
    }
    gridStyle.backgroundColor = color
    if(timer) clearTimeout(timer)
    timer = setTimeout(() => {
        gridStyle.backgroundColor = '#ffffff'
    }, time);
})
</script>

<style lang="scss" scoped>
.container{
    width: 400px;
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    border: black 1px solid;
    .button{
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }
}
</style>