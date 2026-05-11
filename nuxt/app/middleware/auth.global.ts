export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // non autenticato → vai al login (ma non se sei già lì)
  if (!auth.isLoggato && to.path !== '/login') {
    return navigateTo('/login')
  }

  // già loggato → non tornare al login
  if (auth.isLoggato && to.path === '/login') {
    return navigateTo('/utenti')
  }
})
