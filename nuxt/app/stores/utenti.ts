import { defineStore } from 'pinia'
import type { Utente } from '~/types'

export const useUtentiStore = defineStore('utenti', () => {
  const lista = ref<Utente[]>([])
  const utenteInModifica = ref<Utente | null>(null)

  async function carica() {
    const { chiamata } = useApi()
    lista.value = await chiamata<Utente[]>('/utenti')
  }

  async function crea(dati: Partial<Utente> & { password: string }) {
    const { chiamata } = useApi()
    await chiamata('/utenti', { method: 'POST', body: dati })
    await carica()
  }

  async function aggiorna(id: number, dati: Partial<Utente & { password?: string }>) {
    const { chiamata } = useApi()
    await chiamata(`/utenti/${id}`, { method: 'PATCH', body: dati })
    await carica()
  }

  async function elimina(id: number) {
    const { chiamata } = useApi()
    await chiamata(`/utenti/${id}`, { method: 'DELETE' })
    await carica()
  }

  return { lista, utenteInModifica, carica, crea, aggiorna, elimina }
})
