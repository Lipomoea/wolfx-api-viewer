<template>
  <div class="outer">
    <MainMapComponent></MainMapComponent>
    <!-- <TestComponent></TestComponent> -->
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
// import TestComponent from '@/components/TestComponent.vue';
</script>

<style lang="scss" scoped>
.outer {
  width: 100%;
  height: 100%;
}
</style>