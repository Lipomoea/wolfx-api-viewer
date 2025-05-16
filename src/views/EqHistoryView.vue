<template>
  <div>
    <div class="container">
      <EqHistoryComponent></EqHistoryComponent>
    </div>
  </div>
</template>

<script setup>
import EqHistoryComponent from '@/components/EqHistoryComponent.vue';
</script>

<style lang="scss" scoped>
div {
  height: 100%;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
