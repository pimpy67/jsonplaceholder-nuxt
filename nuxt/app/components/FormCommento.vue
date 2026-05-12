<template>
  <form @submit.prevent="invia">
    <h3>Nuovo Commento</h3>
    <label for="commento-corpo">Corpo</label>
    <textarea id="commento-corpo" v-model="corpo" placeholder="Scrivi il commento..." required></textarea>
    <button type="submit" class="btn-primario">Crea Commento</button>
  </form>
</template>

<script setup lang="ts">
import type { Commento } from '~/types'

const props = defineProps<{ postId: number }>()
const emit = defineEmits<{ salva: [dati: Omit<Commento, 'id' | 'creatoIl'>] }>()

const auth = useAuthStore()
const corpo = ref('')

function invia() {
  emit('salva', {
    postId: props.postId,
    nome: auth.utente!.nome,
    email: auth.utente!.email,
    corpo: corpo.value
  })
  corpo.value = ''
}
</script>
