# Vineyard Backend

La directory `backend/` contiene la soluzione backend per la simulazione del modello agrometeorologico (Problema 1 e Problema 2), sviluppata con Django e Django REST Framework.

## 1. Struttura del Progetto
L'architettura del progetto è suddivisa come segue:
- `config/`: Cartella principale di configurazione di Django (settings, urls).
- `vineyard_model/`: L'applicazione core contenente la logica di business.
  - `views.py`: Contiene l'endpoint API e l'algoritmo di evoluzione stateless.
  - `serializers.py`: Gestisce la validazione dei JSON in ingresso.
  - `models.py`: Definisce la tabella `EventHistory` per il salvataggio con PostgreSQL.
  - `tests.py`: Contiene i test automatici per la verifica dei requisiti.
- `docker-compose.yml` & `Dockerfile`: File per la containerizzazione e l'orchestrazione del backend e del database.
- `THEORY_PROBLEM_2.txt`: File testuale contenente la spiegazione teorica rigorosa per l'acquisizione e la ricostruzione delle serie temporali.

## 2. Requisiti e Installazione
Il progetto è interamente containerizzato per garantire la riproducibilità. L'unico requisito necessario sul computer host è l'installazione di **Docker** e **Docker Compose**.

Tutte le dipendenze Python (Django, DRF, psycopg2) sono dichiarate nel file `requirements.txt` e vengono installate automaticamente in fase di build dell'immagine Docker.

## 3. Istruzioni per l'Esecuzione

### Avvio dell'Ambiente (Orchestrazione)
Per costruire l'immagine del backend e avviare i container (API + PostgreSQL), eseguire il comando nella cartella `backend/` del progetto:

```bash
docker-compose up --build
```

Nota: Al primo avvio, il container backend eseguirà automaticamente i comandi `makemigrations` e `migrate` per predisporre lo schema sul database, per poi esporsi sulla porta **8000**.

### Esecuzione dei Test Automatici

Per lanciare la suite di test, eseguire in un terminale separato:

```bash
docker-compose exec web python manage.py test vineyard_model
```

## 4. Esempi di Input / Output e Chiamate API

L'endpoint universale per simulare il modello è:  
`POST` http://localhost:8000/api/v1/simulate/

### Problema 1: Simulazione Singolo Giorno

L'API riceve i dati meteo giornalieri e valuta la generazione o l'evoluzione degli eventi, rispondendo in modalità puramente stateless.

```bash
curl -X POST http://localhost:8000/api/v1/simulate/ \
-H "Content-Type: application/json" \
-d '{
    "doy": 126,
    "temperature": 15.94,
    "bagnatura": 1,
    "humidity": 97.25,
    "rain": 0.0
}'
```

A partire dalla seconda chiamata, viene simulata una macchina a stati: l’output dell’ultima chiamata
contiene lo stato attuale necessario per poter calcolare correttamente lo stato successivo.

```bash
curl -X POST http://localhost:8000/api/v1/simulate/ \
-H "Content-Type: application/json" \
-d '{
   "doy":127,
   "temperature":17.15,
   "bagnatura":1,
   "humidity":42.35,
   "rain":0.0,
   "events":[
      {
         "index":0,
         "X":0.0
      }
   ]
}'
```

### Problema 2: Simulazione Multi-Giorno

Il sistema processa in sequenza l'array, trasportando lo stato generato da un DOY al successivo, per poi salvare il tutto in un'unica transazione bulk su PostgreSQL.

> **Nota Architetturale:** Per evitare l'overwrite delle chiavi, l'API è stata progettata per accettare in ingresso un **Array di oggetti JSON**.  

Esempio di chiamata con 1 giorno storico e 3 di previsione:

```bash
curl -X POST http://localhost:8000/api/v1/simulate/ \
-H "Content-Type: application/json" \
-d '[
   {
      "doy": 275,
      "temperature": 30.00,
      "bagnatura": 0,
      "humidity": 32.00,
      "rain": 0.00,
      "events": [
         { "index": 0, "X": 0.7 },
         { "index": 1, "X": 0.0 }
      ]
   },
   {
      "doy": 276,
      "temperature": 28.00,
      "bagnatura": 0,
      "humidity": 30.00,
      "rain": 0.00
   },
   {
      "doy": 277,
      "temperature": 27.00,
      "bagnatura": 0,
      "humidity": 29.00,
      "rain": 0.00
   },
   {
      "doy": 278,
      "temperature": 27.00,
      "bagnatura": 1,
      "humidity": 59.00,
      "rain": 22.00
   }
]'
```

### Verifica della Ricostruzione Temporale

Per verificare l'effettiva memorizzazione e poter interrogare i dati al fine di estrarre la curva temporale calcolata per il Problema 2, è possibile connettersi al container PostgreSQL (esposto sulla porta **5432**):

-   **Host:**  `localhost`
    
-   **Porta:**  `5432`
    
-   **DB Name:**  `vineyard_db`
    
-   **User:**  `user`
    
-   **Password:**  `password`
    

Oppure tramite CLI Docker:

```bash
docker-compose exec db psql -U user -d vineyard_db
```

