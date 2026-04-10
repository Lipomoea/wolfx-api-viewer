<template>
    <div class="outer">
        <div class="container" @click="handleClick">
            <div class="title">自然资源部海啸预警</div>
            <div class="receive">{{ statusStore.tsunamiMessage.nmefcTsunami.reportTime }} (UTC+8) 更新</div>
            <div class="details">
                <div class="group" v-if="warnAreaByGrade['红色']">
                    <div class="sub-title info">
                        <div class="purple">大海啸警报</div>
                        <div class="purple">预计到达</div>
                        <div class="purple">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade['红色']" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ item.arrivalTime }}</div>
                        <div class="description font-purple">{{ item.description }}</div>
                    </div>
                </div>
                <div class="group" v-if="warnAreaByGrade['橙色']">
                    <div class="sub-title info">
                        <div class="red">海啸警报</div>
                        <div class="red">预计到达</div>
                        <div class="red">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade['橙色']" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ item.arrivalTime }}</div>
                        <div class="description font-red">{{ item.description }}</div>
                    </div>
                </div>
                <div class="group" v-if="warnAreaByGrade['黄色']">
                    <div class="sub-title info">
                        <div class="yellow">海啸注意报</div>
                        <div class="yellow">预计到达</div>
                        <div class="yellow">最大波</div>
                    </div>
                    <div class="info" v-for="(item, index) of warnAreaByGrade['黄色']" :key="index">
                        <div class="name" :class="item.name.length > 8 ? 'small' : ''">{{ item.name }}</div>
                        <div class="arrival-time">{{ item.arrivalTime }}</div>
                        <div class="description font-black">{{ item.description }}</div>
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
import { focusWindow, openUrl, playSound, sendMyNotification } from '@/utils/Utils';
import { iconUrls } from '@/utils/Urls';

const statusStore = useStatusStore()
const settingsStore = useSettingsStore()
const handleTempEqlists = inject('handleTempEqlists')
const warnAreaByGrade = computed(() => {
    const warnAreaByGrade = {}
    const warnArea = JSON.parse(statusStore.tsunamiMessage.nmefcTsunami.warnArea)
    warnArea.forEach(item => {
        const grade = item.grade
        if(!warnAreaByGrade[grade]) warnAreaByGrade[grade] = []
        warnAreaByGrade[grade].push(item)
    })
    return warnAreaByGrade
})

const handleClick = ()=>{
    openUrl('https://www.nmefc.cn/zhyj/hx')
}

let oldMessage = Object.assign({}, defaultTsunamiMessage)
let currentStatus = 'notsunami'
watch(() => statusStore.map, newVal => {
    if(newVal !== null) {
        watch(() => statusStore.tsunamiMessage.nmefcTsunami, newMessage => {
            let title, body, icon, speech, playEws = false, shouldFocus = true
            if(newMessage.status > oldMessage.status) {
                currentStatus = `tsunami${newMessage.status}issue`
                title = '现正发布' + newMessage.title
                body = newMessage.status > 1 ? '请立即避难！' : '请从海岸边撤离！'
                icon = newMessage.status > 1 ? iconUrls.warn : iconUrls.caution
                speech = currentStatus
                playEws = newMessage.status > 1
            }
            else if(newMessage.status < oldMessage.status) {
                if(newMessage.status == 0) {
                    currentStatus = `tsunami${oldMessage.status}cancel`
                    title = oldMessage.title + '已解除'
                    body = '请留意后续情报。'
                    icon = iconUrls.info
                    speech = currentStatus
                }
                else {
                    currentStatus = `tsunami${newMessage.status}switch`
                    title = '已切换到' + newMessage.title
                    body = '请留意后续情报。'
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
                    title = newMessage.title + '更新了'
                    body = newMessage.status > 1 ? '请立即避难！' : '请从海岸边撤离！'
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
            if(shouldFocus) handleTempEqlists(settingsStore.mainSettings.tempTsunamiDuration * 1000, 'nmefcTsunami')
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