<template>
    <div>
        <NiedNet v-if="settingsStore.mainSettings.displaySeisNet.niedNet" />
        <TremNet v-if="settingsStore.mainSettings.displaySeisNet.tremNet" />
        <KmaNet v-if="settingsStore.mainSettings.displaySeisNet.kmaNet" />
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import NiedNet from './components/NiedNet.vue';
import TremNet from './components/TremNet.vue';
import KmaNet from './components/KmaNet.vue';

const settingsStore = useSettingsStore()
</script>

<style lang="scss" scoped>

</style>