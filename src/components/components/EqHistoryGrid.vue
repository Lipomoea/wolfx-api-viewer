<template>
    <div>
        <div class="container">
            <div class="title">{{ title }}</div>
            <div class="item" v-for="(item, index) of eqList" 
            :key="index">
                <div class="intensity" :class="item.className">{{ item.maxIntensity == '不明'?'0':item.maxIntensity }}</div>
                <div class="mid">
                    <div class="location">{{ item.hypoCenter }}</div>
                    <div class="time">{{ item.originTime + (useJst?' (UTC+9)':' (UTC+8)') }}</div>
                    <div class="depth">{{ item.depth }}</div>
                </div>
                <div class="magnitude">M{{ item.magnitude }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Http from '@/utils/Http';
import { eqUrls } from '@/utils/Url';
import { setClassName } from '@/utils/Utils';
import '@/assets/background.css'
import '@/assets/opacity.css'
const props = defineProps({
    source: String,
})
const eqList = reactive({})
const httpInterval = 10000
const maxHistoryNumber = 50
let request
const source = props.source + '_http'
const getEqList = ()=>{
    Http.get(eqUrls[source] + `?t=${Date.now()}`).then(data=>{
        let keys = Object.keys(data)
        for(let i = 0; i < maxHistoryNumber; i++){
            switch(props.source){
                case 'jmaEqlist':{
                    eqList[i] = {
                        id: data[keys[i]].EventID,
                        originTime: data[keys[i]].time_full,
                        hypoCenter: data[keys[i]].location,
                        depth: data[keys[i]].depth,
                        magnitude: data[keys[i]].magnitude,
                        maxIntensity: data[keys[i]].shindo,
                        className: setClassName(data[keys[i]].shindo, true)
                    }
                    break
                }
                case 'cencEqlist':{
                    eqList[i] = {
                        id: i,
                        originTime: data[keys[i]].time,
                        hypoCenter: data[keys[i]].location,
                        depth: data[keys[i]].depth + 'km',
                        magnitude: data[keys[i]].magnitude,
                        maxIntensity: data[keys[i]].intensity,
                        className: setClassName(data[keys[i]].intensity, false)
                    }
                    break
                }
            }
        } 
    })
}
const title = computed(()=>{
    switch(props.source){
        case 'jmaEqlist':{
            return '日本気象庁地震情報'
        }
        case 'cencEqlist':{
            return '中国地震台网地震信息'
        }
    }
})
const useJst = computed(()=>{
    switch(props.source){
        case 'jmaEqlist':{
            return true
        }
        case 'cencEqlist':{
            return false
        }
    }
})
onMounted(()=>{
    getEqList()
    if(request) clearInterval(request)
    request = setInterval(() => {
        getEqList()
    }, httpInterval);
})
onBeforeUnmount(()=>{
    if(request) clearInterval(request)
})
</script>

<style lang="scss" scoped>
.container{
    display: flex;
    flex-direction: column;
    .title{
        font-size: 2em;
        margin-bottom: 10px;
    }
    .item{
        display: flex;
        gap: 10px;
        border: black 1px solid;
        align-items: center;
        padding-right: 10px;
        .intensity{
            width: 80px;
            height: 80px;
            font-size: 25px;
            text-align: center;
            line-height: 80px;
            pointer-events: none;
            border-right: black 1px solid;
        }
        .intensity::first-letter{
            font-size: 70px;
        }
        .mid{
            width: 250px;
            .location{
                font-size: 1.5em;
            }
            .location,.time,.depth{
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
        }
        .magnitude{
            font-size: 1.75em;
            align-self: self-end;
        }
    }
}
</style>