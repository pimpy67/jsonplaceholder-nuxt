import { defineStore } from 'pinia'
import type { Commento } from '~/types'

export const useCommentiStore = defineStore('commenti', () => {
  const lista = ref<Commento[]>([])
  const postIdFiltro = ref<number | null>(null)

  async function carica(postId?: number) {
    const { chiamata } = useApi()
    postIdFiltro.value = postId ?? null
    const url = postId ? `/commenti?postId=${postId}` : '/commenti'
    const dati = await chiamata<Commento[]>(url)
    lista.value = dati.sort((a, b) => new Date(b.creatoIl).getTime() - new Date(a.creatoIl).getTime())
  }

  async function crea(dati: Omit<Commento, 'id' | 'creatoIl'>) {
    const { chiamata } = useApi()
    await chiamata('/commenti', { method: 'POST', body: dati })
    await carica(postIdFiltro.value ?? undefined)
  }

  async function elimina(id: number) {
    const { chiamata } = useApi()
    await chiamata(`/commenti/${id}`, { method: 'DELETE' })
    await carica(postIdFiltro.value ?? undefined)
  }

  return { lista, postIdFiltro, carica, crea, elimina }
})
