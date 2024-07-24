<template>
  <div>
    <div class="container">
      <MainMapComponent></MainMapComponent>
    </div>
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
import { useDataStore } from '@/stores/data';
import Http from '@/utils/Http';
import { geojsonUrls } from '@/utils/Urls';
import { onMounted } from 'vue';

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