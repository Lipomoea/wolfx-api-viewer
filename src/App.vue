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
import { useDataStore } from '@/stores/data';
import Http from '@/utils/Http';
import { geojsonUrls } from '@/utils/Urls';

const dataStore = useDataStore()
const timeStore = useTimeStore()
const settingsStore = useSettingsStore()

onBeforeMount(()=>{
  settingsStore.setMainSettings(localStorage.getItem('mainSettings'))
  settingsStore.setAdvancedSettings(localStorage.getItem('advancedSettings'))
})
onMounted(async ()=>{
  if (Notification.permission !== 'granted' && settingsStore.requestNotification) {
    Notification.requestPermission()
  }
  timeStore.startUpdatingTime()
  const cnData = await Http.get(geojsonUrls.cn)
  dataStore.saveData('geojson', 'cn', cnData)
  const jpEewData = await Http.get(geojsonUrls.jp_eew)
  dataStore.saveData('geojson', 'jp_eew', jpEewData)
  const globalData = await Http.get(geojsonUrls.global_modified)
  dataStore.saveData('geojson', 'global', globalData)
})
onBeforeUnmount(()=>{
  timeStore.stopUpdatingTime()
})
watch(()=>settingsStore.mainSettings, (newValue)=>{
  localStorage.setItem('mainSettings', JSON.stringify(newValue))
}, { deep: true })
watch(()=>settingsStore.advancedSettings, (newValue)=>{
  localStorage.setItem('advancedSettings', JSON.stringify(newValue))
}, { deep: true })

</script>

<style lang="scss" scoped>

</style>