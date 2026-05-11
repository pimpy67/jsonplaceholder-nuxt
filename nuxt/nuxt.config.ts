// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // In Nuxt 4 la modalità SPA si ottiene con routeRules invece di ssr: false
  routeRules: {
    '/**': { ssr: false }
  },

  devServer: {
    port: 8080
  },

  css: ['~/assets/css/main.css'],

  modules: ['@pinia/nuxt'],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  },

  router: {
    options: {
      // il middleware auth verrà applicato globalmente da ogni pagina
    }
  }
})
