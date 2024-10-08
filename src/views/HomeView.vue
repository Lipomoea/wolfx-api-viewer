<template>
  <div>
    <div class="container">
      <MainMapComponent></MainMapComponent>
      <!-- <TestComponent></TestComponent> -->
    </div>
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
// import TestComponent from '@/components/TestComponent.vue';
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  height: 100%;
}
</style>