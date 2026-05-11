# PRD — jsonplaceholder-nuxt

Conversione del progetto didattico Mini JSONPlaceholder da frontend vanilla (HTML/CSS/JS) a Nuxt 3 (Vue 3, SPA, CSS puro).

---

## 1. Obiettivo

Riscrivere il frontend del progetto Mini JSONPlaceholder usando **Nuxt 3** in modalità SPA, mantenendo:
- Lo stesso backend Express (invariato, nessuna modifica)
- Le stesse funzionalità utente (login, CRUD, drill-down, paginazione, ruoli)
- CSS puro senza framework UI esterni

Il progetto serve anche come **dimostrazione didattica** del confronto tra approccio vanilla e approccio framework.

---

## 2. Stack tecnologico

| Layer | Tecnologia |
|-------|------------|
| Framework frontend | Nuxt 3 (Vue 3) |
| Modalità rendering | SPA (`ssr: false`) |
| State management | Pinia |
| Autenticazione | `useCookie` + middleware di navigazione |
| Stile | CSS puro (variabili CSS, nessun framework) |
| HTTP client | `$fetch` built-in Nuxt |
| Backend | Express API esistente (invariato, porta 3000) |
| Package manager | npm |

---

## 3. Struttura del progetto

```
jsonplaceholder-nuxt/
├── nuxt.config.ts              # Configurazione Nuxt (ssr: false, baseURL API)
├── app.vue                     # Root component — layout principale con <NuxtPage>
├── docs/
│   └── PRD.md                  # Questo file
├── assets/
│   └── css/
│       └── main.css            # CSS globale (variabili, reset, componenti base)
├── components/
│   ├── CardUtente.vue          # Card singolo utente
│   ├── CardPost.vue            # Card singolo post
│   ├── CardCommento.vue        # Card singolo commento
│   ├── FormUtente.vue          # Form creazione/modifica utente
│   ├── FormPost.vue            # Form creazione post
│   ├── FormCommento.vue        # Form creazione commento
│   ├── Paginazione.vue         # Controlli pagina precedente/successiva
│   ├── Breadcrumb.vue          # Breadcrumb drill-down
│   ├── Statistiche.vue         # Contatori utenti/post/commenti
│   └── AppNav.vue              # Barra di navigazione
├── composables/
│   └── useApi.ts               # Wrapper $fetch con Bearer token automatico
├── middleware/
│   └── auth.ts                 # Redirect a /login se non autenticato
├── pages/
│   ├── login.vue               # Pagina login
│   ├── utenti/
│   │   └── index.vue           # Lista utenti + form
│   ├── post/
│   │   └── index.vue           # Lista post + paginazione + form
│   └── commenti/
│       └── index.vue           # Lista commenti + form
├── stores/
│   ├── auth.ts                 # Store Pinia: token, utente loggato, ruolo
│   ├── utenti.ts               # Store Pinia: lista utenti, stato modifica
│   ├── post.ts                 # Store Pinia: lista post, pagina corrente
│   └── commenti.ts             # Store Pinia: lista commenti
└── types/
    └── index.ts                # TypeScript types: Utente, Post, Commento, Meta
```

---

## 4. Pagine e routing

Nuxt genera automaticamente le route dai file in `pages/`. Non serve configurazione manuale.

| Route | File | Corrisponde a |
|-------|------|---------------|
| `/login` | `pages/login.vue` | Sezione login attuale |
| `/utenti` | `pages/utenti/index.vue` | Sezione utenti attuale |
| `/post` | `pages/post/index.vue` | Sezione post attuale |
| `/commenti` | `pages/commenti/index.vue` | Sezione commenti attuale |

Il drill-down viene gestito tramite **query params** nella URL:
- `/post?userId=3` — post di un utente specifico
- `/commenti?postId=7` — commenti di un post specifico

Vantaggio rispetto al vanilla: l'URL è condivisibile e sopravvive al refresh della pagina.

---

## 5. Types TypeScript

File `types/index.ts` — definisce le strutture dati condivise da tutti i componenti e store.

