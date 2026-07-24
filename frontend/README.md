# Vineyard WebApp Frontend

La directory `frontend/` contiene l'implementazione Frontend di una dashboard interattiva per il monitoraggio della patologia *Sordidus* (Modello Gradi-Giorno).

## 1. Librerie Utilizzate

Per la realizzazione della web-app si è optato per **Next.js (React)** con l'App Router. Questa scelta garantisce una gestione ottimale degli stati complessi mantenendo il codice pulito e modulare, oltre a fornire la possibilità di implementare API Server-Side interne.

Le librerie principali utilizzate sono:
*   **[Next.js (React)](https://nextjs.org/)**: Framework core per il routing, lo State Management e il Server-Side Rendering.
*   **[Bootstrap 5](https://getbootstrap.com/)**: Utilizzato via CDN per il sistema a griglia, la stilizzazione dei form, i tabs e i pulsanti, garantendo la totale responsività.
*   **[Bootstrap Icons](https://icons.getbootstrap.com/)**: Per la riproduzione fedele della UI grafica (icone calendario, grafici, campanella, cestino).
*   **[@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)**: Wrapper ufficiale e standard industriale per integrare Google Maps in React in modo sicuro e asincrono.
*   **[Highcharts & Highcharts React](https://www.highcharts.com/)**: Utilizzata per il rendering della *Line Chart* dei Gradi-Giorno, con customizzazione avanzata di `PlotLines` e `DataLabels`.
*   **[Nodemailer](https://nodemailer.com/)**: Libreria lato server utilizzata all'interno delle API Route di `Next.js` per gestire l'invio reale delle email di allerta (SMTP).

## 2. Struttura del Progetto

L'intera interfaccia utente è stata costruita da zero assemblando le classi native di Bootstrap 5. Questo ha permesso di avere il pieno controllo del DOM e replicare in modo fedele i mockup forniti dalle specifiche.

**Separazione del Codice:**
Il codice di rendering grafico è stato tenuto separato dalla logica algoritmica, strutturando il progetto come segue:
*   `lib/weather.ts`: Contiene esclusivamente la logica di business. Si occupa del fetch parallelo da Open-Meteo (Archive API + Forecast API), unisce i dati storici e previsionali, e contiene l'algoritmo che calcola la sommatoria dei Gradi-Giorno e stabilisce il colore dinamico della mappa.
*   `app/page.tsx`: Gestisce esclusivamente l'inizializzazione e il rendering di **Google Maps**, del Marker dinamico e della Legenda.
*   `app/modello/page.tsx`: Gestisce l'interfaccia a Tabs, l'inizializzazione del grafico **Highcharts** e il salvataggio/gestione degli allarmi via LocalStorage.
*   `app/api/send-email/route.ts`: API Route protetta che isola le credenziali SMTP e gestisce la spedizione fisica delle email.

## 3. Istruzioni per l'Esecuzione

### Prerequisiti
*   **Node.js** (versione 18 o superiore)
*   **Chiave API di Google Maps**

### Step 1: Installazione delle Dipendenze
Aprire il terminale, posizionarsi all'interno della directory `frontend/` e lanciare:
```bash
npm install
```

### Step 2: Configurazione Variabili d'Ambiente (.env.local)

Inserire le seguenti chiavi all'interno del file `.env.local` nella directory `frontend/`:

```
# Sostituire con la propria API Key di Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=inserisci_qui_la_tua_api_key

# Credenziali (Opzionali) per il test di invio Email reale (SMTP Gmail)
EMAIL_USER=la_tua_email@gmail.com
EMAIL_PASS=password_per_le_app_di_google
```

### Step 3: Avvio del Server di Sviluppo

Sempre dalla directory `frontend/`, lanciare il comando per avviare `Next.js`:

```
npm run dev
```

Aprire il browser e navigare all'indirizzo: **http://localhost:3000**

### Step 4: Come visualizzare e testare le funzionalità

1.  **Test Pagina Mappa (/)**:
    
    -   La mappa si caricherà centrata sulle coordinate fornite, bloccata in vista Satellite.
        
    -   Passando il mouse sul Pin comparirà l'etichetta dinamica ("Assente", "Medio" o "Alto") basata sul calcolo reale dei dati di Open-Meteo.

    -   In caso di etichetta con rischio Alto, ciccando su "Agisci", si viene reindirizzati alla seguente pagina: https://wiki.wiforagri.com/wiki/assistenza
        
    -   Cliccando sul Pin, si verrà reindirizzati alla pagina Modello. 
        
2.  **Test Grafico Highcharts (/modello)**:
    
    -   Modificando l'anno nell'apposito campo, il grafico effettuerà una nuova chiamata ad Open-Meteo caricando l'archivio storico dell'anno richiesto.
        > Limite minimo imposto per l'API globale: 1940. Limite massimo: anno corrente. 
    -   Nel grafico verrà sempre visualizzata la soglia di default (`30% - 106.8 DD`).
        
3.  **Test Gestione Allarmi e Invio Email**:
    
    -   Passare al Tab "Allarmi" e cliccare sul tasto blu "+".
        
    -   Inserire una soglia numerica (es. `150`) e un'email valida.
        
    -   Una volta salvato, l'allarme comparirà istantaneamente sul grafico Highcharts come retta orizzontale tratteggiata (colorata dinamicamente e con la percentuale calcolata rispetto al limite).
        
    -   Tutte le azioni (Creazione, Attivazione, Disattivazione, Eliminazione) vengono salvate in un log consultabile nel sub-tab "Registro allarmi".
        

> **Simulazione Invio E-mail**: Se l'anno in visualizzazione ha già superato la soglia appena creata e le variabili d'ambiente e-mail sono configurate nel file `.env.local`, il sistema **invierà realmente un'email** all'indirizzo inserito. Per evitare spam, il sistema salva la data dell'ultimo invio, garantendo al massimo 1 e-mail al giorno per allarme.
