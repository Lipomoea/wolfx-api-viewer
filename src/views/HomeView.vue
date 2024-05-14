<template>
  <div class="container">
    <EewComponent></EewComponent>
    <StationComponent></StationComponent>
  </div>
</template>

<script setup>
import EewComponent from '@/components/EewComponent.vue';
import StationComponent from '@/components/StationComponent.vue';
</script>

<style lang="scss" scoped>
.container{
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  align-items: center;
}
</style>