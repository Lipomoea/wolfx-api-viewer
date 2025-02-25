<template>
  <div class="outer">
    <div class="container">
      <div class="title">地震信息</div>
      <div class="eqGrid">
        <EqGrid
        v-for="(source, index) of eqlistList"
        :key="index"
        :source></EqGrid>
      </div>
      <el-button class="more" :icon="More" @click="handleMore">查看历史地震</el-button>
    </div>
  </div>
</template>

<script setup>
import EqGrid from '@/components/components/EqGrid.vue';
import { More } from '@element-plus/icons-vue';
import router from '@/router';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore()

const eqlistList = Object.keys(settingsStore.mainSettings.source).filter(source => source.includes('Eqlist') && settingsStore.mainSettings.source[source])

const handleMore = ()=>{
  router.push('/eq-history')
}
</script>

<style lang="scss" scoped>
.outer{
  width: 100%;
  .container{
    width: 100%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    .title{
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .eqGrid{
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .more{
      width: 100%;
      height: 50px;
      align-self: center;
      font-size: 16px;
      border-radius: 25px;
    }
  }
}
</style>