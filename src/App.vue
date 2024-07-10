<template>
    <RouterView v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component"></component>
      </keep-alive>
    </RouterView>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onBeforeMount, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTimeStore } from './stores/time';
import { useSettingsStore } from './stores/settings';

const timeStore = useTimeStore()
const settingsStore = useSettingsStore()

onBeforeMount(()=>{
  settingsStore.setMainSettings(localStorage.getItem('mainSettings'))
})
onMounted(()=>{
  if (Notification.permission !== 'granted' && settingsStore.requestNotification) {
    Notification.requestPermission()
  }
  timeStore.startUpdatingTime()
})
onBeforeUnmount(()=>{
  timeStore.stopUpdatingTime()
})
watch(()=>settingsStore.mainSettings, (newValue)=>{
  localStorage.setItem('mainSettings', JSON.stringify(newValue))
}, { deep: true })
</script>

<style lang="scss" scoped>

</style>