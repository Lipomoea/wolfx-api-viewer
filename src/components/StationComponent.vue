<template>
  <div>
    <div class="container">
      <StationGrid :source="'CQ_BEB_00_ws'"></StationGrid>
      <StationGrid :source="'SC_CHD_00_ws'"></StationGrid>
      <StationGrid :source="'NM_EEDS_00_ws'"></StationGrid>
      <StationGrid :source="'CQ_TOL_00_ws'"></StationGrid>
      <StationGrid :source="'GD_SHZ_00_ws'"></StationGrid>
      <StationGrid :source="'CQ_DAZ_00_ws'"></StationGrid>
      <StationGrid :source="'NX_YIC_00_ws'"></StationGrid>
      <StationGrid :source="'CQ_TOL_01_ws'"></StationGrid>
    </div>
  </div>
</template>

<script setup>
import StationGrid from '@/components/StationGrid.vue';
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