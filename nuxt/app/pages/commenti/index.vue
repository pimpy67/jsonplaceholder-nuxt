<template>
  <div>
    <Breadcrumb v-if="postIdFiltro" :voci="[
      { label: 'Post', onClick: () => router.push('/post') },
      { label: `Commenti del post #${postIdFiltro}` }
    ]" />
    <FormCommento v-if="postIdFiltro" :post-id="postIdFiltro" @salva="store.crea" />
    <p v-else class="info">Seleziona un post dalla pagina <button class="btn-secondario" @click="router.push('/post')">Post</button> per aggiungere un commento.</p>
    <CardCommento
      v-for="commento in store.lista"
      :key="commento.id"
      :commento="commento"
      :mostra-post="!postIdFiltro"
      @vedi-post="(id) => router.push({ path: '/commenti', query: { postId: id } })"
      @elimina="elimina"
    />
  </div>
</template>

<script setup lang="ts">
const store = useCommentiStore()
const router = useRouter()
const route = useRoute()

const postIdFiltro = computed(() =>
  route.query.postId ? Number(route.query.postId) : undefined
)

onMounted(() => store.carica(postIdFiltro.value))

watch(() => route.query.postId, (id) => store.carica(id ? Number(id) : undefined))

async function elimina(id: number) {
  if (confirm('Sei sicuro?')) await store.elimina(id)
}
</script>
