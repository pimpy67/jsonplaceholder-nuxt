<template>
  <div class="login-container">
    <h1>Mini JSONPlaceholder</h1>
    <form @submit.prevent="invia">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" class="btn-primario">Accedi</button>
      <p v-if="errore" class="errore">{{ errore }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const errore = ref('')

async function invia() {
  try {
    errore.value = ''
    await auth.login(email.value, password.value)
  } catch (e: any) {
    errore.value = e.data?.errore || e.message || 'Errore di autenticazione'
  }
}
</script>
