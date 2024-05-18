<template>
  <RouterView />
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'

onMounted(()=>{
  if (Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
})
</script>

<style lang="scss" scoped>

</style>