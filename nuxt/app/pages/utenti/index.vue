<template>
  <div>
    <h1>Utenti</h1>

    <FormUtente
      :utente="store.utenteInModifica"
      @salva="salva"
      @annulla="store.utenteInModifica = null"
    />

    <input v-model="ricerca" placeholder="Cerca per nome, email o città..." />

    <p v-if="errore" class="errore">{{ errore }}</p>

    <p v-if="store.lista.length === 0">Nessun utente trovato.</p>

    <CardUtente
      v-for="utente in utentiFiltrati"
      :key="utente.id"
      :utente="utente"
      @vedi-post="vediPost"
      @modifica="store.utenteInModifica = $event"
      @elimina="elimina"
    />
  </div>
</template>

<script setup lang="ts">
import type { Utente } from '~/types'

const store = useUtentiStore()
const router = useRouter()
const ricerca = ref('')
const errore = ref('')

onMounted(() => store.carica())

const utentiFiltrati = computed(() =>
  store.lista.filter(u =>
    [u.nome, u.email, u.citta].some(v =>
      v?.toLowerCase().includes(ricerca.value.toLowerCase())
    )
  )
)

async function salva(dati: Record<string, string>) {
  try {
    errore.value = ''
    if (store.utenteInModifica) {
      await store.aggiorna(store.utenteInModifica.id, dati)
      store.utenteInModifica = null
    } else {
      await store.crea(dati as any)
    }
  } catch (e: any) {
    errore.value = e.message || 'Errore durante il salvataggio'
  }
}

async function elimina(id: number) {
  if (!confirm('Sei sicuro di voler eliminare questo utente?')) return
  try {
    errore.value = ''
    await store.elimina(id)
  } catch (e: any) {
    errore.value = e.message || 'Errore durante l\'eliminazione'
  }
}

function vediPost(utente: Utente) {
  router.push({ path: '/post', query: { userId: utente.id } })
}
</script>
