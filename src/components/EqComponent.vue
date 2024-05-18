<template>
  <div class="outer">
    <div class="container">
      <div class="title">地震预警</div>
      <div class="eqGrid">
        <EqGrid source="jmaEew"></EqGrid>
        <EqGrid source="cwaEew"></EqGrid>
        <EqGrid source="scEew"></EqGrid>
        <EqGrid source="fjEew"></EqGrid>
      </div>
      <div class="title">地震信息</div>
      <div class="eqGrid">
        <EqGrid source="jmaEqlist"></EqGrid>
        <EqGrid source="cencEqlist"></EqGrid>
      </div>
    </div>
  </div>
</template>

<script setup>
import EqGrid from '@/components/components/EqGrid.vue';
</script>

<style lang="scss" scoped>
.outer{
  width: 100%;
  .container{
    border: black 1px solid;
    padding: 20px 20px;
    margin: 20px 20px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    .title{
      font-size: 24px;
      font-weight: 700;
    }
    .eqGrid{
      width: 100%;
      gap: 10px;
      // display: flex;
      // flex-wrap: wrap;
      // justify-content: center;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    }
  }
}
</style>