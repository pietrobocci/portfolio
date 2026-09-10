# Sito portfolio di Pietro Bocci — Design

Data: 2026-09-10
Stato: approvato (sezioni 1-3)

## 1. Obiettivo

Un sito personale che presenti Pietro come **fullstack engineer** (TypeScript, React,
Next.js, Node) a agenzie e aziende di prodotto, con i tre progetti pubblici come prova e
una demo live della dApp `batch-certify`.

Il sito stesso è un campione di codice: è scritto nello stack che i destinatari usano.

Non è un sito da contractor web3 e non è un sito bilingue. Le alternative sono state
valutate e scartate (vedi §9).

### Criteri di successo

- Un recruiter capisce in 30 secondi cosa Pietro sa fare e con che stack.
- Un tech lead può cliccare tre repo GitHub e provare una dApp senza installare nulla.
- Nessuna informazione pubblicata espone il datore di lavoro attuale.

## 2. Vincoli non negoziabili

1. **Isolamento del repo.** Il repo git vive in `New folder (2)/portfolio`, mai nella
   cartella padre: la radice contiene materiale aziendale (report di screening
   farmaceutico, `de_findings.py`, `checkpoint.json`). Un `git init` sulla radice
   pubblicherebbe quel materiale.
2. **Anonimizzazione.** Nel contenuto pubblico il datore è
   *"a pharmaceutical automation company (Italy)"*. La macchina è
   *"the first gloveless, humanless robotic aseptic filling platform"*. Il nome del
   datore, quello commerciale della macchina e quello interno del progetto di lavoro
   non compaiono da nessuna parte nel repo, documentazione inclusa: questo file è
   pubblico quanto il sito. La lista dei termini vietati sta in `scripts/check-leaks.mjs`,
   che non è versionato.
3. **Identità.** Autore git: `pietroboccimeetin@gmail.com`, configurato a livello di
   repo. Email di contatto mostrata sul sito: `pietroboccifb@outlook.com`.
4. **Codice studiabile riga per riga.** File piccoli, nomi espliciti, nessuna astrazione
   furba. Vale come per `ai-content-enricher`.
5. **Lingua del sito:** inglese. Spec e documentazione interna: italiano.
6. **Budget zero.** Nessun servizio a pagamento, nessun backend, nessuna chiave segreta.

## 3. Architettura

### Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · deploy su Vercel.

Tutte le pagine sono statiche e pre-renderizzate: nessun database, nessuna route API,
nessun segreto. L'unica parte dinamica è la dApp, che gira interamente nel browser —
wagmi/viem parlano direttamente con Sepolia tramite il wallet dell'utente o un RPC
pubblico in sola lettura.

Dominio: sottodominio Vercel in v1 (`pietrobocci.vercel.app`). Un dominio custom si
aggiunge dopo senza toccare il codice.

### Struttura delle cartelle

```
src/
  app/                      pagine di contenuto — zero dipendenze web3
    page.tsx                home
    cv/page.tsx
    demo/batch-certify/page.tsx
    layout.tsx              header, footer, metadata
  content/                  dati tipizzati, unica fonte di verità testuale
    cv.ts
    projects.ts
    site.ts                 nome, headline, contatti
  components/               componenti di presentazione riutilizzabili
  features/batch-certify/   il port della dApp
    lib/                    logica pura, testata
    components/             UI web3
    config.ts               chainId -> indirizzo del contratto
    abi.ts                  ABI copiata dal repo batch-certify
```

Il codice web3 è confinato in `features/batch-certify/` e caricato con
`dynamic(..., { ssr: false })`: wagmi non deve mai essere valutato durante il render
lato server.

### Contenuti tipizzati

Il testo del CV e dei progetti vive in `src/content` come oggetti TypeScript, non
disseminato nel JSX. Aggiornare un ruolo o una descrizione significa cambiare un file.

### Rapporto con il repo batch-certify

ABI e indirizzi dei contratti sono **copiati** in `features/batch-certify/`, non
importati né condivisi via workspace. Duplicazione deliberata: un monorepo o un pacchetto
npm per due file costerebbe più di quanto renda. Contropartita: dopo un redeploy dei
contratti i file vanno risincronizzati a mano. Il README del repo lo dichiara, così la
cosa non si scopre a demo rotta.

