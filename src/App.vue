<template>
  <div class="container" ref="container">
    <RouterView v-slot="{ Component }">
      <keep-alive include="HomeView">
        <component :is="Component"></component>
      </keep-alive>
    </RouterView>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onBeforeMount, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTimeStore } from './stores/time';
import { useStatusStore } from '@/stores/status';
import { useSettingsStore } from './stores/settings';
import { eqUrls, geojsonUrls } from './utils/Urls';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { isTauri } from '@tauri-apps/api/core';
import Http from './classes/Http';

const timeStore = useTimeStore()
const statusStore = useStatusStore()
const settingsStore = useSettingsStore()

const container = ref()

async function getGeojson(retries = 0){
  if(!isTauri() && ('caches' in window)){
    try {
      const promises = Object.keys(geojsonUrls).map(async name => {
        const data = await Http.get(geojsonUrls[name], { timeout: 0 })
        const cache = await caches.open('geojson')
        await cache.put(geojsonUrls[name], new Response(JSON.stringify(data)))
      })
      await Promise.all(promises)
    } catch (err) {
      console.log(err);
      if(retries < 3) {
        setTimeout(() => {
          getGeojson(retries + 1)
        }, 2000);
      }
    }
  }
}

onBeforeMount(async () => {
  settingsStore.setMainSettings(localStorage.getItem('mainSettings'))
  settingsStore.setAdvancedSettings(localStorage.getItem('advancedSettings'))
  settingsStore.mainSettings.displaySeisNet.delay = 0
  if(settingsStore.advancedSettings.multiApi) Object.assign(eqUrls, JSON.parse(localStorage.getItem('multiApi')))
  timeStore.startUpdatingTime()
  statusStore.enabledSource = Object.keys(settingsStore.mainSettings.source).filter(source => settingsStore.mainSettings.source[source])
  statusStore.multiApi = settingsStore.advancedSettings.multiApi
  statusStore.startUpdatingEqMessage()
  getGeojson()
  if('Notification' in window){
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }
  if(isTauri()) {
    const thisPlatform = platform()
    if(thisPlatform == 'windows' && settingsStore.mainSettings.minimizeOnLaunch) {
      await getCurrentWindow().hide()
    }
  }
})
onMounted(() => {
  watch(() => settingsStore.mainSettings.uiScale, scale => {
    container.value.style.transform = `scale(${scale})`
    container.value.style.width = `${100 / scale}vw`
    container.value.style.height = `${100 / scale}vh`
    statusStore.map?.invalidateSize()
  }, { immediate: true })
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

<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
  position: absolute;
  transform-origin: top left;
}
</style>