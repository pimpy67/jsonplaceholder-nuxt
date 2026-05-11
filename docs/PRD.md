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
| HTTP client | `$fetch` / `useFetch` (built-in Nuxt) |
| Backend | Express API esistente (invariato, porta 3000) |
| Package manager | npm |

---

## 3. Struttura del progetto

```
jsonplaceholder-nuxt/
├── nuxt.config.ts              # Configurazione Nuxt (ssr: false, baseURL API)
├── app.vue                     # Root component — layout principale
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
│   ├── useApi.ts               # Wrapper fetch con Bearer token automatico
│   └── useAuth.ts              # Login, logout, stato autenticazione
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

Nuxt genera automaticamente le route dai file in `pages/`.

| Route | File | Corrisponde a |
|-------|------|---------------|
| `/login` | `pages/login.vue` | Sezione login attuale |
| `/utenti` | `pages/utenti/index.vue` | Sezione utenti attuale |
| `/post` | `pages/post/index.vue` | Sezione post attuale |
| `/commenti` | `pages/commenti/index.vue` | Sezione commenti attuale |

Il drill-down (utenti → post filtrati per userId, post → commenti filtrati per postId) viene gestito tramite **query params** nella URL:
- `/post?userId=3` — post di un utente specifico
- `/commenti?postId=7` — commenti di un post specifico

---

## 5. Componenti

### `CardUtente.vue`
Props: `utente`, `utenteLoggato`
Emits: `vedi-post`, `modifica`, `elimina`
Mostra: nome, email, città, sesso, CF, dataNascita, telefono, creatoIl
Bottone "Elimina" visibile solo se `utenteLoggato.ruolo === 'admin'`

### `CardPost.vue`
Props: `post`, `utenteLoggato`
Emits: `vedi-commenti`, `elimina`
Mostra: titolo, corpo, creatoIl
Bottone "Elimina" visibile solo se autore o admin

### `CardCommento.vue`
Props: `commento`
Emits: `elimina`
Mostra: nome, email, corpo, creatoIl

### `FormUtente.vue`
Props: `utente` (opzionale, per modalità modifica)
Emits: `salva`, `annulla`
Campi: nome, email, città, sesso, CF, dataNascita, telefono, password

### `Paginazione.vue`
Props: `meta` (pagina, totale, pagine)
Emits: `cambia-pagina`

### `Breadcrumb.vue`
Props: `voci` (array di `{ label, onClick }`)

### `Statistiche.vue`
Legge dai 3 store e mostra i contatori in tempo reale.

### `AppNav.vue`
Mostra i link di navigazione e il bottone Logout.
Usa `useAuth` per mostrare il nome utente loggato.

---

## 6. Composables

### `useApi.ts`
Wrapper attorno a `$fetch` di Nuxt. Aggiunge automaticamente:
- `Authorization: Bearer <token>` dall'auth store
- `baseURL: http://localhost:3000/api`
- Gestione errori (lancia Error con messaggio italiano)

```ts
const { data, error } = await useApi('/utenti')
await useApi('/utenti', { method: 'POST', body: { ... } })
```

### `useAuth.ts`
Gestisce login e logout:
- `login(email, password)` — chiama POST /auth/login, salva token e utente in Pinia + cookie
- `logout()` — svuota store e cookie, redirect a /login
- `utenteLoggato` — computed dal store
- `isAdmin` — computed `utenteLoggato.ruolo === 'admin'`

---

## 7. Store Pinia

### `auth.ts`
```ts
state: { token, utente }
actions: login(), logout()
getters: isAdmin, isLoggato
```

### `utenti.ts`
```ts
state: { lista, utenteInModifica }
actions: carica(), crea(), aggiorna(), elimina()
```

### `post.ts`
```ts
state: { lista, meta, paginaCorrente, userIdFiltro }
actions: carica(userId?, pagina), crea(), elimina()
```

