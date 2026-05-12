<template>
  <div id="statistiche">
    {{ utentiStore.lista.length }} utenti |
    {{ postStore.meta?.totale ?? 0 }} post |
    {{ commentiStore.lista.length }} commenti
  </div>
</template>

<script setup lang="ts">
const utentiStore = useUtentiStore()
const postStore = usePostStore()
const commentiStore = useCommentiStore()
</script>