```ts
export interface Utente {
  id: number
  nome: string
  email: string
  citta: string
  sesso: 'M' | 'F' | 'Altro'
  codiceFiscale: string
  dataNascita: string | null
  telefono: string
  ruolo: 'utente' | 'admin'
  creatoIl: string
}

export interface Post {
  id: number
  userId: number
  titolo: string
  corpo: string
  creatoIl: string
}

export interface Commento {
  id: number
  postId: number
  nome: string
  email: string
  corpo: string
  creatoIl: string
}

export interface Meta {
  pagina: number
  limite: number
  totale: number
  pagine: number
}

export interface RispostaPaginata<T> {
  dati: T[]
  meta: Meta
}
```

---

## 6. Composable `useApi.ts`

Unico punto di accesso all'API. Legge il token dal cookie e lo aggiunge automaticamente a ogni richiesta.

```ts
// composables/useApi.ts
export function useApi() {
  const token = useCookie('token')
  const config = useRuntimeConfig()

  async function chiamata<T>(percorso: string, opzioni: object = {}): Promise<T> {
    return $fetch<T>(percorso, {
      baseURL: config.public.apiBase,  // http://localhost:3000/api
      headers: token.value
        ? { Authorization: `Bearer ${token.value}` }
        : {},
      ...opzioni,
      onResponseError({ response }) {
        const msg = response._data?.errore || 'Errore del server'
        throw new Error(msg)
      }
    })
  }

  return { chiamata }
}
```

**Utilizzo nei componenti:**
```ts
const { chiamata } = useApi()
const utenti = await chiamata<Utente[]>('/utenti')
await chiamata('/utenti', { method: 'POST', body: { nome, email, ... } })
await chiamata(`/utenti/${id}`, { method: 'DELETE' })
```

---

## 7. Store Pinia

### `stores/auth.ts`

Gestisce token, utente loggato e ruolo. Persiste su cookie per sopravvivere al refresh.

```ts
export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('token')
  const utente = useCookie<Utente | null>('utente')

  const isLoggato = computed(() => !!token.value)
  const isAdmin = computed(() => utente.value?.ruolo === 'admin')

  async function login(email: string, password: string) {
    const { chiamata } = useApi()
    const risposta = await chiamata<{ token: string, utente: Utente }>(
      '/auth/login', { method: 'POST', body: { email, password } }
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
```

### `stores/utenti.ts`

```ts
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
```

### `stores/post.ts`

```ts
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
```

### `stores/commenti.ts`

```ts
export const useCommentiStore = defineStore('commenti', () => {
  const lista = ref<Commento[]>([])
  const postIdFiltro = ref<number | null>(null)

  async function carica(postId?: number) {
    const { chiamata } = useApi()
    postIdFiltro.value = postId ?? null
    const url = postId ? `/commenti?postId=${postId}` : '/commenti'
    lista.value = await chiamata<Commento[]>(url)
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
```

---

## 8. Middleware autenticazione

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  if (!auth.isLoggato && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (auth.isLoggato && to.path === '/login') {
    return navigateTo('/utenti')
  }
})
```

Il middleware viene applicato globalmente in `nuxt.config.ts`:
```ts
router: {
  middleware: ['auth']
}
```

---

## 9. Componenti

### `AppNav.vue`

Barra di navigazione con link alle 3 sezioni e bottone logout.

```vue
<template>
  <nav>
    <NuxtLink to="/utenti">Utenti</NuxtLink>
    <NuxtLink to="/post">Post</NuxtLink>
    <NuxtLink to="/commenti">Commenti</NuxtLink>
    <span>{{ auth.utente?.nome }}</span>
    <button @click="auth.logout()">Logout</button>
  </nav>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
```

### `CardUtente.vue`

```vue
<template>
  <div class="card">
    <h3>{{ utente.nome }}</h3>
    <p>{{ utente.email }}</p>
    <p>{{ utente.citta }}</p>
    <p>{{ utente.sesso }} — {{ utente.codiceFiscale }}</p>
    <p>Nato il: {{ formatData(utente.dataNascita) }}</p>
    <p>Tel: {{ utente.telefono }}</p>
    <small>{{ formatData(utente.creatoIl) }}</small>
    <div class="azioni">
      <button class="btn-primario" @click="$emit('vedi-post', utente)">Vedi Post</button>
      <button class="btn-secondario" @click="$emit('modifica', utente)">Modifica</button>
      <button v-if="isAdmin" class="btn-pericolo" @click="$emit('elimina', utente.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
