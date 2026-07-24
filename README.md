# Vineyard 

Questo repository contiene la soluzione completa ai due task di valutazione richiesti:
1. **Backend**: Simulazione del modello matematico Oidio tramite REST-API stateless (Problema 1) ed estensione per il salvataggio multi-giornaliero su database PostgreSQL (Problema 2).
2. **Frontend**: Dashboard interattiva per il monitoraggio della patologia Sordidus, comprensiva di Mappa Satellitare dinamica (Google Maps), grafico temporale (Highcharts) e gestione allarmi.

## Struttura del Progetto

```text
/
├── backend/                             # Soluzione Backend (Problema 1 e 2)
│   ├── vineyard_model/                  # App Django con logica API (views.py, serializers.py, models.py)
│   ├── THEORY_PROBLEM_2.txt             # Spiegazione teorica, query SQL analitiche e Notazione O-Grande
│   ├── Dockerfile                       # Istruzioni di build per l'API Python
│   ├── docker-compose.yml               # Orchestrazione container (API + PostgreSQL)
│   └── requirements.txt                 # Dipendenze Python
│
├── frontend/                            # Soluzione Frontend (Mappa e Modello)
│   ├── app/                             # Pagine Next.js (page.tsx, modello/page.tsx, api/send-email/)
│   ├── lib/weather.ts                   # Logica algoritmica disaccoppiata (Open-Meteo, calcolo DD)
│   ├── README.md                        # Documentazione approfondita e scelte UI/UX del frontend
│   └── package.json                     # Dipendenze Node.js
│
└── README.md                            
```

## PARTE 1: BACKEND

Il backend è interamente containerizzato. L'unica dipendenza richiesta sul proprio PC è l'installazione di **Docker** e **Docker Compose**.

### 1. Avvio dell'ambiente

Posizionarsi all'interno della directory `backend/`, eseguendo:

```bash
cd backend
docker-compose up --build
```

Il sistema scaricherà l'immagine ufficiale di PostgreSQL 17, costruirà l'immagine Python/Django, applicherà in automatico le migrazioni del database e avvierà il server web sulla porta **8000**.

### 2. Esecuzione dei Test Automatici

In un terminale separato, è possibile lanciare i test unitari eseguendo il seguente comando sempre all'interno della directory `backend/`.

```bash
docker-compose exec web python manage.py test vineyard_model
```

### 3. Verifica Database

I dati salvati nel Problema 2 sono archiviati nel container db. È possibile verificarli eseguendo:

```bash
docker-compose exec db psql -U user -d vineyard_db -c "SELECT * FROM vineyard_model_eventhistory;"
```

Per maggiori dettagli ed esempi su chiamate API e ricostruzione temporale degli eventi, consultare il `README.md` all'interno della cartella `/backend`.
La spiegazione teorica per l'acquisizione, la ricostruzione tramite query SQL e l'analisi algoritmica è consultabile nel file `backend/THEORY_PROBLEM_2.txt`.


## PARTE 2: FRONTEND

La parte di frontend consiste in un'applicazione web realizzata in **Next.js**. Richiede l'installazione di **Node.js** (v18+). Per i dettagli estesi sulle scelte di UI/UX e librerie, consultare il `README.md` all'interno della cartella `/frontend`.

### 1. Installazione e Configurazione

Posizionarsi all'interno della directory `frontend/`, installando le dipendenze:

```bash
cd frontend
npm install
```

È necessario configurare all'interno del file `.env.local` la chiave API di Google Maps (obbligatoria) e le credenziali SMTP (opzionali per l'invio reale delle e-mail di allerta):

```
# Sostituire con la propria API Key di Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=inserisci_qui_la_tua_api_key

# Credenziali (Opzionali) per il test di invio Email reale (SMTP Gmail)
EMAIL_USER=la_tua_email@gmail.com
EMAIL_PASS=password_per_le_app_di_google
```

### 2. Avvio del Server

```bash
npm run dev
```

La dashboard sarà accessibile all'indirizzo: **http://localhost:3000**