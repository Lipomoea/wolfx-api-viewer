<template>
  <div>
    <div class="container">
      <StationGrid v-for="(source, index) of wsUrls" :key="index" :source="source"></StationGrid>
    </div>
  </div>
</template>

<script setup>
import StationGrid from '@/components/StationGrid.vue';
import { stationUrls } from '@/utils/Url';
const wsUrls = Object.keys(stationUrls).filter(key=>key.endsWith('ws')&&key != 'ALL_PUSH_ws')
</script>

<style lang="scss" scoped>
.container{
  // display: grid;
  // grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>