defineProps<{ utente: Utente }>()
defineEmits(['vedi-post', 'modifica', 'elimina'])
function formatData(d: string | null) {
  return d ? new Date(d).toLocaleDateString('it-IT') : '—'
}
</script>
```

### `CardPost.vue`

```vue
<template>
  <div class="card">
    <h3>{{ post.titolo }}</h3>
    <p>{{ post.corpo }}</p>
    <small>{{ formatData(post.creatoIl) }}</small>
    <div class="azioni">
      <button class="btn-primario" @click="$emit('vedi-commenti', post)">Vedi Commenti</button>
      <button v-if="puoEliminare" class="btn-pericolo" @click="$emit('elimina', post.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const props = defineProps<{ post: Post }>()
defineEmits(['vedi-commenti', 'elimina'])
const puoEliminare = computed(() =>
  auth.isAdmin || props.post.userId === auth.utente?.id
)
function formatData(d: string) {
  return new Date(d).toLocaleDateString('it-IT')
}
</script>
```

### `CardCommento.vue`

```vue
<template>
  <div class="card">
    <strong>{{ commento.nome }}</strong>
    <span>{{ commento.email }}</span>
    <p>{{ commento.corpo }}</p>
    <small>{{ formatData(commento.creatoIl) }}</small>
    <div class="azioni">
      <button class="btn-pericolo" @click="$emit('elimina', commento.id)">Elimina</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ commento: Commento }>()
defineEmits(['elimina'])
function formatData(d: string) {
  return new Date(d).toLocaleDateString('it-IT')
}
</script>
```

### `Paginazione.vue`

```vue
<template>
  <div class="paginazione">
    <button :disabled="meta.pagina <= 1" @click="$emit('cambia-pagina', meta.pagina - 1)">← Precedente</button>
    <span>Pagina {{ meta.pagina }} di {{ meta.pagine }} ({{ meta.totale }} post)</span>
    <button :disabled="meta.pagina >= meta.pagine" @click="$emit('cambia-pagina', meta.pagina + 1)">Successiva →</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ meta: Meta }>()
defineEmits(['cambia-pagina'])
</script>
```

### `Breadcrumb.vue`

```vue
<template>
  <div class="breadcrumb">
    <span v-for="(voce, i) in voci" :key="i">
      <button v-if="voce.onClick" @click="voce.onClick">{{ voce.label }}</button>
      <span v-else>{{ voce.label }}</span>
      <span v-if="i < voci.length - 1"> → </span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ voci: { label: string, onClick?: () => void }[] }>()
</script>
```

### `Statistiche.vue`

```vue
<template>
  <div id="statistiche">
    {{ utentiStore.lista.length }} utenti |
    {{ postStore.meta?.totale ?? 0 }} post |
    {{ commentiStore.lista.length }} commenti
  </div>
</template>

<script setup lang="ts">
const utentiStore = useUtentiStore()
const postStore = usePostStore()
const commentiStore = useCommentiStore()
</script>
```

### `FormUtente.vue`

```vue
<template>
  <form @submit.prevent="invia">
    <h2>{{ utente ? 'Modifica Utente' : 'Nuovo Utente' }}</h2>
    <input v-model="form.nome" placeholder="Nome" required />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input v-model="form.citta" placeholder="Città" />
    <select v-model="form.sesso" required>
      <option value="">Sesso</option>
      <option value="M">Maschio</option>
      <option value="F">Femmina</option>
      <option value="Altro">Altro</option>
    </select>
    <input v-model="form.codiceFiscale" placeholder="Codice Fiscale" required />
    <input v-model="form.dataNascita" type="date" />
    <input v-model="form.telefono" placeholder="Telefono" />
    <input v-model="form.password" type="password"
      placeholder="Password" :required="!utente" />
    <div class="azioni">
      <button type="submit" class="btn-primario">Salva</button>
      <button v-if="utente" type="button" class="btn-secondario" @click="$emit('annulla')">Annulla</button>
    </div>
    <p v-if="errore" class="errore">{{ errore }}</p>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ utente?: Utente | null }>()
