<template>
  <div>
    <div class="container">
      <EewGrid source="jmaEew"></EewGrid>
    </div>
  </div>
</template>

<script setup>
import EewGrid from '@/components/EewGrid.vue';
import { eqUrls } from '@/utils/Url';
const urls = Object.keys(eqUrls)
</script>

<style lang="scss" scoped>
.container{
gap: 10px;
display: flex;
flex-wrap: wrap;
justify-content: center;
}
  </style>