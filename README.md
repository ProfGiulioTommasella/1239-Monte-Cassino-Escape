# 1239: Montecassino Escape

Gioco di ripasso sul Canto Gregoriano per la seconda media, in stile arcade.

> 1239: i soldati di Federico II di Svevia devastano l'Abbazia di Montecassino.
> Aiutate l'Abate Stefano II a raggiungere una vicina abbazia per mettere in salvo
> i preziosi inni gregoriani, creati nel famoso scriptorium dell'Abbazia.

L'Abate fugge tirando un carretto pieno di libri, inseguito dai soldati di Federico II.
La corsa non si ferma mai, nemmeno mentre si risponde alle domande:

- **risposta giusta**: l'Abate scatta in avanti e i soldati restano indietro;
- **risposta sbagliata**: i soldati si avvicinano e un libro cade dal carretto.

Le 11 domande sono divise in tre tappe (bosco, palude, sentiero di pietra).
Alla fine ci sono tre finali, come nel progetto Scratch originale:
tutte giuste = **salvi**, da 5 a 10 giuste = **quasi salvi**, meno di 5 = **presi**.

## Come si gioca

Funziona su PC e tablet in orizzontale, con mouse, dito o tastiera
(A, B, C oppure 1, 2, 3 per rispondere; V/F per vero o falso; Invio per andare avanti).
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

## Struttura

```
index.html          pagina del gioco
css/stile.css       grafica dell'interfaccia
js/domande.js       contenuti (da modificare liberamente)
js/gioco.js         motore di gioco (scena, personaggi, inseguimento)
assets/img/         sfondi e ritratti dell'Abate dal progetto Scratch
assets/audio/       suoni dal progetto Scratch
```
