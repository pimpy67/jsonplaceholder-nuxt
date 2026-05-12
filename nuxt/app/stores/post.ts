import { defineStore } from 'pinia'
import type { Post, Meta, RispostaPaginata } from '~/types'

export const usePostStore = defineStore('post', () => {
  const lista = ref<Post[]>([])
  const meta = ref<Meta | null>(null)
  const paginaCorrente = ref(1)
  const userIdFiltro = ref<number | null>(null)

  async function carica(userId?: number, pagina = 1) {
    const { chiamata } = useApi()
    userIdFiltro.value = userId ?? null
    paginaCorrente.value = pagina
    const params = new URLSearchParams({ pagina: String(pagina), limite: '3' })
    if (userId) params.append('userId', String(userId))
    const risposta = await chiamata<RispostaPaginata<Post>>(`/post?${params}`)
    lista.value = risposta.dati
    meta.value = risposta.meta
  }

  async function crea(dati: Omit<Post, 'id' | 'creatoIl'>) {
    const { chiamata } = useApi()
    await chiamata('/post', { method: 'POST', body: dati })
    await carica(userIdFiltro.value ?? undefined, paginaCorrente.value)
  }

  async function elimina(id: number) {
    const { chiamata } = useApi()
    await chiamata(`/post/${id}`, { method: 'DELETE' })
    await carica(userIdFiltro.value ?? undefined, paginaCorrente.value)
  }

  return { lista, meta, paginaCorrente, userIdFiltro, carica, crea, elimina }
})
