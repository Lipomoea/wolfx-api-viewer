<template>
    <div>
        {{ eewMessage }}
        <button @click="closeConnection">Disconnect</button>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, defineProps } from 'vue'
import Http from '@/utils/Http';
import WebSocketEew from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
const eewMessage = reactive({})
const props = defineProps({
    source: String,
})
let request, socket;
const urls = eqUrls;
onMounted(()=>{
    const source = props.source
    const split_string = source.split('_')
    const protocol = split_string[split_string.length - 1]
    // console.log(protocol);
    switch(protocol){
        case 'http': {
            request = setInterval(() => {
                Http.get(urls[props.source]).then(res=>{
                    Object.assign(eewMessage, res)
                })
            }, 1000);
            break;
        }
        case 'ws': {
            socket = new WebSocketEew(urls[props.source])
            socket.setMessageHandler((e)=>{
                let data = JSON.parse(e.data)
                if(data.type != 'heartbeat'){
                    Object.assign(eewMessage, data);
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