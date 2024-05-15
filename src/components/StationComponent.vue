<template>
  <div class="outer">
    <div class="container">
      <div class="title">测站信息</div>
      <div class="stationGrid">
        <StationGrid v-for="(source, index) of wsUrls" :key="index" :source="source"></StationGrid>
      </div>
    </div>
  </div>
</template>

<script setup>
import StationGrid from '@/components/components/StationGrid.vue';
import { stationUrls } from '@/utils/Url';
const wsUrls = Object.keys(stationUrls).filter(key=>key.endsWith('ws')&&key != 'ALL_PUSH_ws')
</script>

<style lang="scss" scoped>
.outer{
  width: 100%;
  .container{
    border: black 1px solid;
    padding: 20px 20px;
    margin: 20px 20px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    .title{
      font-size: 24px;
      font-weight: 700;
    }
    .stationGrid{
      width: 100%;
      gap: 10px;
      // display: flex;
      // flex-wrap: wrap;
      // justify-content: center;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }
}
</style>