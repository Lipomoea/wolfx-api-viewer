<template>
    <div>
        <PalertNet v-if="settingsStore.mainSettings.displaySeisNet.palertNet && statusStore.isTauri" />
        <TremNet v-if="settingsStore.mainSettings.displaySeisNet.tremNet && accessStore.canUse('tremFunctions')" />
        <NiedNet v-if="settingsStore.mainSettings.displaySeisNet.niedNet" />
        <KmaNet v-if="settingsStore.mainSettings.displaySeisNet.kmaNet" />
    </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, provide, watch } from 'vue';
import { TaiwanSeisNetLayers } from '@/classes/TaiwanSeisNetLayers';
import { useSettingsStore } from '@/stores/settings';
import { useAccessStore } from '@/stores/access';
import { useStatusStore } from '@/stores/status';
import PalertNet from './components/PalertNet.vue';
import TremNet from './components/TremNet.vue';
import NiedNet from './components/NiedNet.vue';
import KmaNet from './components/KmaNet.vue';

const settingsStore = useSettingsStore()
const accessStore = useAccessStore()
const statusStore = useStatusStore()
const useStationCanvasRenderer = computed(() => !settingsStore.advancedSettings.fallbackSvgStationRender)
const taiwanSeisNetLayers = new TaiwanSeisNetLayers(useStationCanvasRenderer, inject('smartSetView'))
provide('taiwanSeisNetLayers', taiwanSeisNetLayers)
const unwatchMap = watch(() => statusStore.map, map => taiwanSeisNetLayers.setMap(map), { immediate: true })
onBeforeUnmount(() => {
    unwatchMap()
    taiwanSeisNetLayers.dispose()
})
</script>

<style lang="scss" scoped>

</style>
