<template>
  <div class="card">
    <h3>{{ utente.nome }}</h3>
    <p>{{ utente.email }}</p>
    <p>{{ utente.citta }}</p>
    <p>{{ utente.sesso }} — {{ utente.codiceFiscale }}</p>
    <p>Nato il: {{ formatData(utente.dataNascita) }}</p>
    <p>Tel: {{ utente.telefono || '—' }}</p>
    <small>Creato il {{ formatData(utente.creatoIl) }}</small>
    <div class="azioni">
      <button class="btn-primario" @click="$emit('vedi-post', utente)">Vedi Post</button>
      <button class="btn-secondario" @click="$emit('modifica', utente)">Modifica</button>
      <button v-if="isAdmin" class="btn-pericolo" @click="$emit('elimina', utente.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Utente } from '~/types'

const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)

defineProps<{ utente: Utente }>()
defineEmits(['vedi-post', 'modifica', 'elimina'])

function formatData(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString('it-IT') : '—'
}
</script>
