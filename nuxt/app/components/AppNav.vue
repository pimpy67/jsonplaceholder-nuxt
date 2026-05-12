<template>
  <nav>
    <NuxtLink to="/utenti">Utenti</NuxtLink>
    <NuxtLink to="/post">Post</NuxtLink>
    <NuxtLink to="/commenti">Commenti</NuxtLink>
    <span style="margin-left: auto">{{ auth.utente?.nome }}</span>
    <button class="btn-primario" @click="auth.logout()">Logout</button>
  </nav>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
