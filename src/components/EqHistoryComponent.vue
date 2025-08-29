<template>
    <div class="outer">
        <div class="container">
            <div class="bar">
                <el-button class="back" @click="back" 
                :icon="Back" plain round></el-button>
                <div class="title">历史地震</div>
            </div>
            <hr>
            <el-scrollbar max-height="100%">
                <div class="eqHistory">
                    <EqHistoryGrid
                    v-for="(source, index) of eqHistoryList"
                    :key="index"
                    :source></EqHistoryGrid>
                </div>
            </el-scrollbar>
        </div>
    </div>
</template>

<script setup>
import router from '@/router';
import EqHistoryGrid from './components/EqHistoryGrid.vue';
import '@/assets/background.css'
import { Back } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings';
import { eqUrls } from '@/utils/Urls';
const settingsStore = useSettingsStore()
const eqHistoryList = ['jmaEqlist', 'cencEqlist']
if(settingsStore.advancedSettings.enableTremFunctions) {
    Object.assign(eqUrls, JSON.parse(localStorage.getItem('tremUrl'))?.eqUrls)
    eqHistoryList.splice(1, 0, 'cwaEqlist')
}
if(settingsStore.advancedSettings.enableFssnEqlist) {
    eqHistoryList.push('fssnEqlist')
}
const back = ()=>{
    router.back()
}
</script>

<style lang="scss" scoped>
.outer {
    height: 100%;
    .container{
        height: calc(100% - 40px);
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0px;
        border: black 1px solid;
        padding: 10px 5px 10px 20px;
        border-radius: 20px;
        .bar{
            display: flex;
            align-items: center;
            position: relative;
            margin-right: 15px;
            .back{
                position: absolute;
                font-size: 1.25em;
                height: 36px;
            }
            .title{
                font-size: 2em;
                text-align: center;
                flex: 1;
            }
        }
        hr,.eqHistory{
            margin-right: 15px;
        }
        .eqHistory{
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
    }
}
</style>