const emit = defineEmits(['salva', 'annulla'])

const errore = ref('')
const form = reactive({
  nome: props.utente?.nome ?? '',
  email: props.utente?.email ?? '',
  citta: props.utente?.citta ?? '',
  sesso: props.utente?.sesso ?? '',
  codiceFiscale: props.utente?.codiceFiscale ?? '',
  dataNascita: props.utente?.dataNascita ?? '',
  telefono: props.utente?.telefono ?? '',
  password: ''
})

const regexCF = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/

function invia() {
  errore.value = ''
  if (!regexCF.test(form.codiceFiscale)) {
    errore.value = 'Codice fiscale non valido'
    return
  }
  const dati: Record<string, string> = { ...form }
  if (!dati.password) delete dati.password
  emit('salva', dati)
}
</script>
```

---

## 10. Pagine

### `pages/login.vue`

```vue
<template>
  <div class="login-container">
    <h1>Mini JSONPlaceholder</h1>
    <form @submit.prevent="invia">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" class="btn-primario">Accedi</button>
      <p v-if="errore" class="errore">{{ errore }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: [] })  // escludi il middleware auth su questa pagina

const auth = useAuthStore()
const email = ref('')
const password = ref('')
const errore = ref('')

async function invia() {
  try {
    errore.value = ''
    await auth.login(email.value, password.value)
  } catch (e: any) {
    errore.value = e.message
  }
}
</script>
```

### `pages/utenti/index.vue`

```vue
<template>
  <div>
    <Statistiche />
    <FormUtente :utente="store.utenteInModifica" @salva="salva" @annulla="store.utenteInModifica = null" />
    <input v-model="ricerca" placeholder="Cerca utenti..." />
    <CardUtente
      v-for="utente in utentiFiltrati"
      :key="utente.id"
      :utente="utente"
      @vedi-post="vediPost"
      @modifica="store.utenteInModifica = $event"
      @elimina="elimina"
    />
  </div>
</template>

<script setup lang="ts">
const store = useUtentiStore()
const router = useRouter()
const ricerca = ref('')

onMounted(() => store.carica())

const utentiFiltrati = computed(() =>
  store.lista.filter(u =>
    [u.nome, u.email, u.citta].some(v =>
      v?.toLowerCase().includes(ricerca.value.toLowerCase())
    )
  )
)

async function salva(dati: Partial<Utente & { password?: string }>) {
  if (store.utenteInModifica) {
    await store.aggiorna(store.utenteInModifica.id, dati)
    store.utenteInModifica = null
  } else {
    await store.crea(dati as any)
  }
}

async function elimina(id: number) {
  if (confirm('Sei sicuro?')) await store.elimina(id)
}

function vediPost(utente: Utente) {
  router.push({ path: '/post', query: { userId: utente.id } })
}
</script>
```

### `pages/post/index.vue`

```vue
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
const store = usePostStore()
const router = useRouter()
const route = useRoute()

const userIdFiltro = computed(() =>
  route.query.userId ? Number(route.query.userId) : undefined
)

onMounted(() => store.carica(userIdFiltro.value))

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
```

### `pages/commenti/index.vue`

```vue
<template>
  <div>
    <Breadcrumb v-if="postIdFiltro" :voci="[
      { label: 'Post', onClick: () => router.push('/post') },
      { label: `Commenti del post #${postIdFiltro}` }
    ]" />
    <Statistiche />
    <FormCommento @salva="store.crea" />
    <CardCommento
      v-for="commento in store.lista"
      :key="commento.id"
      :commento="commento"
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
```

---

## 11. Configurazione Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/main.css'],
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api'
    }
  },
  router: {
    options: {
      middleware: ['auth']
    }
  }
})
```

---

## 12. CSS — `assets/css/main.css`

