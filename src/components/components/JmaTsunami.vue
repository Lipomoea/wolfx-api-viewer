<template>
    <div class="outer">
        <div class="container" @click="handleClick">
            <div class="title">津波到達予想</div>
            <div class="receive">{{ statusStore.tsunamiMessage.jmaTsunami.reportTime }} (UTC+9) 発表</div>
            <div class="details">
                <div class="group" v-if="warnAreaByGrade.MajorWarning">
                    <div class="sub-title info">
                        <div class="purple">大津波警報</div>
                        <div class="purple">到達予想</div>
                        <div class="purple">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade.MajorWarning" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description font-purple">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
                <div class="group" v-if="warnAreaByGrade.Warning">
                    <div class="sub-title info">
                        <div class="red">津波警報</div>
                        <div class="red">到達予想</div>
                        <div class="red">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade.Warning" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description font-red">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
                <div class="group" v-if="warnAreaByGrade.Watch">
                    <div class="sub-title info">
                        <div class="yellow">津波注意報</div>
                        <div class="yellow">到達予想</div>
                        <div class="yellow">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade.Watch" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description font-black">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import '@/assets/background.css';
import { defaultTsunamiMessage, useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { computed, watch, inject } from 'vue';
import { focusWindow, openUrl, playSound, sendMyNotification } from '@/utils/Utils';
import { iconUrls } from '@/utils/Urls';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const handleTempEqlists = inject('handleTempEqlists')
const warnAreaByGrade = computed(() => {
    const warnAreaByGrade = {}
    const warnArea = JSON.parse(statusStore.tsunamiMessage.jmaTsunami.warnArea)
    warnArea.forEach(item => {
        const grade = item.grade
        if(!warnAreaByGrade[grade]) warnAreaByGrade[grade] = []
        warnAreaByGrade[grade].push(item)
    })
    return warnAreaByGrade
})

const formatArrival = (condition, arrivalTime) => {
    if(condition) {
        switch(condition) {
            case '津波到達中と推測':
                return '到達か'
            case 'ただちに津波来襲と予測':
                return 'すぐ来る'
            case '第１波の到達を確認':
                return 'すでに到達'
            default:
                return condition
        }
    }
    else {
        return arrivalTime.slice(8, -3).replace(' ', '日 ')
    }
}
const formatDescription = description => description.replace('０', '0').replace('１', '1').replace('３', '3').replace('５', '5').replace('ｍ', 'm')
const handleClick = ()=>{
    openUrl('https://typhoon.yahoo.co.jp/weather/jp/tsunami/')
}

let oldMessage = Object.assign({}, defaultTsunamiMessage)
let currentStatus = 'notsunami'
watch(() => statusStore.map, newVal => {
    if(newVal !== null) {
        watch(() => statusStore.tsunamiMessage.jmaTsunami, newMessage => {
            let title, body, icon, speech, playEws = false, shouldFocus = true
            if(newMessage.status > oldMessage.status) {
                currentStatus = `tsunami${newMessage.status}issue`
                title = newMessage.title + 'が発表されました'
                body = newMessage.status > 1 ? '今すぐ避難！' : '海岸から離れてください。'
                icon = newMessage.status > 1 ? iconUrls.warn : iconUrls.caution
                speech = currentStatus
                playEws = newMessage.status > 1
            }
            else if(newMessage.status < oldMessage.status) {
                if(newMessage.status == 0) {
                    currentStatus = `tsunami${oldMessage.status}cancel`
                    title = oldMessage.title + 'が解除されました'
                    body = '今後の情報に注意してください。'
                    icon = iconUrls.info
                    speech = currentStatus
                }
                else {
                    currentStatus = `tsunami${newMessage.status}switch`
                    title = newMessage.title + 'に切り替えられました'
                    body = '今後の情報に注意してください。'
                    icon = iconUrls.info
                    speech = currentStatus
                }
            }
            else {
                if(newMessage.status == 0) {
                    currentStatus = 'notsunami'
                    shouldFocus = false
                }
                else {
                    currentStatus = `tsunami${newMessage.status}update`
                    title = newMessage.title + 'が更新されました'
                    body = newMessage.status > 1 ? '今すぐ避難！' : '海岸から離れてください。'
                    icon = newMessage.status > 1 ? iconUrls.warn : iconUrls.caution
                    speech = currentStatus
                }
            }
            const { notification, sound, focus } = settingsStore.mainSettings.onTsunami
            if(notification && title) {
                sendMyNotification(title, body, icon)
            }
            if(sound && speech) {
                if(playEws) {
                    setTimeout(() => {
                        playSound("ews")
                    }, 1500);
                    setTimeout(() => {
                        playSound(speech)
                    }, 12000);
                }
                else {
                    playSound(speech)
                }
            }
            if(focus && shouldFocus) {
                focusWindow()
            }
            if(shouldFocus) handleTempEqlists(settingsStore.mainSettings.tempTsunamiDuration * 1000, 'jmaTsunami')
            Object.assign(oldMessage, newMessage)
        }, { immediate: true, deep: true })
    }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    .container{
        position: relative;
        overflow: hidden;
        width: 100%;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background-color: #dfdfdf;
        border-radius: 10px;
        user-select: none;
        .title {
            font-size: 24px;
            font-weight: 700;
        }
        .receive {
            color: #7f7f7f;
            font-size: 14px;
        }
        .details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            gap: 5px;
            .group {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                .sub-title {
                    font-size: 20px;
                }
                .info {
                    width: 100%;
                    height: 30px;
                    display: grid;
                    grid-template-columns: 5fr 3fr 2fr;
                    gap: 2px;
                    :nth-child(1) {
                        justify-content: flex-start;
                        padding-left: 5px;
                    }
                    div {
                        width: 100%;
                        height: 100%;
                        justify-self: center;
                        align-self: center;
                        font-size: 18px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .name,.arrival-time {
                        background-color: #0000007f;
                    }
                    .name {
                        color: white;
                    }
                    .arrival-time {
                        color: var(--yellow);
                    }
                    .description {
                        background-color: #ffffff7f;
                    }
                    .font-purple {
                        color: var(--purple);
                    }
                    .font-red {
                        color: var(--red);
                    }
                    .font-black {
                        color: black;
                    }
                    .small {
                        font-size: 16px;
                    }
                }
            }
        }
    }
}
</style>