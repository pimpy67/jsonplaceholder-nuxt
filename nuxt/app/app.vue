<template>
  <div>
    <AppNav v-if="auth.isLoggato" />
    <div class="contenitore">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
