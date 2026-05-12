<template>
  <div>
    <Breadcrumb v-if="postIdFiltro" :voci="[
      { label: 'Post', onClick: () => router.push('/post') },
      { label: `Commenti del post #${postIdFiltro}` }
    ]" />
    <Statistiche />
    <FormCommento v-if="postIdFiltro" :post-id="postIdFiltro" @salva="store.crea" />
    <p v-else class="info">Seleziona un post dalla pagina <button class="btn-secondario" @click="router.push('/post')">Post</button> per aggiungere un commento.</p>
    <CardCommento
      v-for="commento in store.lista"
      :key="commento.id"
      :commento="commento"
      :mostra-post="!postIdFiltro"
      :titolo-post="titoli[commento.postId]"
      @vedi-post="(id) => router.push({ path: '/commenti', query: { postId: id } })"
      @elimina="elimina"
    />
  </div>
</template>

<script setup lang="ts">
import type { Post, RispostaPaginata } from '~/types'

const store = useCommentiStore()
const router = useRouter()
const route = useRoute()
const titoli = ref<Record<number, string>>({})

const postIdFiltro = computed(() =>
  route.query.postId ? Number(route.query.postId) : undefined
)

onMounted(async () => {
  const { chiamata } = useApi()
  const risposta = await chiamata<RispostaPaginata<Post>>('/post?limite=100')
  titoli.value = Object.fromEntries(risposta.dati.map(p => [p.id, p.titolo]))
  await store.carica(postIdFiltro.value)
})

watch(() => route.query.postId, (id) => store.carica(id ? Number(id) : undefined))

async function elimina(id: number) {
  if (confirm('Sei sicuro?')) await store.elimina(id)
}
</script>
