# Musiche di Montecassino Escape

Quattro brani originali, composti apposta per il gioco, uno per ciascun momento.
Sono in stile medievale e usano i modi ecclesiastici (gli stessi del canto gregoriano).
Ogni brano dura circa due minuti e ricomincia senza stacchi, quindi si può mettere in loop.

| File | Momento del gioco | Modo | Durata | Strumenti principali |
|---|---|---|---|---|
| `musica1-abbazia` | Introduzione / assedio dell'abbazia | dorico su Re | 2:11 | coro, organo, corno, timpani |
| `musica2-bosco` | Tappa 1, il bosco delle nebbie | dorico su Mi | 2:14 | violoncello, viola, flauto, coro, arpa, tamburo a cornice |
| `musica3-palude` | Tappa 2, la palude oscura | frigio su Mi | 2:00 | corno inglese, flauto di Pan, coro, archi pizzicati |
| `musica4-sentiero` | Tappa 3, il sentiero di pietra (finale) | dorico su La | 1:56 | viella, ciaramella, cornamusa, tamburi |

Ogni brano è sia in `.mp3` (funziona ovunque, iPad compreso) sia in `.ogg` (loop più pulito su Chrome e Firefox).

Il brano dell'abbazia cita l'inizio del **Dies irae**, sequenza gregoriana del XIII secolo (pubblico dominio):
un bel gancio per chiedere agli studenti se la riconoscono.

Nel gioco la musica va tenuta a volume molto basso (circa 0.2), sotto gli effetti sonori.

## Licenza

- Composizione e registrazione: create per questo progetto, liberamente utilizzabili nel gioco (pubblico dominio, CC0).
- Melodia del Dies irae: canto gregoriano medievale, pubblico dominio.
- Suoni degli strumenti: soundfont *Fluid R3 GM* di Frank Wen, licenza MIT (https://github.com/FluidSynth/fluidsynth/wiki/SoundFont).
  La licenza MIT riguarda il soundfont, non la musica prodotta con esso: non serve alcuna attribuzione nel gioco.

## Come rigenerarli

La cartella `sorgenti/` contiene i file MIDI e gli script Python (`brani.py` descrive le melodie nota per nota).
Servono `fluidsynth`, il soundfont `FluidR3_GM.sf2`, `ffmpeg` e il pacchetto Python `mido`; poi `python3 rendi.py <cartella-di-uscita>`.
