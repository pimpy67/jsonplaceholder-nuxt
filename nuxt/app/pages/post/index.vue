<template>
  <div>
    <Breadcrumb v-if="userIdFiltro" :voci="[
      { label: 'Utenti', onClick: () => router.push('/utenti') },
      { label: `Post di utente #${userIdFiltro}` }
    ]" />
    <Statistiche />
    <FormPost @salva="store.crea" />
    <CardPost
      v-for="post in store.lista"
      :key="post.id"
      :post="post"
      @vedi-commenti="vediCommenti"
      @elimina="elimina"
    />
    <Paginazione v-if="store.meta" :meta="store.meta" @cambia-pagina="cambiaPagina" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

const store = usePostStore()
const utenti = useUtentiStore()
const router = useRouter()
const route = useRoute()

const userIdFiltro = computed(() =>
  route.query.userId ? Number(route.query.userId) : undefined
)

onMounted(async () => {
  if (!utenti.lista.length) await utenti.carica()
  await store.carica(userIdFiltro.value)
})

watch(() => route.query.userId, (id) => store.carica(id ? Number(id) : undefined))

function cambiaPagina(pagina: number) {
  store.carica(userIdFiltro.value, pagina)
}

function vediCommenti(post: Post) {
  router.push({ path: '/commenti', query: { postId: post.id } })
}

async function elimina(id: number) {
  if (confirm('Sei sicuro?')) await store.elimina(id)
}
</script>
