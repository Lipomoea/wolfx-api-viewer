<template>
  <div>
    <div class="container">
      <EqComponent></EqComponent>
      <StationComponent></StationComponent>
    </div>
  </div>
</template>

<script setup>
import EqComponent from '@/components/EqComponent.vue';
import StationComponent from '@/components/StationComponent.vue';
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>