Stessa struttura del progetto vanilla con variabili CSS. Da copiare e adattare:

```css
:root {
  --colore-primario: #3b82f6;
  --colore-pericolo: #ef4444;
  --colore-secondario: #f59e0b;
  --sfondo: #f3f4f6;
  --raggio: 8px;
  --ombra: 0 1px 3px rgba(0,0,0,0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: var(--sfondo); }
.contenitore { max-width: 800px; margin: 0 auto; padding: 1rem; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: var(--raggio); padding: 1rem; margin-bottom: 1rem; box-shadow: var(--ombra); }
.btn-primario { background: var(--colore-primario); color: white; border: none; padding: .5rem 1rem; border-radius: var(--raggio); cursor: pointer; }
.btn-secondario { background: var(--colore-secondario); color: white; border: none; padding: .5rem 1rem; border-radius: var(--raggio); cursor: pointer; }
.btn-pericolo { background: var(--colore-pericolo); color: white; border: none; padding: .5rem 1rem; border-radius: var(--raggio); cursor: pointer; }
.azioni { display: flex; gap: .5rem; margin-top: .75rem; }
.errore { background: #fee2e2; color: #991b1b; padding: .75rem; border-radius: var(--raggio); margin-top: .5rem; }
.nascosta { display: none; }
nav { display: flex; gap: 1rem; background: var(--colore-primario); padding: 1rem; align-items: center; }
nav a { color: white; text-decoration: none; }
nav a.router-link-active { font-weight: bold; text-decoration: underline; }
```

---

## 13. `app.vue` — Root component

```vue
<template>
  <div>
    <AppNav v-if="auth.isLoggato" />
    <div class="contenitore">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
```

---

## 14. Fasi di implementazione

### Fase 1 — Setup progetto
**Obiettivo:** progetto Nuxt funzionante con connessione verificata al backend.

Comandi da eseguire:
```bash
cd ~/Documents
npx nuxi@latest init jsonplaceholder-nuxt
cd jsonplaceholder-nuxt
npm install
npm install @pinia/nuxt
```

File da modificare subito:
- `nuxt.config.ts` — aggiungere `ssr: false`, moduli Pinia, `runtimeConfig.apiBase`
- Copiare `stile.css` dal vanilla in `assets/css/main.css`
- Creare `types/index.ts` con le interfacce TypeScript

Verifica: `npm run dev` → pagina Nuxt di default su `http://localhost:3000`
> Nota: cambiare porta Nuxt a 8080 in `nuxt.config.ts` per non confondersi con il backend

---

### Fase 2 — Autenticazione
**Obiettivo:** login funzionante, redirect automatico, logout.

File da creare in ordine:
1. `stores/auth.ts` — store Pinia con token, utente, login(), logout()
2. `middleware/auth.ts` — redirect a /login se non autenticato
3. `pages/login.vue` — form email/password, chiama auth.login()
4. `app.vue` — root con `<AppNav>` condizionale e `<NuxtPage>`

Verifica:
- Aprire `http://localhost:8080` → redirect automatico a `/login`
- Login con `andreapavan67@gmail.com` / `PaolaChiara_67` → redirect a `/utenti`
- Refresh della pagina → rimane loggato (token in cookie)
- Click Logout → torna a `/login`

---

### Fase 3 — Composable API e Types
**Obiettivo:** unico punto di accesso all'API, token aggiunto automaticamente.

File da creare:
1. `types/index.ts` — interfacce Utente, Post, Commento, Meta, RispostaPaginata
2. `composables/useApi.ts` — wrapper $fetch con baseURL e token Bearer

Verifica da console browser:
```ts
const { chiamata } = useApi()
await chiamata('/utenti')  // deve restituire array utenti
```

---

### Fase 4 — Pagina Utenti
**Obiettivo:** lista utenti, creazione, modifica, eliminazione (solo admin).

File da creare in ordine:
1. `stores/utenti.ts` — carica(), crea(), aggiorna(), elimina()
2. `components/CardUtente.vue` — card con bottoni, Elimina visibile solo admin
3. `components/FormUtente.vue` — form con validazione CF, toggle crea/modifica
4. `pages/utenti/index.vue` — lista filtrata, gestione eventi

