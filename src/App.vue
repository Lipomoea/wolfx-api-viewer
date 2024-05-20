<template>
    <RouterView v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component"></component>
      </keep-alive>
    </RouterView>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted, onBeforeUnmount } from 'vue'
import { useTimeStore } from './stores/time';

const timeStore = useTimeStore()

onMounted(()=>{
  if (Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
  timeStore.startUpdatingTime()
})
onBeforeUnmount(()=>{
  timeStore.stopUpdatingTime()
})
</script>

<style lang="scss" scoped>

</style>