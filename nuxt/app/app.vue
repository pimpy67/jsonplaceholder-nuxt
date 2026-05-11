<template>
  <div>
    <nav v-if="auth.isLoggato">
      <NuxtLink to="/utenti">Utenti</NuxtLink>
      <NuxtLink to="/post">Post</NuxtLink>
      <NuxtLink to="/commenti">Commenti</NuxtLink>
      <span style="margin-left: auto">{{ auth.utente?.nome }}</span>
      <button class="btn-primario" @click="auth.logout()">Logout</button>
    </nav>
    <div class="contenitore">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
