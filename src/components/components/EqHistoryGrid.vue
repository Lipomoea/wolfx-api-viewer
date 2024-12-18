<template>
    <div>
        <div class="container">
            <div class="title">{{ title }}</div>
            <div class="item white" v-for="(item, index) of eqList" :key="index" @click="handleClick(item)">
                <div class="intensity" :class="item.className">
                    <div :class="props.source != 'cencEqlist' && item.maxIntensity != '不明'?'shindo':'csis'">
                        {{ item.maxIntensity == '不明'?'?':item.maxIntensity }}
                    </div>
                </div>
                <div class="right">
                    <div class="location">{{ item.hypocenter }}</div>
                    <div class="rightBottom">
                        <div class="timeDepth">
                            <div class="time">{{ item.originTime + (useJst?' (UTC+9)':' (UTC+8)') }}</div>
                            <div class="depth">{{ item.depth }}</div>
                        </div>
                        <div class="magnitude">M{{ item.magnitude }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import Http from '@/classes/Http';
import { eqUrls } from '@/utils/Urls';
import { setClassName, stampToTime } from '@/utils/Utils';
import '@/assets/background.css'
import '@/assets/opacity.css'
const props = defineProps({
    source: String,
})
const eqList = reactive([])
const httpInterval = 10000
const maxHistoryNumber = 50
let request
const source = props.source + '_http'
const shindoScale = ['0', '1', '2', '3', '4', '5-', '5+', '6-', '6+', '7']

const getEqList = ()=>{
    Http.get(eqUrls[source] + `?t=${Date.now()}`).then(data=>{
        if(props.source != 'cwaEqlist') {
            let keys = Object.keys(data)
            for(let i = 0; i < maxHistoryNumber; i++){
                switch(props.source){
                    case 'jmaEqlist':{
                        eqList[i] = {
                            id: data[keys[i]].EventID,
                            originTime: data[keys[i]].time_full,
                            hypocenter: data[keys[i]].location,
                            depth: data[keys[i]].depth == '0km'?'ごく浅い':data[keys[i]].depth,
                            magnitude: data[keys[i]].magnitude,
                            maxIntensity: data[keys[i]].shindo,
                            className: setClassName(data[keys[i]].shindo, true)
                        }
                        break
                    }
                    case 'cencEqlist':{
                        eqList[i] = {
                            id: data[keys[i]].EventID,
                            originTime: data[keys[i]].time,
                            hypocenter: data[keys[i]].location,
                            depth: data[keys[i]].depth + 'km',
                            magnitude: data[keys[i]].magnitude,
                            maxIntensity: data[keys[i]].intensity,
                            className: setClassName(data[keys[i]].intensity, false)
                        }
                        break
                    }
                }
            }
        }
        else {
            for(let i = 0; i < maxHistoryNumber; i++){
                eqList[i] = {
                    id: data[i].id,
                    originTime: stampToTime(data[i].time, 8),
                    hypocenter: data[i].loc.split(' ').slice(-1)[0].slice(3, -1),
                    depth: data[i].depth + 'km',
                    magnitude: data[i].mag.toFixed(1),
                    maxIntensity: shindoScale[data[i].int],
                    className: setClassName(shindoScale[data[i].int], true)
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
        case 'cwaEqlist':{
            return '中央氣象署地震報告'
        }
        case 'cencEqlist':{
            return '中国地震台网地震信息'
        }
    }
})
const useJst = props.source.includes('jma')
const handleClick = (item)=>{
    switch(props.source){
        case 'jmaEqlist':{
            const url = `https://typhoon.yahoo.co.jp/weather/jp/earthquake/${item.id}.html?t=2`
            window.open(url, '_blank')
            break
        }
    }
}
onMounted(()=>{
    getEqList()
    clearInterval(request)
    request = setInterval(() => {
        getEqList()
    }, httpInterval);
})
onBeforeUnmount(()=>{
    clearInterval(request)
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
        cursor: default;
        .intensity{
            width: 80px;
            height: 80px;
            pointer-events: none;
            border-right: black 1px solid;
            user-select: none;
            display: flex;
            justify-content: center;
            align-items: center;
            .shindo,.csis{
                text-align: center;
                letter-spacing: -5px;
                padding-right: 5px;
            }
            .shindo{
                font-size: 50px;
            }
            .shindo::first-letter{
                font-size: 70px;
                vertical-align: top;
            }
            .csis{
                font-size: 70px;
            }
        }
        .right{
            width: 340px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            .location{
                font-size: 1.5em;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            .rightBottom{
                display: flex;
                justify-content: space-between;
                .timeDepth{
                    .time,.depth{
                        font-size: 1.1em;
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
    }
}
</style>