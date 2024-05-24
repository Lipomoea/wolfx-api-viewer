<template>
    <div>
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
const eqHistoryList = ['jmaEqlist', 'cencEqlist']
const back = ()=>{
    router.back()
}
</script>

<style lang="scss" scoped>
.container{
    height: 95vh;
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
</style>