<template>
  <div class="outer">
    <div class="container">
      <div class="title">地震/海啸信息</div>
      <div class="eqGrid">
        <NmefcTsunami v-if="settingsStore.mainSettings.source.nmefcTsunami" v-show="statusStore.isActive.nmefcTsunami" />
        <JmaTsunami v-if="settingsStore.mainSettings.source.jmaTsunami" v-show="statusStore.isActive.jmaTsunami" />
      </div>
      <div class="eqGrid">
        <EqGrid
        v-for="(source, index) of eqlistList"
        :key="index"
        :source
        />
      </div>
      <el-button class="more" :icon="More" @click="handleMore">查看历史地震</el-button>
    </div>
  </div>
</template>

<script setup>
import EqGrid from '@/components/components/EqGrid.vue';
import NmefcTsunami from './components/NmefcTsunami.vue';
import JmaTsunami from './components/JmaTsunami.vue';
import { More } from '@element-plus/icons-vue';
import router from '@/router';
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import { eqUrls } from '@/utils/Urls';

const settingsStore = useSettingsStore()
const statusStore = useStatusStore()

if(settingsStore.advancedSettings.enableTremFunctions) Object.assign(eqUrls, JSON.parse(localStorage.getItem('tremUrl'))?.eqUrls)
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