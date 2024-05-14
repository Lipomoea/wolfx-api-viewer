<template>
    <div>
        <div class="container">
            <div>{{ eewMessage }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive } from 'vue'
import Http from '@/utils/Http';
import WebSocketObj from '@/utils/WebSocket';
import { eqUrls } from '@/utils/Url';
const eewMessage = reactive({})
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
                    Object.assign(eewMessage, res)
                })
            }, 1000);
            break;
        }
        case 'ws': {
            socketObj = new WebSocketObj(urls[source])
            socketObj.setMessageHandler((e)=>{
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