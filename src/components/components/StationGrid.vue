<template>
    <div>
        <div class="container" @click="reconnect">
            <div class="bg" :class="className"></div>
            <div :style='{fontWeight: 700}'>站点: {{ source }}{{ stationMessage.PGA_EW?'':'*' }}</div>
            <div>PGA: {{ formatNumber(stationMessage.PGA, 3) }} gal</div>
            <div>PGV: {{ formatNumber(stationMessage.PGV, 3) }} cm/s</div>
            <div>计测震度: {{ formatNumber(stationMessage.CalcShindo, 2) }}</div>
            <div>2min计测震度: {{ formatNumber(stationMessage.Max_CalcShindo, 2) }}</div>
            <div>{{ stationMessage.update_at?stationMessage.update_at:'N/A' }}</div>
            <div>WebSocket状态: {{ statusCode >= 0 && statusCode <= 4?statusList[statusCode]:'N/A' }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue'
import WebSocketObj from '@/utils/WebSocket';
import { formatNumber, compareTime, sendNotification } from '@/utils/Utils';
import { useTimeStore } from '@/stores/time';
import '@/assets/background.css'
import '@/assets/opacity.css'

const stationMessage = reactive({})
const statusCode = ref()
const props = defineProps({
    source: String,
    url: String,
})
let socketObj
const { source, url } = props
const statusList = ['正在连接', '已连接', '正在断开', '已断开', '未连接']
const timeStore = useTimeStore()

const connect = ()=>{
    if(socketObj) socketObj.close()
    socketObj = new WebSocketObj(url)
    socketObj.setMessageHandler((e)=>{
        let data = JSON.parse(e.data)
        if(data.type == 'heartbeat'){
            socketObj.ping()
        }
        else if(data.type == 'pong'){
            // console.log('pong', props.source);
        }
        else{
            Object.assign(stationMessage, data)
        }
    })
}
const disconnect = ()=>{
    if(socketObj) socketObj.close()
}
const reconnect = ()=>{
    disconnect()
    connect()
}
const isLatest = computed(()=>compareTime(stationMessage.update_at, 8, 10000))
const className = computed(()=>{
    let className = 'white'
    if(statusCode.value == '1' && stationMessage.update_at){
        className = 'gray'
        if(isLatest.value){
            className = 'blue'
            if(stationMessage.Max_CalcShindo >= 0.5){
                className = 'green'
            }
            if(stationMessage.Max_CalcShindo >= 2.5){
                className = 'yellow'
            }
            if(stationMessage.Max_CalcShindo >= 4.5){
                className = 'orange'
            }
            if(stationMessage.Max_CalcShindo >= 5.5){
                className = 'red'
            }
            if(stationMessage.Max_CalcShindo >= 6.5){
                className = 'purple'
            }
        }
    }
    return className + ' highOpacity'
})
const shakingState = computed(()=>{
    if(stationMessage.Max_CalcShindo < 0.5) return 0
    else if(stationMessage.Max_CalcShindo < 2.5) return 1
    else if(stationMessage.Max_CalcShindo < 4.5) return 2
    else if(stationMessage.Max_CalcShindo < 5.5) return 3
    else return 4
})

onMounted(()=>{
    connect()
})
onBeforeUnmount(()=>{
    disconnect()
})
watch(()=>timeStore.currentTime, ()=>{
    if(socketObj) statusCode.value = socketObj.socket.readyState
    else statusCode.value = 4
})
watch(shakingState, (newValue, oldValue)=>{
    if((newValue > oldValue) && isLatest.value){
        if(newValue == 1) sendNotification('检测到测站摇晃', `站点: ${source}`)
        if(newValue == 2) sendNotification('检测到测站稍强摇晃', `站点: ${source}`)
        if(newValue == 3) sendNotification('检测到测站强烈摇晃', `站点: ${source}`)
        if(newValue == 4) sendNotification('检测到测站极强摇晃', `站点: ${source}`)
    }
})
</script>

<style lang="scss" scoped>
.container{
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 300px;
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
}
</style>