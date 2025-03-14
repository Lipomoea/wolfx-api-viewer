<template>
    <div class="outer">
        <div class="container" @click="handleClick">
            <div class="title">津波到達予想</div>
            <div class="receive">{{ statusStore.tsunamiMessage.jmaTsunami.reportTime }} (UTC+9) 受信</div>
            <div class="details">
                <div class="sub-title purple" v-if="warnAreaByGrade.MajorWarning">大津波警報</div>
                <div class="group" v-if="warnAreaByGrade.MajorWarning">
                    <div class="info" v-for="(item, index) of warnAreaByGrade.MajorWarning" :key="index">
                        <div class="name">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description purple">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
                <div class="sub-title red" v-if="warnAreaByGrade.Warning">津波警報</div>
                <div class="group" v-if="warnAreaByGrade.Warning">
                    <div class="info" v-for="(item, index) of warnAreaByGrade.Warning" :key="index">
                        <div class="name">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description red">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
                <div class="sub-title yellow" v-if="warnAreaByGrade.Watch">津波注意報</div>
                <div class="group" v-if="warnAreaByGrade.Watch">
                    <div class="info" v-for="(item, index) of warnAreaByGrade.Watch" :key="index">
                        <div class="name">{{ item.name }}</div>
                        <div class="arrival-time">{{ formatArrival(item.condition, item.arrivalTime) }}</div>
                        <div class="description yellow">{{ formatDescription(item.description) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defaultTsunamiMessage, useStatusStore } from '@/stores/status';
import { useSettingsStore } from '@/stores/settings';
import { computed, watch, inject } from 'vue';
import { focusWindow, playSound, sendMyNotification } from '@/utils/Utils';
import { chimeUrls, iconUrls, tsunamiUrls } from '@/utils/Urls';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
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
    window.open(tsunamiUrls.jmaTsunami_http, '_blank')
}

let map
let unwatchSource
let oldMessage = Object.assign({}, defaultTsunamiMessage)
let currentStatus = 'notsunami'
watch(() => statusStore.map, newVal => {
    if(newVal !== null) {
        map = newVal
        unwatchSource = watch(() => statusStore.tsunamiMessage.jmaTsunami, newMessage => {
            let title, body, icon, speech, playEws = false, shouldFocus = true
            const soundEffect = settingsStore.mainSettings.soundEffect
            if(newMessage.status > oldMessage.status) {
                currentStatus = `tsunami${newMessage.status}issue`
                title = newMessage.title + 'が発表されました'
                body = newMessage.status > 1 ? '今すぐ避難！' : '海岸から離れてください。'
                icon = newMessage.status > 1 ? iconUrls.warn : iconUrls.caution
                speech = chimeUrls[soundEffect][currentStatus]
                playEws = newMessage.status > 1
            }
            else if(newMessage.status < oldMessage.status) {
                if(newMessage.status == 0) {
                    currentStatus = `tsunami${oldMessage.status}cancel`
                    title = oldMessage.title + 'が解除されました'
                    body = '今後の情報に注意してください。'
                    icon = iconUrls.info
                    speech = chimeUrls[soundEffect][currentStatus]
                }
                else {
                    currentStatus = `tsunami${newMessage.status}switch`
                    title = newMessage.title + 'に切り替えられました'
                    body = '今後の情報に注意してください。'
                    icon = iconUrls.info
                    speech = chimeUrls[soundEffect][currentStatus]
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
                    speech = chimeUrls[soundEffect][currentStatus]
                }
            }
            const { notification, sound, focus } = settingsStore.mainSettings.onTsunami
            if(notification && title) {
                sendMyNotification(title, body, icon, settingsStore.mainSettings.muteNotification)
            }
            if(sound && speech) {
                if(playEws) {
                    playSound(chimeUrls.general.ews)
                    setTimeout(() => {
                        playSound(speech)
                    }, 11000);
                }
                else {
                    playSound(speech)
                }
            }
            if(focus && shouldFocus) {
                focusWindow()
            }
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
        min-width: 410px;
        margin-bottom: 10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        background-color: #dfdfdf;
        border: #7f7f7f 1px solid;
        border-radius: 20px;
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
            gap: 5px;
            .sub-title {
                font-size: 20px;
                height: 24px;
                padding: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .group {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                .info {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 5fr 3fr 2fr;
                    column-gap: 5px;
                    div {
                        height: 30px;
                        justify-self: center;
                        align-self: center;
                        font-size: 18px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .arrival-time {
                        padding: 0 5px;
                        border: #7f7f7f 1px solid;
                        border-radius: 5px;
                        width: 100%;
                    }
                    .description {
                        width: 65px;
                        height: 100%;
                    }
                }
            }
        }
    }
}
</style>