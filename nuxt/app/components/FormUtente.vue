<template>
  <form @submit.prevent="invia">
    <h2>{{ utente ? 'Modifica Utente' : 'Nuovo Utente' }}</h2>
    <input v-model="form.nome" placeholder="Nome" required />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input v-model="form.citta" placeholder="Città" />
    <select v-model="form.sesso" required>
      <option value="">Sesso</option>
      <option value="M">Maschio</option>
      <option value="F">Femmina</option>
      <option value="Altro">Altro</option>
    </select>
    <input v-model="form.codiceFiscale" placeholder="Codice Fiscale" required />
    <input v-model="form.dataNascita" type="date" />
    <input v-model="form.telefono" placeholder="Telefono" />
    <div class="campo-password">
      <input
        v-model="form.password"
        :type="mostraPassword ? 'text' : 'password'"
        placeholder="Password"
        :required="!utente"
      />
      <button type="button" class="occhio" @click="mostraPassword = !mostraPassword">
        {{ mostraPassword ? '🙈' : '👁️' }}
      </button>
    </div>
    <div class="azioni">
      <button type="submit" class="btn-primario">Salva</button>
      <button v-if="utente" type="button" class="btn-secondario" @click="$emit('annulla')">
        Annulla
      </button>
    </div>
    <p v-if="errore" class="errore">{{ errore }}</p>
  </form>
</template>

<script setup lang="ts">
import type { Utente } from '~/types'

const props = defineProps<{ utente?: Utente | null }>()
const emit = defineEmits<{
  salva: [dati: Record<string, string>]
  annulla: []
}>()

const errore = ref('')
const mostraPassword = ref(false)
const form = reactive({
  nome: props.utente?.nome ?? '',
  email: props.utente?.email ?? '',
  citta: props.utente?.citta ?? '',
  sesso: props.utente?.sesso ?? '',
  codiceFiscale: props.utente?.codiceFiscale ?? '',
  dataNascita: props.utente?.dataNascita ?? '',
  telefono: props.utente?.telefono ?? '',
  password: ''
})

const regexCF = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/

function invia() {
  errore.value = ''
  if (!regexCF.test(form.codiceFiscale.toUpperCase())) {
    errore.value = 'Codice fiscale non valido (formato: RSSMRA80A01H501A)'
    return
  }
  const dati: Record<string, string> = { ...form, codiceFiscale: form.codiceFiscale.toUpperCase() }
  if (!dati.password) delete dati.password
  emit('salva', dati)
}
</script>

<style scoped>
.campo-password {
  position: relative;
  margin-bottom: 0.5rem;
}
.campo-password input {
  margin-bottom: 0;
  padding-right: 2.5rem;
}
.occhio {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  line-height: 1;
}
</style>
