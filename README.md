# 1239: Montecassino Escape

Gioco di ripasso sul Canto Gregoriano per la seconda media, in stile arcade.

> 1239: i soldati di Federico II di Svevia devastano l'Abbazia di Montecassino.
> L'Abbazia era uno dei più importanti centri di produzione di manoscritti:
> aiutate l'Abate Stefano II a raggiungere una vicina abbazia per mettere in salvo
> i preziosi codici di canto gregoriano.

Si comincia con una breve scena in spaccato dell'Abbazia: fuori, a sinistra, i soldati prendono a colpi
d'ariete il portone, mentre nel cortile l'Abate fa la spola dallo scriptorium per caricare i codici sul carretto (si può saltare con **SALTA**).
Poi l'Abate fugge tirando il carretto pieno di libri, inseguito dai soldati di Federico II.
La corsa non si ferma mai, nemmeno mentre si risponde alle domande:

- **risposta giusta**: l'Abate scatta in avanti e i soldati restano indietro;
- **risposta sbagliata**: i soldati si avvicinano e un libro cade dal carretto.

Ogni partita pesca 11 domande da una banca di 27 (ricavate anche dalla verifica sul Canto gregoriano), divise in tre tappe (bosco, palude, sentiero di pietra): 5 nella prima, 4 nella seconda, 2 nella terza, preferendo quelle non uscite nella partita precedente.
A ogni partita le risposte cambiano posto (Vero/Falso resta in quest'ordine).
Alla fine delle prime due tappe c'è un breve minigioco d'azione: prima bisogna **saltare**
sassi e tronchi con il carretto, poi **abbassarsi** per schivare le lance dei soldati.
Ogni ostacolo evitato fa guadagnare un po' di terreno, ogni colpo preso lo fa perdere.
Alla fine ci sono tre finali, come nel progetto Scratch originale:
tutte giuste = **salvi**, da 5 a 10 giuste = **quasi salvi**, meno di 5 = **presi**.

## Come si gioca

Funziona su PC e tablet in orizzontale, con mouse, dito o tastiera
(A, B, C oppure 1, 2, 3 per rispondere; V/F per vero o falso; Invio per andare avanti).
Nei minigiochi si usa la barra spaziatrice (o le frecce su e giù); sul tablet basta toccare lo schermo.
In alto a destra 🎵 spegne la musica, 🔊 spegne gli effetti sonori e ⛶ mette il gioco a schermo intero.

## Pubblicarlo con GitHub Pages

1. Nel repository apri **Settings → Pages**.
2. In *Build and deployment* scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Dopo un minuto il gioco è online all'indirizzo
   `https://profgiuliotommasella.github.io/1239-Monte-Cassino-Escape/`.

Si può anche giocare offline aprendo `index.html` nel browser.

Dopo una modifica ai file in `js/` o `css/`, aumenta di uno il numero `?v=` nelle righe
di `index.html` che li caricano: così i browser scaricano subito la versione nuova
invece di usare quella vecchia in memoria.

## Modificare domande e testi

Tutti i contenuti stanno in [`js/domande.js`](js/domande.js): domande, opzioni,
risposta corretta, commenti dell'Abate, nomi delle tappe e testi dei finali.
Non serve toccare altri file.

## Musiche

Le quattro musiche di sottofondo (introduzione e una per ogni tappa) sono brani originali
in stile medievale, composti apposta per questo gioco nei modi ecclesiastici e suonati con il
soundfont *Fluid R3 GM* di Frank Wen (licenza MIT). Sono libere da diritti e rilasciate in
pubblico dominio (CC0). Nel gioco suonano a volume molto basso, sotto gli effetti sonori.

- **Introduzione, l'assedio**: dorico su Re, coro, organo, corno e timpani. Cita l'inizio del *Dies irae*, sequenza gregoriana del XIII secolo (pubblico dominio).
- **Tappa 1, il bosco**: dorico su Mi, archi, flauto, coro, arpa e tamburo a cornice.
- **Tappa 2, la palude**: frigio su Mi, corno inglese, flauto di Pan, coro e archi pizzicati.
- **Tappa 3, il sentiero di pietra**: dorico su La, viella, ciaramella, cornamusa e tamburi.

Crediti completi, file MIDI e script per rigenerarle sono in [`strumenti/musica/`](strumenti/musica/CREDITI.md).

Per sostituirle basta mettere altri file mp3 in `assets/audio/` e cambiare i percorsi
in `js/domande.js`.

## Struttura

```
index.html          pagina del gioco
css/stile.css       grafica dell'interfaccia
js/domande.js       contenuti (da modificare liberamente)
js/gioco.js         motore di gioco (scena, personaggi, inseguimento, minigiochi)
js/sfondi.js        sfondi disegnati (tappe, scena iniziale, finali)
assets/img/         libro dal progetto Scratch
assets/audio/       effetti sonori dal progetto Scratch e musiche originali
strumenti/musica/   crediti, sorgenti MIDI e script delle musiche (fluidsynth, mido, ffmpeg)
strumenti/effetti.py generatore dei suoni della scena iniziale (ariete, portone che crolla)
```
