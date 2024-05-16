<template>
  <div class="outer">
    <div class="container">
      <div class="title">测站信息</div>
      <div class="stationGrid">
        <StationGrid 
        v-for="(source, index) of stationList" 
        :key="index" 
        :source
        :url="urlHead + source"
        :currentTime></StationGrid>
      </div>
    </div>
  </div>
</template>

<script setup>
import StationGrid from '@/components/components/StationGrid.vue';
import { stationUrls } from '@/utils/Url';
import Http from '@/utils/Http';
import { ref, onMounted, onBeforeUnmount } from 'vue'

const stationList = ref()
const urlHead = 'wss://seis.wolfx.jp/'

let tick
const currentTime = ref()
onMounted(()=>{
  Http.get(stationUrls.STATION_LIST_http).then(data=>{
    stationList.value = Object.keys(data)
  })
  tick = setInterval(() => {
    currentTime.value = (new Date()).toISOString()
  }, 500);
})
onBeforeUnmount(()=>{
  if(tick) clearInterval(tick)
})
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