Verifica:
- Lista utenti caricata al mount
- Filtro ricerca funzionante
- Creazione nuovo utente → appare in lista
- Modifica utente → form pre-compilato, PATCH inviato
- Eliminazione (solo admin) → utente sparisce dalla lista

---

### Fase 5 — Pagina Post
**Obiettivo:** lista post con paginazione, drill-down da utenti, creazione, eliminazione.

File da creare in ordine:
1. `stores/post.ts` — carica(userId?, pagina), crea(), elimina()
2. `components/CardPost.vue` — Elimina visibile solo se autore o admin
3. `components/FormPost.vue` — campi userId (pre-compilato), titolo, corpo
4. `components/Paginazione.vue` — bottoni precedente/successiva, info pagina
5. `components/Breadcrumb.vue` — navigazione contestuale
6. `pages/post/index.vue` — legge `?userId` da query param, watch sul cambio

Verifica:
- Lista post con paginazione (3 per pagina)
- Click "Vedi Post" da utente → `/post?userId=7` → post filtrati
- Breadcrumb "Utenti → Post di X" con click per tornare
- Cambio pagina → nuova chiamata API

---

### Fase 6 — Pagina Commenti
**Obiettivo:** lista commenti, drill-down da post, creazione, eliminazione.

File da creare in ordine:
1. `stores/commenti.ts` — carica(postId?), crea(), elimina()
2. `components/CardCommento.vue` — card semplice con bottone elimina
3. `components/FormCommento.vue` — campi postId, nome, email, corpo
4. `pages/commenti/index.vue` — legge `?postId` da query param

Verifica:
- Lista commenti al mount (tutti)
- Click "Vedi Commenti" da post → `/commenti?postId=3` → commenti filtrati
- Breadcrumb "Post → Commenti di X" con click per tornare

---

### Fase 7 — Componenti condivisi
**Obiettivo:** navigazione, statistiche e layout completo.

File da creare/completare:
1. `components/AppNav.vue` — link navigazione + nome utente + logout
2. `components/Statistiche.vue` — legge dai 3 store, aggiorna automaticamente
3. `app.vue` — layout finale con nav e contenitore

Verifica:
- Nav mostra link attivo evidenziato (`.router-link-active`)
- Statistiche si aggiornano dopo ogni CRUD
- Layout consistente su tutte le pagine

---

### Fase 8 — Rifinitura e test finale
**Obiettivo:** gestione errori, feedback utente, test completo.

Azioni:
- Aggiungere gestione errori globale (try/catch nelle pagine, messaggio visibile)
- Verificare tutti i casi limite (form vuoti, eliminazione senza conferma, token scaduto)
- Test golden path completo: login → crea utente → crea post → crea commento → elimina tutto → logout
- Test ruoli: loggato come `utente` → bottone Elimina nascosto, 403 su DELETE

---

## 15. Problemi prevedibili e soluzioni

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| CORS error | Backend non raggiungibile | Verificare che Express sia avviato su :3000 |
| Token perso al refresh | Salvato solo in Pinia | Usare `useCookie` che persiste |
| Middleware applicato alla pagina login | Loop redirect infinito | `definePageMeta({ middleware: [] })` in login.vue |
| Porta Nuxt in conflitto con backend | Entrambi su :3000 | Impostare Nuxt su :8080 in nuxt.config.ts |
| TypeScript errors nei componenti | Types non importati | Usare auto-import di Nuxt (types in `types/index.ts`) |
| `$fetch` non disponibile fuori da Nuxt | Uso in file plain TS | Usare sempre dentro composables o componenti |

---

## 16. Note tecniche finali

- Il backend Express **non viene modificato** — tutte le API restano identiche
- CORS già abilitato sul backend, nessuna modifica necessaria
- Nuxt auto-importa composables, stores e componenti — non serve `import` manuale
- In modalità SPA (`ssr: false`) tutto gira nel browser — niente Node.js server aggiuntivo
- Per produzione: `npm run build` genera la cartella `dist/` servibile con qualsiasi web server statico
