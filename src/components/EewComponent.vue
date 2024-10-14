<template>
  <div class="outer">
    <div class="container">
      <div class="title">地震预警</div>
      <div class="eqGrid">
        <EqGrid
        v-for="(source, index) of eewList"
        :key="index"
        :source></EqGrid>
      </div>
    </div>
  </div>
</template>

<script setup>
import EqGrid from '@/components/components/EqGrid.vue';
import { useSettingsStore } from '@/stores/settings';
import { eqUrls } from '@/utils/Urls';

const settingsStore = useSettingsStore()
const enableIclEew = settingsStore.advancedSettings.enableIclEew
if(enableIclEew) Object.assign(eqUrls, JSON.parse(localStorage.getItem('iclUrl')))
const eewList = enableIclEew?['jmaEew', 'cwaEew', 'iclEew', 'scEew', 'fjEew']:['jmaEew', 'cwaEew', 'scEew', 'fjEew']
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
  }
}
</style>