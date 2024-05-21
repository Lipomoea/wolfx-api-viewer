<template>
    <div>
        <div class="container">
            <div class="bar">
                <div class="back white" @click="back">返回</div>
                <div class="title">历史地震</div>
            </div>
            <hr>
            <div class="eqHistory">
                <EqHistoryGrid
                v-for="(source, index) of eqHistoryList"
                :key="index"
                :source></EqHistoryGrid>
            </div>
        </div>
    </div>
</template>

<script setup>
import router from '@/router';
import EqHistoryGrid from './components/EqHistoryGrid.vue';
import '@/assets/background.css'
const eqHistoryList = ['jmaEqlist', 'cencEqlist']
const back = ()=>{
    router.back()
}
</script>

<style lang="scss" scoped>
.container{
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px 0px;
    border: black 1px solid;
    padding: 10px 20px 20px;
    border-radius: 20px;
    .bar{
        display: flex;
        align-items: center;
        position: relative;
        .back{
            font-size: 1.25em;
            cursor: pointer;
            border: #cfcfcf 1px solid;
            padding: 5px 10px;
            border-radius: 5px;
            position: absolute;
        }
        .title{
            font-size: 2em;
            text-align: center;
            flex: 1;
        }
    }
    .eqHistory{
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
    }
}
</style>