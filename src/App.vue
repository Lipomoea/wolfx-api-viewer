<template>
    <RouterView v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component"></component>
      </keep-alive>
    </RouterView>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useTimeStore } from './stores/time';
import { useSettingsStore } from './stores/settings';

const timeStore = useTimeStore()
const settingsStore = useSettingsStore()

onMounted(()=>{
  settingsStore.setMainSettings(JSON.parse(localStorage.getItem('mainSettings')))
  if (Notification.permission !== 'granted' && settingsStore.requestNotification) {
    Notification.requestPermission()
  }
  timeStore.startUpdatingTime()
})
onBeforeUnmount(()=>{
  timeStore.stopUpdatingTime()
})
watch(()=>settingsStore.mainSettings.onEew.notification, (newValue)=>{
  if(newValue){
    settingsStore.mainSettings.onEewWarn.notification = true
  }
})
watch(()=>settingsStore.mainSettings.onEew.focus, (newValue)=>{
  if(newValue){
    settingsStore.mainSettings.onEewWarn.focus = true
  }
})
watch(()=>settingsStore.mainSettings, (newValue)=>{
  localStorage.setItem('mainSettings', JSON.stringify(newValue))
}, { deep: true })
</script>

<style lang="scss" scoped>

</style>