<template>
    <div>
      <EewGrid :source="'jmaEew_ws'"></EewGrid>
      <EewGrid :source="'scEew_ws'"></EewGrid>
      <EewGrid :source="'fjEew_ws'"></EewGrid>
      <EewGrid :source="'cwaEew_http'"></EewGrid>
      <EewGrid :source="'cencEqlist_ws'"></EewGrid>
      <EewGrid :source="'jmaEqlist_ws'"></EewGrid>
    </div>
  </template>
  
  <script setup>
  import EewGrid from '@/components/EewGrid.vue';
  </script>
  
  <style lang="scss" scoped>
  
  </style>