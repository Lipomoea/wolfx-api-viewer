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
import { useDataStore } from '@/stores/data';
import Http from '@/utils/Http';
import { geojsonUrls } from '@/utils/Urls';
import { onMounted } from 'vue';

const settingsStore = useSettingsStore()
const dataStore = useDataStore()

onMounted(async ()=>{
  const globalData = await Http.get(geojsonUrls.global)
  dataStore.saveData('geojson', 'global', globalData)
})
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>