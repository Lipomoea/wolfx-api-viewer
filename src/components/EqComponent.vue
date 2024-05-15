<template>
  <div>
    <div class="container">
      <EqGrid source="jmaEew"></EqGrid>
      <EqGrid source="cwaEew"></EqGrid>
      <EqGrid source="scEew"></EqGrid>
      <EqGrid source="fjEew"></EqGrid>
      <EqGrid source="jmaEqlist"></EqGrid>
      <EqGrid source="cencEqlist"></EqGrid>
    </div>
  </div>
</template>

<script setup>
import EqGrid from '@/components/EqGrid.vue';
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