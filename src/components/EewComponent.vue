<template>
  <div class="outer">
    <div class="container">
      <div class="title">地震预警</div>
      <div class="eqGrid">
        <EqGrid
        v-for="(source, index) of eewList"
        :key="index"
        :source
        />
        <EqGrid v-if="settingsStore.advancedSettings.mockEew" source="mockEew" />
      </div>
      <el-button v-if="settingsStore.advancedSettings.mockEew" class="mock" :icon="Plus" @click="statusStore.showMockDialog = true">新建模拟预警</el-button>
      <MockEew v-if="settingsStore.advancedSettings.mockEew" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import EqGrid from '@/components/components/EqGrid.vue';
import MockEew from './components/MockEew.vue';
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import { eqUrls } from '@/utils/Urls';
import { Plus } from '@element-plus/icons-vue';

const settingsStore = useSettingsStore()
const statusStore = useStatusStore()
if(settingsStore.advancedSettings.enableGqEew) Object.assign(eqUrls, JSON.parse(localStorage.getItem('gqUrl')))
const eewList = Object.keys(settingsStore.mainSettings.source).filter(source => source.includes('Eew') && settingsStore.mainSettings.source[source])

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
    .mock{
      width: 100%;
      height: 50px;
      align-self: center;
      font-size: 16px;
      border-radius: 25px;
    }
  }
}
</style>