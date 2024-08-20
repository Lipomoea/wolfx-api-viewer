<template>
  <div>
    <div class="container">
      <MainMapComponent></MainMapComponent>
    </div>
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
import { onBeforeMount, onBeforeUnmount } from 'vue'
import { useDataStore } from '@/stores/data';
import { useStatusStore } from '@/stores/status';

const dataStore = useDataStore()
const statusStore = useStatusStore()

onBeforeMount(()=>{
  statusStore.startUpdatingEqMessage()
  dataStore.getGeojson()
})
onBeforeUnmount(()=>{
  statusStore.disconnect()
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