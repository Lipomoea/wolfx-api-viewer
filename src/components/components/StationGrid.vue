<template>
    <div class="outer">
        <div class="container" :style="gridStyle">
            <div :style='{fontWeight: 700}'>站点: {{ source }}{{ stationMessage.PGA_EW?'':'*' }}</div>
            <div>PGA: {{ formatNumber(stationMessage.PGA, 3) }} gal</div>
            <div>PGV: {{ formatNumber(stationMessage.PGV, 3) }} cm/s</div>
            <div>计测震度: {{ formatNumber(stationMessage.CalcShindo, 2) }}</div>
            <div>2min计测震度: {{ formatNumber(stationMessage.Max_CalcShindo, 2) }}</div>
            <div>{{ stationMessage.update_at?stationMessage.update_at:'N/A' }}</div>
            <div>WebSocket状态: {{ statusCode?statusList[statusCode]:'N/A' }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch } from 'vue'
import WebSocketObj from '@/utils/WebSocket';
import { formatNumber, compareTime } from '@/utils/Utils';
const stationMessage = reactive({})
const statusCode = ref()
const props = defineProps({
    source: String,
    url: String,
    currentTime: String,
})
let socketObj
const { source, url } = props
const statusList = ['正在连接', '已连接', '正在断开', '已断开']

const connect = ()=>{
    socketObj = new WebSocketObj(url)
    socketObj.setMessageHandler((e)=>{
        let data = JSON.parse(e.data)
        if(data.type != 'heartbeat'){
            Object.assign(stationMessage, data);
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
const gridStyle = computed(()=>{
    let color = '#ffffff'
    if(statusCode.value == '1'){
        let isLatest = compareTime(stationMessage.update_at, 8, 10000)
        if(isLatest){
            color = '#3fafff'
            if(stationMessage.Max_CalcShindo >= 0.5){
                color = '#7fff1f'
            }
            if(stationMessage.Max_CalcShindo >= 2.5){
                color = '#ffff00'
            }
            if(stationMessage.Max_CalcShindo >= 4.5){
                color = '#ff7f00'
            }
            if(stationMessage.Max_CalcShindo >= 5.5){
                color = '#ff0000'
            }
            if(stationMessage.Max_CalcShindo >= 6.5){
                color = '#cf00af'
            }
        }
        else if(stationMessage.update_at){
            color = '#cfcfcf'
        }
    }
    
    return {
        backgroundColor: color
    }
})

onMounted(()=>{
    connect()
})
onBeforeUnmount(()=>{
    disconnect()
})
watch(()=>props.currentTime, ()=>{
    statusCode.value = socketObj.socket.readyState
})
</script>

<style lang="scss" scoped>
.outer{
    // flex: 1 1 200px;
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