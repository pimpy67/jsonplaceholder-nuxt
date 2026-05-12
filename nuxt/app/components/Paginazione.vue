<template>
  <div class="paginazione">
    <button :disabled="meta.pagina <= 1" @click="$emit('cambia-pagina', meta.pagina - 1)">← Precedente</button>
    <span>Pagina {{ meta.pagina }} di {{ meta.pagine }} ({{ meta.totale }} post)</span>
    <button :disabled="meta.pagina >= meta.pagine" @click="$emit('cambia-pagina', meta.pagina + 1)">Successiva →</button>
  </div>
</template>

<script setup lang="ts">
import type { Meta } from '~/types'

defineProps<{ meta: Meta }>()
defineEmits(['cambia-pagina'])
</script>
