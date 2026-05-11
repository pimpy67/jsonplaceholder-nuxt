# PRD — Gestione Archivio Adozioni a Distanza

Adattamento del progetto `jsonplaceholder-nuxt` per la gestione di un archivio di bambini adottati a distanza, con collegamento padrini, materiale multimediale e tracciamento comunicazioni.

---

## 1. Obiettivo

Realizzare un sistema web completo per un'associazione che gestisce circa **1.000 bambini** adottati a distanza. Il sistema deve permettere di:

- Catalogare l'anagrafica di ogni bambino con codice univoco
- Gestire i padrini (sostenitori) e il loro collegamento ai bambini
- Archiviare e organizzare materiale multimediale (foto, pagelle, lettere)
- Tracciare quali materiali sono già stati inviati ai padrini
- Controllare l'accesso tramite ruoli (admin = staff associazione, utente = consultazione)

Il riconoscimento facciale per la catalogazione iniziale delle foto viene gestito tramite **DigiKam** (software desktop offline, separato dal web app) — il web app riceve le foto già organizzate.

---

## 2. Stack tecnologico

Identico al progetto base `jsonplaceholder-nuxt`, con una sola aggiunta: **gestione file upload**.

| Layer | Tecnologia |
|-------|------------|
| Framework frontend | Nuxt 3 (Vue 3), SPA mode |
| State management | Pinia |
| Stile | CSS puro |
| HTTP client | `$fetch` Nuxt |
| Backend | Express 4 (Node.js, ES Modules) |
| Database | MySQL 8 via Docker |
| Autenticazione | JWT + bcrypt |
| Upload file | `multer` (middleware Express) |
| Storage file | Filesystem locale sul VPS (`/uploads/`) |
| Deploy | VPS europeo + Docker Compose |

---

## 3. Modello dati

### Differenza chiave rispetto al progetto base

Il progetto base ha relazioni **uno-a-molti** (un utente → molti post).
Qui abbiamo una relazione **molti-a-molti** tra bambini e padrini, gestita tramite la tabella `adozioni`.

```
bambini ──── adozioni ──── padrini
   │                          
   └──── materiale           
```

---

### Schema SQL