## 4. Pagine

### `/` — Home

- Sopra la piega: nome, headline (*fullstack engineer, TypeScript/React/Node — 6+ anni di
  software mission-critical in farmaceutico regolamentato*), due call to action:
  *View CV* e *Try the live demo*.
- Tre card progetto, in quest'ordine: **AI Content Enricher**, **Batch Certify**,
  **Industrial Data Integrity on a Private EVM Chain**. L'ordine è deliberato: il target è
  fullstack e AI, quindi il progetto Next.js + LLM apre.
- Ogni card: una riga su cosa fa, stack, link al repo GitHub. Batch Certify ha in più
  *Try it live*.
- Blocco contatti in chiusura.

### `/cv` — CV

**La pagina è il CV.** Non un PDF incorniciato in un `<iframe>`: HTML vero, che si apre in
mezzo secondo, si legge sul telefono, è indicizzabile e ha i link ai repo cliccabili.

Contenuto derivato da `spalla/percorso-web3/CV/cv-pietro-bocci.html` (versione del
2026-09-09, la più aggiornata: contiene tutti e tre i progetti), riimpaginato per lo
schermo e **ribilanciato per un target fullstack**: TypeScript, React, Next.js e Node in
cima; blockchain come sezione forte ma non prima; l'headline non è più
"Blockchain & Smart Contract Development".

