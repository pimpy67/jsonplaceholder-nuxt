<template>
  <div class="card">
    <strong>{{ commento.nome }}</strong>
    <span>{{ commento.email }}</span>
    <p>{{ commento.corpo }}</p>
    <small>{{ formatData(commento.creatoIl) }}</small>
    <div class="azioni">
      <button v-if="mostraPost" class="btn-secondario" @click="$emit('vedi-post', commento.postId)">
        Post #{{ commento.postId }}
      </button>
      <button class="btn-pericolo" @click="$emit('elimina', commento.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Commento } from '~/types'

defineProps<{ commento: Commento, mostraPost?: boolean }>()
defineEmits(['elimina', 'vedi-post'])

function formatData(d: string) {
  return new Date(d).toLocaleDateString('it-IT')
}
</script>