```sql
-- Tabella BAMBINI
CREATE TABLE bambini (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codice          VARCHAR(10)  NOT NULL UNIQUE,         -- es. B001
  nome            VARCHAR(100) NOT NULL,
  cognome         VARCHAR(100) NOT NULL,
  data_nascita    DATE,
  nazione         VARCHAR(100),
  storia_bio      TEXT,
  status          ENUM('attivo', 'in_attesa', 'archivio') NOT NULL DEFAULT 'attivo',
  foto_profilo    VARCHAR(255),                          -- percorso file
  creato_il       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabella PADRINI
CREATE TABLE padrini (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codice          VARCHAR(10)  NOT NULL UNIQUE,         -- es. P001
  nome            VARCHAR(100) NOT NULL,
  cognome         VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  telefono        VARCHAR(20),
  indirizzo       VARCHAR(255),
  citta           VARCHAR(100),
  cap             VARCHAR(10),
  note            TEXT,
  attivo          BOOLEAN NOT NULL DEFAULT TRUE,
  creato_il       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ADOZIONI (collegamento molti-a-molti)
CREATE TABLE adozioni (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bambino_id      INT NOT NULL,
  padrino_id      INT NOT NULL,
  data_inizio     DATE NOT NULL,
  data_fine       DATE,                                 -- NULL = adozione in corso
  note            TEXT,
  FOREIGN KEY (bambino_id) REFERENCES bambini(id) ON DELETE RESTRICT,
  FOREIGN KEY (padrino_id) REFERENCES padrini(id) ON DELETE RESTRICT
);

-- Tabella MATERIALE (archivio media)
CREATE TABLE materiale (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bambino_id      INT NOT NULL,
  tipo            ENUM('foto', 'pagella', 'lettera', 'altro') NOT NULL,
  file_path       VARCHAR(255) NOT NULL,                -- percorso file sul server
  file_nome       VARCHAR(255) NOT NULL,                -- nome originale
  descrizione     VARCHAR(255),
  anno            YEAR,
  inviato_padrino BOOLEAN NOT NULL DEFAULT FALSE,       -- tracciamento invio
  data_invio      DATE,
  caricato_il     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bambino_id) REFERENCES bambini(id) ON DELETE CASCADE
);

-- Tabella UTENTI (staff associazione)
CREATE TABLE utenti (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  ruolo           ENUM('utente', 'admin') NOT NULL DEFAULT 'utente',
  creato_il       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API endpoints

### Autenticazione
- `POST /api/auth/login` — login staff
- `POST /api/auth/registra` — registra nuovo membro staff (solo admin)

### Bambini (`/api/bambini`)
- `GET /` — lista tutti (filtri: `?status=attivo`, `?nazione=Kenya`, `?senza_padrino=true`)
- `GET /:id` — dettaglio bambino con adozioni e materiale
- `POST /` — crea nuovo bambino *(admin)*
- `PATCH /:id` — modifica dati *(admin)*
- `DELETE /:id` — archivio logico, non cancellazione fisica *(admin)*

### Padrini (`/api/padrini`)
- `GET /` — lista tutti (filtri: `?attivo=true`, `?bambino_id=5`)
- `GET /:id` — dettaglio padrino con bambini adottati
- `POST /` — crea padrino *(admin)*
- `PATCH /:id` — modifica *(admin)*

### Adozioni (`/api/adozioni`)
- `GET /` — lista (filtri: `?bambino_id=3`, `?padrino_id=7`, `?in_corso=true`)
- `POST /` — collega bambino ↔ padrino *(admin)*
- `PATCH /:id` — chiudi adozione (imposta `data_fine`) *(admin)*
- `DELETE /:id` *(admin)*

### Materiale (`/api/materiale`)
- `GET /` — lista (filtri: `?bambino_id=3`, `?tipo=foto`, `?inviato=false`)
- `POST /upload` — upload file + metadati *(admin)* — multipart/form-data
- `PATCH /:id/inviato` — segna come inviato al padrino *(admin)*
- `DELETE /:id` *(admin)*
- `GET /file/:filename` — serve il file fisico (con autenticazione)

---

## 5. Gestione file upload

### Backend — `multer`

```js
// middleware/upload.js
import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unico + path.extname(file.originalname))
  }
})

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB max
  fileFilter: (req, file, cb) => {
    const consentiti = /jpeg|jpg|png|pdf/
    const ok = consentiti.test(path.extname(file.originalname).toLowerCase())
    ok ? cb(null, true) : cb(new Error('Solo JPG, PNG, PDF'))
  }
})
```

### Route upload

```js
// routes/materiale.js
router.post('/upload', richiediAutenticazione, upload.single('file'), async (req, res) => {
  const { bambino_id, tipo, descrizione, anno } = req.body
  const file_path = req.file.filename
  const file_nome = req.file.originalname
  // salva in DB e restituisce il record creato
})
```

### Serve file con autenticazione

```js
router.get('/file/:filename', richiediAutenticazione, (req, res) => {
  const filePath = path.join(process.cwd(), 'uploads', req.params.filename)
  res.sendFile(filePath)
})
```

---

## 6. Struttura progetto (adattamento da jsonplaceholder-nuxt)

```
jsonplaceholder-bambini/        ← cartella rinominata o fork
├── nuxt.config.ts
├── app.vue
├── assets/css/main.css
├── components/
│   ├── CardBambino.vue         ← sostituisce CardUtente
│   ├── CardPadrino.vue         ← sostituisce CardPost
│   ├── CardMateriale.vue       ← sostituisce CardCommento
│   ├── CardAdozione.vue        ← nuovo
│   ├── FormBambino.vue
│   ├── FormPadrino.vue
│   ├── FormMateriale.vue       ← con input file
│   ├── Paginazione.vue         ← invariato
│   ├── Breadcrumb.vue          ← invariato
│   ├── Statistiche.vue         ← adattato
│   └── AppNav.vue              ← adattato
├── composables/
│   └── useApi.ts               ← invariato
├── middleware/
│   └── auth.ts                 ← invariato
├── pages/
│   ├── login.vue               ← invariato
│   ├── bambini/index.vue       ← lista + form
│   ├── bambini/[id].vue        ← dettaglio bambino (nuovo)
│   ├── padrini/index.vue
│   ├── adozioni/index.vue
│   └── materiale/index.vue
├── stores/
│   ├── auth.ts                 ← invariato
│   ├── bambini.ts
│   ├── padrini.ts
│   ├── adozioni.ts
│   └── materiale.ts
└── types/
    └── index.ts                ← nuovi tipi
```

---

## 7. TypeScript Types

```ts
export interface Bambino {
  id: number
  codice: string           // B001
  nome: string
  cognome: string
  data_nascita: string | null
  nazione: string
  storia_bio: string
  status: 'attivo' | 'in_attesa' | 'archivio'
  foto_profilo: string | null
  creato_il: string
}

