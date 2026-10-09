# 1239: Montecassino Escape

Gioco di ripasso sul Canto Gregoriano per la seconda media, in stile arcade.

> 1239: i soldati di Federico II di Svevia devastano l'Abbazia di Montecassino.
> Aiutate l'Abate Stefano II a raggiungere una vicina abbazia per mettere in salvo
> i preziosi inni gregoriani, creati nel famoso scriptorium dell'Abbazia.

Si comincia con una breve scena: i soldati prendono a colpi d'ariete il portone dell'Abbazia
mentre l'Abate carica in fretta gli ultimi libri sul carretto (si può saltare con **SALTA**).
Poi l'Abate fugge tirando il carretto pieno di libri, inseguito dai soldati di Federico II.
La corsa non si ferma mai, nemmeno mentre si risponde alle domande:

- **risposta giusta**: l'Abate scatta in avanti e i soldati restano indietro;
- **risposta sbagliata**: i soldati si avvicinano e un libro cade dal carretto.

Le 11 domande sono divise in tre tappe (bosco, palude, sentiero di pietra).
Alla fine delle prime due tappe c'è un breve minigioco d'azione: prima bisogna **saltare**
sassi e tronchi con il carretto, poi **abbassarsi** per schivare le lance dei soldati.
Ogni ostacolo evitato fa guadagnare un po' di terreno, ogni colpo preso lo fa perdere.
Alla fine ci sono tre finali, come nel progetto Scratch originale:
tutte giuste = **salvi**, da 5 a 10 giuste = **quasi salvi**, meno di 5 = **presi**.

## Come si gioca

Funziona su PC e tablet in orizzontale, con mouse, dito o tastiera
(A, B, C oppure 1, 2, 3 per rispondere; V/F per vero o falso; Invio per andare avanti).
Nei minigiochi si usa la barra spaziatrice (o le frecce su e giù); sul tablet basta toccare lo schermo.
Il pulsante ⛶ mette il gioco a schermo intero.

## Pubblicarlo con GitHub Pages

1. Nel repository apri **Settings → Pages**.
2. In *Build and deployment* scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Dopo un minuto il gioco è online all'indirizzo
   `https://profgiuliotommasella.github.io/1239-monte-cassino-escape/`.

Si può anche giocare offline aprendo `index.html` nel browser.

## Modificare domande e testi

Tutti i contenuti stanno in [`js/domande.js`](js/domande.js): domande, opzioni,
risposta corretta, commenti dell'Abate, nomi delle tappe e testi dei finali.
Non serve toccare altri file.

## Musiche

Le quattro musiche di sottofondo (introduzione e una per ogni tappa) sono brani originali
in stile medievale, composti e sintetizzati apposta per questo gioco con lo script
[`strumenti/musica.py`](strumenti/musica.py), senza campioni esterni. Sono libere da diritti
e rilasciate in pubblico dominio (CC0).

- **Introduzione**: canto monodico in modo dorico, organo e campane (66 bpm, circa 2 minuti).
- **Tappa 1, il bosco**: danza vivace in Re dorico, flauto, liuto e tamburello (132 bpm).
- **Tappa 2, la palude**: brano cupo in modo frigio, bordone di ghironda (108 bpm).
- **Tappa 3, il sentiero di pietra**: corsa finale in Sol misolidio (150 bpm).

Per sostituirle basta mettere altri file mp3 in `assets/audio/` e cambiare i percorsi
in `js/domande.js`.

## Struttura

```
index.html          pagina del gioco
css/stile.css       grafica dell'interfaccia
js/domande.js       contenuti (da modificare liberamente)
js/gioco.js         motore di gioco (scena, personaggi, inseguimento)
assets/img/         sfondi e libro dal progetto Scratch
assets/audio/       effetti sonori dal progetto Scratch e musiche originali
strumenti/musica.py generatore delle musiche (Python, numpy, scipy, ffmpeg)
strumenti/effetti.py generatore dei suoni della scena iniziale (ariete, portone che crolla)
```
