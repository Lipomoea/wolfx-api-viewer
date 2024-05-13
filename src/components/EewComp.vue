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
const eewMessage = reactive({})
const props = defineProps({
    source: String,
})
const urls = {
    scEew_http: 'https://api.wolfx.jp/sc_eew.json',
    scEew_ws: 'wss://ws-api.wolfx.jp/sc_eew',
    jmaEew_http: 'https://api.wolfx.jp/jma_eew.json',
    jmaEew_ws: 'wss://ws-api.wolfx.jp/jma_eew',
    fjEew_http: 'https://api.wolfx.jp/fj_eew.json',
    fjEew_ws: 'wss://ws-api.wolfx.jp/fj_eew',
    cwaEew_http: 'https://api.wolfx.jp/cwa_eew.json',
    cencEqlist_http: 'https://api.wolfx.jp/cenc_eqlist.json',
    cencEqlist_ws: 'wss://ws-api.wolfx.jp/cenc_eqlist',
    jmaEqlist_http: 'https://api.wolfx.jp/jma_eqlist.json',
    jmaEqlist_ws: 'wss://ws-api.wolfx.jp/jma_eqlist'
}
let request, socket;
onMounted(()=>{
    const source = props.source
    const protocol = source.split('_')[1]
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