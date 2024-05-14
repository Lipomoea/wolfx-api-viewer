<template>
    <div>
        {{ stationMessage.Max_CalcShindo }}
        <button @click="closeConnection">Disconnect</button>
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

</style>