<template>
  <div>
    <div class="container">
      <EqComponent></EqComponent>
      <!-- <StationComponent></StationComponent> -->
      <SettingsComponent></SettingsComponent>
      <AboutComponent v-show="settingsStore.mainSettings.showAbout"></AboutComponent>
    </div>
  </div>
</template>

<script setup>
import EqComponent from '@/components/EqComponent.vue';
// import StationComponent from '@/components/StationComponent.vue';
import SettingsComponent from '@/components/SettingsComponent.vue';
import AboutComponent from '@/components/AboutComponent.vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore()
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>