export interface Padrino {
  id: number
  codice: string           // P001
  nome: string
  cognome: string
  email: string
  telefono: string
  indirizzo: string
  citta: string
  attivo: boolean
  creato_il: string
}

export interface Adozione {
  id: number
  bambino_id: number
  padrino_id: number
  data_inizio: string
  data_fine: string | null  // null = in corso
  note: string
  // join data (dall'API)
  bambino?: Bambino
  padrino?: Padrino
}

export interface Materiale {
  id: number
  bambino_id: number
  tipo: 'foto' | 'pagella' | 'lettera' | 'altro'
  file_path: string
  file_nome: string
  descrizione: string
  anno: number | null
  inviato_padrino: boolean
  data_invio: string | null
  caricato_il: string
}
```

---

## 8. Pagine e funzionalità chiave

### `/bambini` — Lista bambini
- Filtro per status (attivo / in attesa / archivio)
- Filtro per nazione
- Filtro "senza padrino" — bambini che cercano sostegno
- Card con foto profilo, nome, codice, status, bottone "Vedi dettaglio"

### `/bambini/:id` — Dettaglio bambino *(pagina nuova rispetto al base)*
- Dati anagrafici completi
- Sezione adozioni: padrino/i attuale/i con date
- Galleria materiale: foto, pagelle, lettere
- Bottone "Segna come inviato" per ogni documento non ancora inviato

### `/padrini` — Lista padrini
- Filtro per attivo/non attivo
- Card con nome, email, numero bambini adottati
- Drill-down: click → vedi i bambini di quel padrino

### `/adozioni` — Gestione adozioni
- Vista tabellare: bambino ↔ padrino, data inizio, stato
- Form per creare nuovo collegamento (dropdown bambino + dropdown padrino)
- Bottone "Chiudi adozione" (imposta data_fine)

### `/materiale` — Archivio media
- Filtro per tipo, per anno, per "non ancora inviato"
- Upload nuovo file con form (bambino, tipo, anno, descrizione)
- Vista: anteprima foto, link download PDF
- Bottone "Segna inviato" con data

---

## 9. GDPR e sicurezza

Trattando dati di minori, questi punti sono **non negoziabili**:

| Requisito | Soluzione |
|-----------|-----------|
| Dati su server europeo | VPS in EU (es. Hetzner DE, OVH FR) |
| Accesso limitato | JWT obbligatorio su tutti gli endpoint |
| Foto non indicizzabili | File serviti solo con autenticazione, mai URL pubblici |
| Log accessi | Logger Express già presente nel base |
| Backup | Cron job `mysqldump` giornaliero sul VPS |
| Cancellazione sicura | Soft delete (campo `status = archivio`) — mai DELETE fisico su bambini |

---

## 10. Fasi di implementazione

### Fase 1 — Conversione Nuxt base
Completa la conversione del progetto vanilla → Nuxt (le 8 fasi del PRD base).
**Non modificare nulla** — impara il framework su dati neutri.

---

### Fase 2 — Adattamento backend
**Obiettivo:** nuovo schema MySQL + API per le 4 entità.

1. Copia il progetto `jsonplaceholder-nuxt` in una nuova cartella `jsonplaceholder-bambini`
2. Scrivi `schema_bambini.sql` con le 5 tabelle
3. Scrivi `seed_bambini.sql` con dati di test (5 bambini, 3 padrini, alcune adozioni)
4. Crea `database/queries/bambini.js`, `padrini.js`, `adozioni.js`, `materiale.js`
5. Crea `routes/bambini.js`, `padrini.js`, `adozioni.js`, `materiale.js`

Verifica: tutti gli endpoint rispondono correttamente con Postman o browser.

---

### Fase 3 — Upload file
**Obiettivo:** caricare foto e PDF collegati a un bambino.

1. `npm install multer`
2. Crea cartella `uploads/` con `.gitignore` per non committare i file
3. Crea `middleware/upload.js`
4. Aggiungi route `POST /api/materiale/upload`
5. Aggiungi route `GET /api/materiale/file/:filename` con auth

Verifica: carica una foto via Postman → appare in `uploads/` → GET con token restituisce l'immagine.

---

### Fase 4 — Adattamento frontend (stores e types)
**Obiettivo:** i 4 store Pinia + i tipi TypeScript per le nuove entità.

1. Aggiorna `types/index.ts` con Bambino, Padrino, Adozione, Materiale
2. Crea `stores/bambini.ts`, `stores/padrini.ts`, `stores/adozioni.ts`, `stores/materiale.ts`

---

### Fase 5 — Componenti card e form
**Obiettivo:** i mattoni dell'interfaccia.

1. `CardBambino.vue` — foto profilo, codice, nome, status, bottoni
2. `CardPadrino.vue` — nome, email, numero bambini adottati
3. `CardAdozione.vue` — coppia bambino/padrino con date
4. `CardMateriale.vue` — anteprima file, tipo, anno, stato invio
5. `FormBambino.vue`, `FormPadrino.vue`
6. `FormMateriale.vue` — con `<input type="file">` e preview

---

### Fase 6 — Pagine principali
**Obiettivo:** `/bambini`, `/padrini`, `/adozioni`, `/materiale`.

Seguendo lo stesso pattern delle pagine del progetto base: store.carica() in onMounted, watch sui query params per i filtri, emit verso gli store per le azioni.

---

### Fase 7 — Pagina dettaglio bambino
**Obiettivo:** `/bambini/:id` — vista completa con adozioni e materiale.

Pagina nuova rispetto al base: usa route dinamica `pages/bambini/[id].vue`.

```ts
const route = useRoute()
const bambino = ref<Bambino | null>(null)
const adozioni = ref<Adozione[]>([])
const materiale = ref<Materiale[]>([])

