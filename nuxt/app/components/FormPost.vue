<template>
  <form @submit.prevent="invia">
    <h3>Nuovo Post</h3>
    <label for="post-titolo">Titolo</label>
    <input id="post-titolo" v-model="form.titolo" type="text" placeholder="Es. Il mio primo post" required />
    <label for="post-corpo">Corpo</label>
    <textarea id="post-corpo" v-model="form.corpo" placeholder="Scrivi il contenuto del post..." required></textarea>
    <button type="submit" class="btn-primario">Crea Post</button>
  </form>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

const auth = useAuthStore()
const emit = defineEmits<{ salva: [dati: Omit<Post, 'id' | 'creatoIl'>] }>()

const form = reactive({ titolo: '', corpo: '' })

function invia() {
  emit('salva', { userId: auth.utente!.id, titolo: form.titolo, corpo: form.corpo })
  form.titolo = ''
  form.corpo = ''
}
</script>
