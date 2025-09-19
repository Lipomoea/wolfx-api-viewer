<template>
    <div>
        <NiedNet v-if="settingsStore.mainSettings.displaySeisNet.niedNet"></NiedNet>
        <TremNet v-if="settingsStore.mainSettings.displaySeisNet.tremNet"></TremNet>
    </div>
</template>

<script setup>
import NiedNet from './components/NiedNet.vue';
import { useSettingsStore } from '@/stores/settings';
import TremNet from './components/TremNet.vue';

const settingsStore = useSettingsStore()
</script>

<style lang="scss" scoped>

</style>