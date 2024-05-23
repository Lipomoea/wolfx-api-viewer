<template>
  <div>
    <div class="container">
      <EqComponent></EqComponent>
      <!-- <StationComponent></StationComponent> -->
      <SettingsComponent></SettingsComponent>
    </div>
  </div>
</template>

<script setup>
import EqComponent from '@/components/EqComponent.vue';
import StationComponent from '@/components/StationComponent.vue';
import SettingsComponent from '@/components/SettingsComponent.vue';
</script>

<style lang="scss" scoped>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>