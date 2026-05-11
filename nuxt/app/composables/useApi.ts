export function useApi() {
  const token = useCookie<string | null>('token')
  const config = useRuntimeConfig()

  async function chiamata<T>(percorso: string, opzioni: Record<string, unknown> = {}): Promise<T> {
    return $fetch<T>(percorso, {
      baseURL: config.public.apiBase,
      headers: token.value
        ? { Authorization: `Bearer ${token.value}` }
        : {},
      ...opzioni,
      onResponseError({ response }) {
        const msg = (response._data as any)?.errore || 'Errore del server'
        throw new Error(msg)
      }
    })
  }

  return { chiamata }
}
