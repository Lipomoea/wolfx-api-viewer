<template>
  <div class="outer1">
    <div class="container">
      <div class="bar">
        <div class="title">地震/海啸信息</div>
        <div class="switch">
          <div class="mag"
            :class="setClassName(calcCsisLevel(settingsStore.mainSettings.historyMagThres, 10, 0), false)">
            {{ settingsStore.mainSettings.historyMagThres.toFixed(1) }}
          </div>
          <el-slider v-model="settingsStore.mainSettings.historyMagThres" :min="0" :max="9" :step="0.1" size="small"
            :show-tooltip="false" />
        </div>
      </div>
      <NmefcTsunami v-if="settingsStore.mainSettings.source.nmefcTsunami" v-show="statusStore.isActive.nmefcTsunami" />
      <JmaTsunami v-if="settingsStore.mainSettings.source.jmaTsunami" v-show="statusStore.isActive.jmaTsunami" />
      <EqlistHistoryComponent />
    </div>
  </div>
</template>

<script setup>
import NmefcTsunami from './components/NmefcTsunami.vue';
import JmaTsunami from './components/JmaTsunami.vue';
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import EqlistHistoryComponent from './components/EqlistHistory.vue';
import { calcCsisLevel, setClassName } from '@/utils/Utils';

const settingsStore = useSettingsStore()
const statusStore = useStatusStore()

</script>

<style lang="scss" scoped>
.outer1 {
  width: 100%;
  .container {
    width: 100%;
    padding: 5px;
    padding-right: calc(100% - 395px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    .bar {
      width: 100%;
      height: 28px;
      display: flex;
      align-items: center;
      .title {
        font-size: 24px;
        font-weight: 700;
      }
      .switch {
        width: 200px;
        margin-left: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .mag {
          width: 28px;
          height: 22px;
          margin-left: 6px;
          border-radius: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          user-select: none;
        }
        .el-slider {
          flex: 1;
          margin: 0 1rem;
        }
      }
    }
  }
}
</style>