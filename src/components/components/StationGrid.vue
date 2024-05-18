<template>
    <div class="outer">
        <div class="container" :class="className" @click="reconnect">
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
const className = computed(()=>{
    let className = 'white'
    if(statusCode.value == '1' && stationMessage.update_at){
        className = 'gray'
        let isLatest = compareTime(stationMessage.update_at, 8, 10000)
        if(isLatest){
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
    return className
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
    .white{
        background-color: #ffffff;
    }
    .white:hover{
        background-color: #efefef;
    }
    .white:active{
        background-color: #dfdfdf;
    }
    .gray{
        background-color: #cfcfcf;
    }
    .gray:hover{
        background-color: #bfbfbf;
    }
    .gray:active{
        background-color: #afafaf;
    }
    .blue{
        background-color: #3fafff;
    }
    .blue:hover{
        background-color: #2f9fef;
    }
    .blue:active{
        background-color: #1f8fdf;
    }
    .green{
        background-color: #7fff1f;
    }
    .green:hover{
        background-color: #6fef0f;
    }
    .green:active{
        background-color: #5fdf00;
    }
    .yellow{
        background-color: #ffff00;
    }
    .yellow:hover{
        background-color: #efef00;
    }
    .yellow:active{
        background-color: #dfdf00;
    }
    .orange{
        background-color: #ff7f00;
    }
    .orange:hover{
        background-color: #ef6f00;
    }
    .orange:active{
        background-color: #df5f00;
    }
    .red{
        background-color: #df0000;
        color: #ffffff;
    }
    .red:hover{
        background-color: #cf0000;
    }
    .red:active{
        background-color: #bf0000;
    }
    .purple{
        background-color: #cf00af;
        color: #ffffff;
    }
    .purple:hover{
        background-color: #bf009f;
    }
    .purple:active{
        background-color: #af008f;
    }
}
</style>