Anni di esperienza: **6+** (l'HTML sorgente dice ancora 5+).

Sezioni: profilo, progetti di ingegneria, esperienza professionale (anonimizzata),
competenze, formazione, lingue.

#### Il PDF è un output della pagina, non un file parallelo

Foglio di stile `@media print` sulla pagina `/cv` che produce un A4 pulito. Il bottone
"Download PDF" apre la stampa del browser (`window.print()`). Nessun PDF statico in
`public/`, nessuna libreria di generazione a runtime, nessun file da tenere allineato a
mano.

Motivazione, verificata sul campo: al 2026-09-10 esistevano due CV divergenti in
`percorso-web3/CV/`. Il PDF `CV-Pietro-Bocci-Web3-1.pdf`, benché più recente come data
file, era più vecchio come contenuto — nessun AI Content Enricher, *"two shipped
full-stack blockchain projects"*, e un segnaposto `github.com/<username>` mai
sostituito nel blocco contatti. Una fonte sola rende quel tipo di errore impossibile.

Il PDF serve comunque (allegati alle candidature, parsing ATS), ma si ottiene stampando
la pagina.

### `/demo/batch-certify` — Demo

In testa, ~150 parole di case study: perché si ancora l'hash e non il documento, cosa
resta off-chain, cosa dimostra una revoca che preserva l'audit trail.

Sotto, la dApp, con tre stati gestiti esplicitamente:

1. **Contratto non ancora deployato su Sepolia** — banner "live demo landing soon", case
   study e link al repo. Nessun errore a schermo. È lo stato iniziale: il deploy su
   Sepolia lo fa Pietro.
2. **Visitatore senza wallet** — la verifica funziona lo stesso: file o hash incollato,
   SHA-256 calcolato in locale con la Web Crypto API, lettura on-chain via RPC pubblico
   Sepolia. È il percorso principale, a zero attrito.
3. **Wallet connesso su Sepolia** — issue e revoke reali, con link a Etherscan.

### Contatti

Nessuna pagina dedicata e nessun form. Email, LinkedIn e GitHub nel footer di ogni pagina.

## 5. Qualità

### Testing

- **Vitest** sulla logica pura portata da batch-certify: hashing di un file,
  formattazione di indirizzi e timestamp, risoluzione `chainId -> deployment`. Funzioni
  con input e output: TDD applicabile davvero.
- **Nessun test** sul JSX di presentazione. Verificare che un `<h1>` contenga il nome è
  cerimonia senza valore.
- **Gate di build**: `tsc --noEmit`, `next build`, `eslint`. Se passano, il sito è integro.
- **Verifica visiva** prima di dichiarare finita una tappa: dev server, le tre pagine a
  desktop e mobile, console del browser pulita, screenshot consegnati a Pietro.

### Accessibilità e performance

Sono la parte del portfolio che un tech lead ispeziona per prima, quindi non sono
opzionali: HTML semantico, contrasto AA, focus visibile, navigazione completa da tastiera,
`next/image`, font locale via `next/font` (nessuna richiesta a Google), metadata Open
Graph per l'anteprima del link.

Il tema segue la preferenza di sistema. Nessun toggle chiaro/scuro in v1.

### Niente diario di bordo

Deciso il 2026-09-10: su questo progetto non si tiene. Metà del lavoro è layout e
contenuti e non produce intoppi che valga la pena studiare; il diario resta uno strumento
per i progetti dove si impara qualcosa, non una consuetudine da applicare ovunque. Vale
solo qui: la pratica resta in piedi per gli altri repo.

## 6. Ordine dei lavori

Ogni tappa lascia il sito funzionante e pubblicabile.

1. Scheletro Next + Tailwind, layout, footer. **Deploy su Vercel subito**, con il sito
   ancora vuoto: il canale di pubblicazione va provato quando non c'è niente da perdere.
2. `src/content` popolato e pagina `/cv` anonimizzata.
3. Home con le tre card progetto.
4. `/demo/batch-certify` in stato "case study", senza web3. **Da qui il sito è già
   mostrabile a qualcuno.**
5. Port della dApp: prima la logica pura con i test, poi la UI, con lo stato "contratto
   non deployato" funzionante.
6. Attivazione della demo live quando Pietro fa il deploy su Sepolia: cambia un file di
   configurazione degli indirizzi, nient'altro.
7. Passata finale: accessibilità, performance, Open Graph, screenshot.

## 7. Fuori scope in v1

Dichiarato esplicitamente, per non riaprirlo a metà lavoro: blog o sezione articoli,
analytics, form di contatto, toggle del tema, internazionalizzazione, CMS, case study
dedicati per AI Content Enricher e Industrial Data Integrity.

## 8. Dipendenze esterne

| Dipendenza | Da chi | Blocca |
|---|---|---|
| Deploy di `BatchCertificate` su Sepolia + verifica Etherscan | Pietro | Solo la tappa 6. Le tappe 1-5 procedono senza. |

Una sola dipendenza esterna, e non blocca l'inizio dei lavori. Il PDF del CV non compare
più: si ottiene stampando la pagina `/cv` (vedi §4).

## 9. Decisioni prese e alternative scartate

- **Posizionamento fullstack, non contractor web3.** I progetti blockchain restano in
  evidenza, ma il taglio del sito parla ad agenzie e aziende di prodotto.
- **Demo live su Sepolia**, non case study statico né demo simulata in memoria. Una demo
  finta o è dichiarata (e perde credibilità) o è taciuta (ed è disonesta).
- **Demo embeddata nel sito**, non dApp separata su un altro dominio: portarla dentro Next
  è la prova migliore che Pietro sa lavorare in quello stack.
- **Solo inglese.** I repo sono già in inglese e l'obiettivo di lungo periodo è
  internazionale.
- **Datore anonimizzato**, non CV completo pubblico: il vincolo dichiarato è non farsi
  scoprire dall'azienda attuale.
- **Niente Rust** (Leptos/Yew/Axum). Nessun wagmi in Rust lato browser, bundle WASM
  ingiustificato per pagine statiche, e soprattutto un portfolio in Rust contraddice il
  posizionamento fullstack TypeScript. Rust si difende su un progetto dove è la risposta
  al problema — un indexer di eventi, un tool CLI — non qui.
- **Sito statico**, nessun backend: niente da mantenere, niente segreti da custodire,
  costo zero.
- **CV come pagina HTML con stampa A4**, non PDF statico e non PDF incorniciato in un
  `<iframe>`. L'iframe è il peggio dei due mondi: sui telefoni i visualizzatori PDF nativi
  costringono a zoomare a due dita e spesso scaricano invece di mostrare. Una fonte sola
  elimina il rischio di versioni divergenti.
- **Niente diario di bordo su questo repo** (vedi §5).