### `commenti.ts`
```ts
state: { lista, postIdFiltro }
actions: carica(postId?), crea(), elimina()
```

---

## 8. Autenticazione e middleware

Il token JWT viene salvato in:
- **Pinia store** (per accesso reattivo nei componenti)
- **Cookie** `useCookie('token')` (persiste al refresh della pagina)

Il file `middleware/auth.ts` verifica che il token esista. Se non c'è → redirect automatico a `/login`.

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
    const auth = useAuthStore()
    if (!auth.isLoggato) return navigateTo('/login')
})
```

---

## 9. Differenze rispetto alla versione vanilla

| Aspetto | Vanilla | Nuxt |
|---------|---------|------|
| Routing | Toggle classi CSS `.nascosta` | Pagine separate con URL reali |
| Stato | Variabili globali in app.js | Pinia stores reattivi |
| Componenti | Funzioni in ui.js | File `.vue` con template/script/style |
| Token persistenza | `localStorage` | `useCookie` (sopravvive al refresh) |
| Drill-down | Stato in memoria | Query params nell'URL (condivisibile) |
| Reattività | Manuale (DOM manipulation) | Automatica (Vue reactivity) |
| TypeScript | No | Sì (opzionale ma consigliato) |

---

## 10. Fasi di implementazione

### Fase 1 — Setup progetto
- [ ] `npx nuxi init` con template base
- [ ] Configurare `nuxt.config.ts` (ssr: false, CSS globale)
- [ ] Installare Pinia (`@pinia/nuxt`)
- [ ] Copiare `assets/css/main.css` dal progetto vanilla
- [ ] Verificare connessione al backend Express

### Fase 2 — Autenticazione
- [ ] Store `auth.ts` con Pinia
- [ ] Composable `useAuth.ts`
- [ ] Pagina `login.vue`
- [ ] Middleware `auth.ts`
- [ ] Test: login, logout, redirect automatico

### Fase 3 — Composable API
- [ ] Composable `useApi.ts`
- [ ] Types in `types/index.ts`
- [ ] Test con chiamata GET /utenti

### Fase 4 — Pagina Utenti
- [ ] Store `utenti.ts`
- [ ] Componente `CardUtente.vue`
- [ ] Componente `FormUtente.vue`
- [ ] Pagina `utenti/index.vue`
- [ ] Test: lista, creazione, modifica, eliminazione (admin)

### Fase 5 — Pagina Post
- [ ] Store `post.ts`
- [ ] Componente `CardPost.vue`
- [ ] Componente `FormPost.vue`
- [ ] Componente `Paginazione.vue`
- [ ] Pagina `post/index.vue` con query param `?userId=`
- [ ] Test: lista, paginazione, drill-down da utenti

### Fase 6 — Pagina Commenti
- [ ] Store `commenti.ts`
- [ ] Componente `CardCommento.vue`
- [ ] Componente `FormCommento.vue`
- [ ] Pagina `commenti/index.vue` con query param `?postId=`
- [ ] Test: lista, drill-down da post

### Fase 7 — Componenti condivisi
- [ ] `AppNav.vue` con stato login
- [ ] `Breadcrumb.vue`
- [ ] `Statistiche.vue` con Promise.all
- [ ] `app.vue` con layout generale

### Fase 8 — Rifinitura
- [ ] Gestione errori globale
- [ ] Messaggi di feedback (errore/successo)
- [ ] Validazione form lato client
- [ ] Test completo golden path
- [ ] Test ruoli (admin vs utente)

---

## 11. Note tecniche

- Il backend Express **non viene modificato** — tutte le API restano identiche
- CORS già abilitato sul backend, nessuna modifica necessaria
- Nuxt in modalità SPA genera file statici servibili con qualsiasi web server
- Il `nuxt.config.ts` configura `runtimeConfig.public.apiBase` per l'URL del backend
- TypeScript è opzionale ma consigliato per i types di Utente, Post, Commento
