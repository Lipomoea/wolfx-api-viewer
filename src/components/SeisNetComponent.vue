<template>
    <div>
        <NiedNet v-if="settingsStore.mainSettings.displaySeisNet.nied"></NiedNet>
    </div>
</template>

<script setup>
import NiedNet from './components/NiedNet.vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore()
</script>

<style lang="scss" scoped>

</style>