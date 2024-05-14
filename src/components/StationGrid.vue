<template>
    <div>
        <div class="container">
            <div>PGA: {{ stationMessage.PGA }}</div>
            <div>PGV: {{ stationMessage.PGV }}</div>
            <div>计测震度: {{ stationMessage.CalcShindo }}</div>
            <div>最大计测震度: {{ stationMessage.Max_CalcShindo }}</div>
            <button @click="closeConnection">Disconnect</button>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, defineProps } from 'vue'
import Http from '@/utils/Http';
import WebSocketEew from '@/utils/WebSocket';
import { stationUrls } from '@/utils/Url';
const stationMessage = reactive({})
const props = defineProps({
    source: String,
})
let request, socket;
const urls = stationUrls;
onMounted(()=>{
    const source = props.source
    const split_string = source.split('_')
    const protocol = split_string[split_string.length - 1]
    // console.log(protocol);
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[props.source]).then(res=>{
                    Object.assign(stationMessage, res)
                })
            }, 1000);
            break;
        }
        case 'ws': {
            socket = new WebSocketEew(urls[props.source])
            socket.setMessageHandler((e)=>{
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
})
const closeConnection = ()=>{
    if(request) clearInterval(request)
    if(socket) socket.ws.close()
}
onBeforeUnmount(()=>{
    closeConnection()
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
}
</style>