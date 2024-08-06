<template>
  <div>
    <div class="container">
      <MainMapComponent></MainMapComponent>
    </div>
  </div>
</template>

<script setup>
import MainMapComponent from '@/components/MainMapComponent.vue';
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>