onMounted(async () => {
  const id = Number(route.params.id)
  bambino.value = await chiamata(`/bambini/${id}`)
  adozioni.value = await chiamata(`/adozioni?bambino_id=${id}`)
  materiale.value = await chiamata(`/materiale?bambino_id=${id}`)
})
```

---

### Fase 8 — Deploy su VPS
**Obiettivo:** sistema accessibile online per lo staff dell'associazione.

1. Acquista VPS europeo (Hetzner CX21 o simile, ~4€/mese)
2. Installa Docker + Docker Compose sul VPS
3. Configura `docker-compose.yml` con MySQL + backend Express
4. Build Nuxt: `npm run build` → cartella `dist/` servita da Nginx
5. Configura HTTPS con Let's Encrypt (certbot)
6. Configura backup automatico: `mysqldump` + copia `uploads/`

---

## 11. Differenze rispetto al progetto base

| Aspetto | jsonplaceholder-nuxt | jsonplaceholder-bambini |
|---------|---------------------|------------------------|
| Entità principali | Utenti, Post, Commenti | Bambini, Padrini, Adozioni, Materiale |
| Relazioni | Uno-a-molti | Molti-a-molti (via adozioni) |
| File | Nessuno | Upload foto/PDF con multer |
| Pagine | 3 (utenti, post, commenti) | 4 + dettaglio bambino |
| Deploy | Locale / sviluppo | VPS produzione con HTTPS |
| Sensibilità dati | Bassa (dati fittizi) | Alta (minori, GDPR) |
| Nuovi concetti | — | Route dinamiche, upload, soft delete, join SQL |

---

## 12. Problemi prevedibili e soluzioni

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| File troppo grandi | Utente carica foto ad alta risoluzione | Limite 10MB in multer + istruzioni di compressione |
| URL file accessibile senza login | Link diretto al file | Servire tramite route autenticata, non cartella pubblica |
| Bambino con più padrini | Adozioni sovrapposte | Validare nel backend: un bambino può avere una sola adozione attiva alla volta |
| Cancellazione accidentale | DELETE fisico su bambino | Solo soft delete — campo `status = archivio` |
| Join SQL complessi | Query su più tabelle | Creare view MySQL o query strutturate con JOIN in `queries/` |
| CORS su file upload | Multipart non configurato | `cors()` già attivo su Express, nessuna modifica necessaria |

---

## 13. Flusso di lavoro completo (workflow DigiKam + web app)

```
1. RACCOLTA FOTO
   Importa tutte le foto non ordinate in DigiKam sul PC locale

2. RICONOSCIMENTO FACCIALE (offline, GDPR safe)
   DigiKam Face Detection → istruisci con 5-10 foto per bambino
   → l'IA raggruppa automaticamente le foto per bambino

3. ESPORTAZIONE ORGANIZZATA
   Esporta da DigiKam in cartelle: /B001-Mario/, /B002-Anna/, ...

4. CARICAMENTO NEL WEB APP
   Staff carica le foto già organizzate tramite FormMateriale.vue
   → le foto vengono salvate in uploads/ sul VPS
   → ogni file viene collegato al bambino nel database

5. TRACCIAMENTO INVIO
   Per ogni padrino da aggiornare:
   - Filtra materiale: bambino_id=X, inviato=false
   - Scarica/invia il materiale via email al padrino
   - Clicca "Segna inviato" → sistema registra data_invio

6. REPORT
   Filtro "non ancora inviato" → lista priorità per il prossimo aggiornamento
```
