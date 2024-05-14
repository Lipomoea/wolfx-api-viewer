<template>
    <div>
        <div class="container">
            <div>{{ formatText(eqMessage.title) }}</div>
            <div>震源地: {{ formatText(eqMessage.epicCenter) }}</div>
            <div>深さ: {{ formatText(eqMessage.depth) }}</div>
            <div>発震時間: {{ formatText(eqMessage.originTime) }}</div>
            <div>マグニチュード: {{ formatText(eqMessage.magnitude) }}</div>
            <div>最大震度: {{ formatText(eqMessage.maxIntensity) }}</div>
            <div>情報: {{ formatText(eqMessage.info) }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
import { formatNumber, formatText, compareTime } from '@/utils/Utils';
const eqMessage = reactive({
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
const connect = ()=>{
    const protocol = 'ws'
    const source = props.source + '_' + protocol
    // console.log(protocol);
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[source]).then(res=>{
                    Object.assign(eqMessage, res)
                })
            }, 1000);
            break;
        }
        case 'ws': {
            socketObj = new WebSocketObj(urls[source])
            socketObj.setMessageHandler((e)=>{
                let data = JSON.parse(e.data)
                if(data.type != 'heartbeat'){
                    switch(source){
                        case 'jmaEqlist_ws':{
                            eqMessage.title = No1.Title
                            eqMessage.epicCenter = No1.location
                            eqMessage.depth = No1.depth
                            eqMessage.originTime = No1.time_full
                            eqMessage.magnitude = No1.magnitude
                            eqMessage.maxIntensity = No1.shindo
                            eqMessage.info = No1.info
                            break
                        }
                        case 'cencEqlist_ws':{
                            eqMessage.title = No1.type
                            eqMessage.epicCenter = No1.location
                            eqMessage.depth = No1.depth + 'km'
                            eqMessage.originTime = No1.time
                            eqMessage.magnitude = No1.magnitude
                            eqMessage.maxIntensity = No1.intensity
                            break
                        }
                    }
                    // Object.assign(eqMessage, data);
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
    connect()
})
onBeforeUnmount(()=>{
    disconnect()
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
    }
}
</style>