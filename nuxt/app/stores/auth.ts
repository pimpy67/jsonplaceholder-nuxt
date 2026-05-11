import { defineStore } from 'pinia'
import type { Utente } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('token', { default: () => null })
  const utente = useCookie<Utente | null>('utente', { default: () => null })

  const isLoggato = computed(() => !!token.value)
  const isAdmin = computed(() => utente.value?.ruolo === 'admin')

  async function login(email: string, password: string) {
    const { chiamata } = useApi()
    const risposta = await chiamata<{ token: string; utente: Utente }>(
      '/auth/login',
      { method: 'POST', body: { email, password } }
    )
    token.value = risposta.token
    utente.value = risposta.utente
    await navigateTo('/utenti')
  }

  function logout() {
    token.value = null
    utente.value = null
    navigateTo('/login')
  }

  return { token, utente, isLoggato, isAdmin, login, logout }
})
