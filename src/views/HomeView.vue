<template>
  <div>
    <EewComp :source="'jmaEew_ws'"></EewComp>
    <EewComp :source="'scEew_ws'"></EewComp>
    <EewComp :source="'fjEew_ws'"></EewComp>
    <EewComp :source="'cwaEew_http'"></EewComp>
    <EewComp :source="'cencEqlist_ws'"></EewComp>
    <EewComp :source="'jmaEqlist_ws'"></EewComp>
  </div>
</template>

<script setup>
import EewComp from '@/components/EewComp.vue';
</script>

<style lang="scss" scoped>

</style>