<template>
  <div>
    <div class="container">
      <MainMapComponent></MainMapComponent>
    </div>
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/data';
import Http from '@/utils/Http';
import { geojsonUrls } from '@/utils/Urls';

const dataStore = useDataStore()

onMounted(async ()=>{
  const cnData = await Http.get(geojsonUrls.cn)
  dataStore.saveData('geojson', 'cn', cnData)
  const jpEewData = await Http.get(geojsonUrls.jp_eew)
  dataStore.saveData('geojson', 'jp_eew', jpEewData)
  const globalData = await Http.get(geojsonUrls.global_modified)
  dataStore.saveData('geojson', 'global', globalData)
  const cnFaultData = await Http.get(geojsonUrls.cn_fault)
  dataStore.saveData('geojson', 'cn_fault', cnFaultData)
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