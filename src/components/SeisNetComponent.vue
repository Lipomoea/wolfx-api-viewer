<template>
    <div>
        <PalertNet v-if="settingsStore.mainSettings.displaySeisNet.palertNet && statusStore.isTauri" />
        <TremNet v-if="settingsStore.mainSettings.displaySeisNet.tremNet && accessStore.canUse('tremFunctions')" />
        <NiedNet v-if="settingsStore.mainSettings.displaySeisNet.niedNet" />
        <KmaNet v-if="settingsStore.mainSettings.displaySeisNet.kmaNet" />
    </div>
</template>

<script setup>
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
</script>

<style lang="scss" scoped>

</style>
