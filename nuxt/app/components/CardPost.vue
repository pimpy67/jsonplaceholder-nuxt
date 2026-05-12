<template>
  <div class="card">
    <h3>{{ post.titolo }}</h3>
    <p>{{ post.corpo }}</p>
    <small>Autore: {{ nomeAutore }} — {{ formatData(post.creatoIl) }}</small>
    <div class="azioni">
      <button class="btn-primario" @click="$emit('vedi-commenti', post)">Vedi Commenti</button>
      <button v-if="puoEliminare" class="btn-pericolo" @click="$emit('elimina', post.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

const auth = useAuthStore()
const utenti = useUtentiStore()
const props = defineProps<{ post: Post }>()
defineEmits(['vedi-commenti', 'elimina'])

const nomeAutore = computed(() =>
  utenti.lista.find(u => u.id === props.post.userId)?.nome ?? `#${props.post.userId}`
)

const puoEliminare = computed(() =>
  auth.isAdmin || props.post.userId === auth.utente?.id
)

function formatData(d: string) {
  return new Date(d).toLocaleDateString('it-IT')
}
</script>
