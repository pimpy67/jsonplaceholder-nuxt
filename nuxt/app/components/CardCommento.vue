<template>
  <div class="card">
    <strong>{{ commento.nome }}</strong>
    <span>{{ commento.email }}</span>
    <p>{{ commento.corpo }}</p>
    <small>{{ formatData(commento.creatoIl) }}</small>
    <div class="azioni">
      <button v-if="mostraPost" class="btn-secondario" @click="$emit('vedi-post', commento.postId)">
        {{ titoloPost ?? `Post #${commento.postId}` }}
      </button>
      <button v-if="puoEliminare" class="btn-pericolo" @click="$emit('elimina', commento.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Commento } from '~/types'

const auth = useAuthStore()
const props = defineProps<{ commento: Commento, mostraPost?: boolean, titoloPost?: string }>()
defineEmits(['elimina', 'vedi-post'])

const puoEliminare = computed(() =>
  auth.isAdmin || auth.utente?.email === props.commento.email
)

function formatData(d: string) {
  return new Date(d).toLocaleDateString('it-IT')
}
</script>
