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
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from './stores/settings';
import { geojsonUrls } from './utils/Urls';
import Http from './utils/Http';

const timeStore = useTimeStore()
const statusStore = useStatusStore()
const settingsStore = useSettingsStore()

async function getGeojson(){
  const promises = Object.keys(geojsonUrls).map(async name => {
    const data = await Http.get(geojsonUrls[name])
    const cache = await caches.open('geojson')
    cache.put(geojsonUrls[name], new Response(JSON.stringify(data)))
  })
  await Promise.all(promises)
}

onBeforeMount(() => {
  settingsStore.setMainSettings(localStorage.getItem('mainSettings'))
  settingsStore.setAdvancedSettings(localStorage.getItem('advancedSettings'))
  settingsStore.mainSettings.displaySeisNet.niedDelay = 0
  timeStore.startUpdatingTime()
  statusStore.startUpdatingEqMessage()
  getGeojson()
  try {
    if (Notification.permission !== 'granted' && settingsStore.requestNotification) {
      Notification.requestPermission()
    }
  } catch (err) {
    console.log(err);
  }
})
onBeforeUnmount(() => {
  timeStore.stopUpdatingTime()
  statusStore.disconnect()
})
watch(() => settingsStore.mainSettings, (newValue) => {
  localStorage.setItem('mainSettings', JSON.stringify(newValue))
}, { deep: true })
watch(() => settingsStore.advancedSettings, (newValue) => {
  localStorage.setItem('advancedSettings', JSON.stringify(newValue))
}, { deep: true })

</script>

<style lang="scss" scoped></style>