<template>
    <div>
        <div class="container" :style="gridStyle">
            <div :style='{fontWeight: 700}'>站点: {{ stationMessage.type?stationMessage.type:'N/A' }}{{ stationMessage.PGA_EW?'':'*' }}</div>
            <div>PGA: {{ formatNumber(stationMessage.PGA, 3) }} gal</div>
            <div>PGV: {{ formatNumber(stationMessage.PGV, 3) }} cm/s</div>
            <div>计测震度: {{ formatNumber(stationMessage.CalcShindo, 2) }}</div>
            <div>2min计测震度: {{ formatNumber(stationMessage.Max_CalcShindo, 2) }}</div>
            <div>{{ stationMessage.update_at?stationMessage.update_at:'N/A' }}</div>
            <div>WebSocket状态: {{ statusCode?statusList[statusCode]:'N/A' }}</div>
            <!-- <div class="button">
                <button @click="reconnect">重新连接</button>
                <button @click="disconnect">断开连接</button>
            </div> -->
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive, computed } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { stationUrls } from '@/utils/Url';
import { formatNumber, compareTime } from '@/utils/Utils';
const stationMessage = reactive({})
const currentTime = ref(), statusCode = ref()
const props = defineProps({
    source: String,
})
let request, socketObj, clock;
const urls = stationUrls;
const statusList = ['正在连接', '已连接', '正在断开', '已断开']

const connect = ()=>{
    const source = props.source
    const split_string = source.split('_')
    const protocol = split_string[split_string.length - 1]
    // console.log(protocol);
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[source]).then(res=>{
                    Object.assign(stationMessage, res)
                })
            }, 1000);
            break;
        }
        case 'ws': {
            socketObj = new WebSocketObj(urls[source])
            socketObj.setMessageHandler((e)=>{
                let data = JSON.parse(e.data)
                if(data.type != 'heartbeat'){
                    Object.assign(stationMessage, data);
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
const gridStyle = computed(()=>{
    let color = '#ffffff'
    if(statusCode.value == '1'){
        let isLatest = compareTime(currentTime.value, stationMessage.update_at, 10000)
        if(isLatest){
            color = '#3fafff'
            if(stationMessage.Max_CalcShindo >= 0.5){
                color = '#7fff1f'
            }
            if(stationMessage.Max_CalcShindo >= 2.5){
                color = '#ffff00'
            }
            if(stationMessage.Max_CalcShindo >= 4.5){
                color = '#ff6f00'
            }
            if(stationMessage.Max_CalcShindo >= 6.5){
                color = '#cf0000'
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
    clock = setInterval(() => {
        currentTime.value = (new Date()).toISOString()
        statusCode.value = socketObj.socket.readyState
    }, 1000);
})
onBeforeUnmount(()=>{
    disconnect()
    clearInterval(clock)
})
</script>

<style lang="scss" scoped>
.container{
    width: 200px;
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
        // color: #ff6f00;
    }
}
</style>