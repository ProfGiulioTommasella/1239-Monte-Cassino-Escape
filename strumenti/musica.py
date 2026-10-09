"""
Genera le musiche di sottofondo di Montecassino Escape.

Brani originali in stile medievale, composti e sintetizzati per questo gioco:
nessun campione esterno, nessun diritto di terzi. Rilasciati in pubblico dominio (CC0).

Uso:  python3 strumenti/musica.py   (richiede numpy, scipy e ffmpeg)
Crea: assets/audio/musica-intro.mp3, musica-tappa1.mp3, musica-tappa2.mp3, musica-tappa3.mp3
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import fftconvolve, lfilter

SR = 44100
RNG = np.random.default_rng(1239)
CARTELLA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "audio")


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def inviluppo(n, attacco, rilascio):
    e = np.ones(n)
    a = min(n, int(attacco * SR))
    r = min(n - a, int(rilascio * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[n - r:] = np.linspace(1, 0, r) ** 1.5
    return e


# ------------------------------------------------------------------ strumenti
def liuto(f, dur, brillante=0.5):
    """Corda pizzicata (Karplus-Strong)."""
    n = int((dur + 1.2) * SR)
    p = max(2, int(SR / f))
    buf = RNG.uniform(-1, 1, p)
    for _ in range(int(5 - 3 * brillante)):  # eccitazione più morbida = suono più caldo
        buf = 0.5 * (buf + np.roll(buf, 1))
    buf -= buf.mean()
    buf /= np.max(np.abs(buf)) + 1e-9
    out = np.zeros(n)
    blocco = buf.copy()
    pos = 0
    smorz = 0.996
    while pos < n:
        k = min(p, n - pos)
        out[pos:pos + k] = blocco[:k]
        nuovo = smorz * 0.5 * (blocco + np.roll(blocco, 1))
        blocco = nuovo
        pos += p
    out = lfilter([0.45], [1, -0.55], out)  # passa-basso dolce
    out *= inviluppo(n, 0.002, 0.08)
    return out * 0.9


def flauto(f, dur, vibrato=0.004):
    """Flauto dolce: poche armoniche, vibrato leggero, soffio."""
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    vib = 1 + vibrato * np.sin(2 * np.pi * 5.2 * t) * np.clip(t * 3, 0, 1)
    fase = 2 * np.pi * f * np.cumsum(vib) / SR
    s = np.sin(fase) + 0.22 * np.sin(2 * fase) + 0.08 * np.sin(3 * fase) + 0.03 * np.sin(4 * fase)
    soffio = lfilter([0.05], [1, -0.95], RNG.normal(0, 1, n)) * 0.05
    return (s + soffio) * inviluppo(n, 0.035, 0.07) * 0.35


def organo(f, dur):
    """Organo portativo: canne con attacco morbido."""
    n = int((dur + 0.15) * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in [(1, 1), (2, 0.5), (3, 0.18), (4, 0.12), (6, 0.05)])
    s += 0.4 * np.sin(2 * np.pi * f * 1.003 * t)
    return s * inviluppo(n, 0.12, 0.15) * 0.18


def bordone(f, dur, ronzio=0.0, bpm=120):
    """Bordone tipo ghironda: dente di sega addolcito, con eventuale ronzio ritmico."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * m * t + m) / m ** 1.4 for m in range(1, 12))
    s += 0.5 * sum(np.sin(2 * np.pi * f * 1.5 * m * t) / m ** 1.6 for m in range(1, 8))
    s *= 1 + 0.05 * np.sin(2 * np.pi * 0.3 * t)
    if ronzio:
        battito = (t * bpm / 60 * 2) % 1
        s *= 1 + ronzio * np.exp(-battito * 9)
    return s * 0.06


def tamburo(forza=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 75 + 70 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    s += lfilter([0.3], [1, -0.7], RNG.normal(0, 1, n)) * np.exp(-t * 60) * 0.5
    return s * 0.55 * forza


def sonagli(forza=1.0):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    rumore = RNG.normal(0, 1, n)
    acuto = rumore - np.roll(rumore, 1)
    metallo = sum(np.sin(2 * np.pi * fr * t) for fr in (5200, 6900, 8300)) * 0.2
    return (acuto * 0.3 + metallo) * np.exp(-t * 28) * 0.22 * forza


def campana(f, dur=5.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)
            for r, a, d in [(0.5, 0.6, 0.6), (1, 1, 0.8), (1.19, 0.5, 1.2), (1.5, 0.35, 1.4), (2, 0.4, 1.8), (2.74, 0.2, 2.5), (3.76, 0.12, 3)])
    return s * 0.18 * inviluppo(n, 0.003, 0.5)


# ------------------------------------------------------------------ mixer
class Brano:
    def __init__(self, battute, bpm, tempi=4):
        self.bpm = bpm
        self.beat = 60 / bpm
        self.n = int(battute * tempi * self.beat * SR)
        self.L = np.zeros(self.n + SR * 3)
        self.R = np.zeros(self.n + SR * 3)

    def metti(self, suono, beat, vol=1.0, pan=0.0):
        i = int(beat * self.beat * SR)
        if i >= self.n:
            return
        k = min(len(suono), len(self.L) - i)
        self.L[i:i + k] += suono[:k] * vol * (1 - pan) ** 0.5
        self.R[i:i + k] += suono[:k] * vol * (1 + pan) ** 0.5

    def melodia(self, note, inizio, strumento, vol=1.0, pan=0.0, trasponi=0, legato=0.95):
        b = inizio
        for nota, d in note:
            if nota is not None:
                self.metti(strumento(hz(nota + trasponi), d * self.beat * legato), b, vol, pan)
            b += d
        return b

    def finisci(self, nome, riverbero=1.6, umido=0.22):
        # coda ripiegata all'inizio: il brano si ripete senza stacchi
        L, R = self.L, self.R
        for ch in (L, R):
            ch[: len(ch) - self.n] += ch[self.n:]
        L, R = L[: self.n], R[: self.n]
        n_ir = int(riverbero * SR)
        t = np.arange(n_ir) / SR
        ir_l = RNG.normal(0, 1, n_ir) * np.exp(-t * 6.9 / riverbero)
        ir_r = RNG.normal(0, 1, n_ir) * np.exp(-t * 6.9 / riverbero)
        ir_l /= np.sqrt(np.sum(ir_l ** 2))
        ir_r /= np.sqrt(np.sum(ir_r ** 2))
        uscite = []
        for ch, ir in ((L, ir_l), (R, ir_r)):
            doppio = np.concatenate([ch, ch])
            wet = fftconvolve(doppio, ir)[self.n: 2 * self.n]
            uscite.append(ch * (1 - umido) + wet * umido)
        st = np.stack(uscite, axis=1)
        st /= np.max(np.abs(st)) / 0.89
        pcm = (st * 32767).astype(np.int16)
        with tempfile.TemporaryDirectory() as d:
            w = os.path.join(d, "x.wav")
            with wave.open(w, "wb") as f:
                f.setnchannels(2)
                f.setsampwidth(2)
                f.setframerate(SR)
                f.writeframes(pcm.tobytes())
            dest = os.path.join(CARTELLA, nome)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w, "-codec:a", "libmp3lame", "-b:a", "112k", dest], check=True)
        print(nome, round(self.n / SR, 1), "s")


def P(testo):
    """'A4:.5 D5:1 R:2' -> lista di (midi, battiti)."""
    nomi = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    note = []
    for tok in testo.split():
        n, d = tok.split(":")
        if n == "R":
            note.append((None, float(d)))
            continue
        alt = 0
        if "b" in n[1:]:
            alt = -1
        if "#" in n:
            alt = 1
        note.append((12 * (int(n[-1]) + 1) + nomi[n[0]] + alt, float(d)))
    return note


def accompagna(b, radici, inizio, schema, vol=0.55, pan=-0.35, ottava=48):
    """Liuto: per ogni mezza battuta una radice (0 = Do) con quinta e ottava."""
    beat = inizio
    for r in radici:
        if r is None:
            beat += 2
            continue
        base = ottava + r
        for passo, (intervallo, durata) in enumerate(schema):
            b.metti(liuto(hz(base + intervallo), durata * b.beat, 0.4), beat, vol * (1.0 if passo == 0 else 0.7), pan)
            beat += durata


def ritmo(b, battute, inizio, schema, vol=1.0):
    for k in range(battute):
        for pos, tipo, forza in schema:
            s = tamburo(forza) if tipo == "T" else sonagli(forza)
            b.metti(s, inizio + k * 4 + pos, vol, 0.15 if tipo == "T" else 0.3)


D, E, F, G, A, B_, C = 2, 4, 5, 7, 9, 11, 0
Bb, Eb = 10, 3


# ------------------------------------------------------------------ intro: canto monodico
def intro():
    b = Brano(32, 66)
    canto = P(
        "D4:2 F4:1 G4:1 A4:3 A4:1 G4:1 A4:1 C5:1 A4:1 G4:2 F4:2 "
        "G4:1 F4:1 E4:1 D4:1 F4:2 G4:2 A4:4 R:4 "
        "A4:1 C5:1 D5:2 C5:1 A4:1 G4:2 A4:1 G4:1 F4:1 E4:1 D4:4 "
        "F4:1 G4:1 A4:2 G4:1 F4:1 E4:2 D4:6 R:2"
    )
    # prima strofa: organo grave; seconda: flauto e organo all'unisono
    b.melodia(canto, 0, organo, 1.0, 0, trasponi=-12, legato=1.0)
    fine = b.melodia(canto, 64, organo, 0.8, 0, trasponi=-12, legato=1.0)
    b.melodia(canto, 64, flauto, 0.8, 0.2, legato=0.98)
    assert fine <= 128
    b.metti(bordone(hz(38), 128 * b.beat), 0, 0.8)
    for k in range(0, 128, 8):
        b.metti(campana(hz(62), 6), k, 0.9 if k % 16 == 0 else 0.5, -0.4)
    b.finisci("musica-intro.mp3", riverbero=3.2, umido=0.42)


# ------------------------------------------------------------------ tappa 1: bosco (Re dorico, vivace)
def tappa1():
    A1 = P("A4:.5 D5:.5 D5:.5 E5:.5 F5:1 E5:.5 D5:.5 C5:.5 D5:.5 E5:.5 C5:.5 A4:1 G4:.5 A4:.5 "
           "F4:.5 G4:.5 A4:.5 C5:.5 D5:.5 C5:.5 A4:.5 G4:.5 A4:1 F4:.5 E4:.5 D4:2")
    A2 = P("A4:.5 D5:.5 D5:.5 E5:.5 F5:1 G5:.5 F5:.5 E5:.5 F5:.5 E5:.5 D5:.5 C5:1 D5:.5 E5:.5 "
           "F5:.5 E5:.5 D5:.5 C5:.5 D5:.5 C5:.5 A4:.5 C5:.5 D5:1 A4:1 D5:2")
    B1 = P("F5:1 F5:.5 G5:.5 A5:1 G5:.5 F5:.5 E5:.5 F5:.5 G5:.5 E5:.5 C5:2 "
           "D5:.5 E5:.5 F5:.5 D5:.5 E5:.5 F5:.5 G5:.5 E5:.5 F5:1 E5:.5 D5:.5 C5:2")
    B2 = P("F5:1 F5:.5 G5:.5 A5:1 C6:.5 A5:.5 G5:.5 A5:.5 G5:.5 F5:.5 E5:1 C5:1 "
           "D5:.5 C5:.5 A4:.5 C5:.5 D5:.5 E5:.5 F5:.5 E5:.5 D5:2 D5:2")
    rA = [D, D, C, C, F, C, D, D, D, D, C, C, F, C, D, D]
    rB = [F, F, C, C, D, C, F, C, F, F, C, C, D, C, D, D]
    arp = [(0, .5), (7, .5), (12, .5), (7, .5)]
    tamb = [(0, "T", 1), (1, "S", .8), (1.5, "T", .7), (2, "T", 1), (3, "S", .8), (3.5, "S", .5)]
    b = Brano(2 + 8 * 6, 132)
    ritmo(b, 2 + 8 * 6, 0, tamb, 0.9)
    b.metti(bordone(hz(38), b.n / SR / b.beat * b.beat, 0.25, 132), 0, 0.7)
    sezioni = [  # (melodia A o B, chi suona)
        ("A", "flauto"), ("A", "liuto"), ("B", "flauto"), ("B", "entrambi"), ("A", "entrambi"), ("B", "liuto"),
    ]
    pos = 8
    for sez, chi in sezioni:
        m1, m2, radici = (A1, A2, rA) if sez == "A" else (B1, B2, rB)
        if chi in ("flauto", "entrambi"):
            b.melodia(m1 + m2, pos, flauto, 1.0, 0.25)
        if chi in ("liuto", "entrambi"):
            b.melodia(m1 + m2, pos, lambda f, d: liuto(f, d, 0.7), 0.9 if chi == "liuto" else 0.6, -0.1,
                      trasponi=-12 if chi == "entrambi" else 0)
        accompagna(b, radici, pos, arp, 0.45)
        pos += 32
    b.finisci("musica-tappa1.mp3")


# ------------------------------------------------------------------ tappa 2: palude (Re frigio, cupo)
def tappa2():
    A = P("D5:1.5 Eb5:.5 D5:.5 C5:.5 Bb4:1 A4:.5 Bb4:.5 A4:.5 G4:.5 A4:2 "
          "D5:1.5 Eb5:.5 F5:.5 Eb5:.5 D5:1 C5:.5 D5:.5 Bb4:.5 C5:.5 A4:2 "
          "G4:.5 A4:.5 Bb4:.5 C5:.5 D5:1 A4:1 Bb4:.5 A4:.5 G4:.5 F4:.5 G4:2 "
          "A4:.5 Bb4:.5 A4:.5 G4:.5 F4:.5 G4:.5 Eb4:.5 F4:.5 D4:4")
    Bm = P("A4:1 D5:1 F5:1.5 Eb5:.5 D5:.5 Eb5:.5 D5:.5 C5:.5 D5:2 "
           "G5:1 F5:.5 Eb5:.5 D5:1 C5:1 Bb4:.5 C5:.5 D5:.5 Bb4:.5 A4:2 "
           "A4:1 D5:1 F5:1.5 G5:.5 F5:.5 Eb5:.5 D5:.5 Eb5:.5 F5:2 "
           "Eb5:.5 D5:.5 C5:.5 Bb4:.5 A4:.5 Bb4:.5 G4:.5 A4:.5 D4:2 D4:2")
    ostinato = [(0, .5), (7, .5), (12, .5), (13, .5)]
    radici = [D, D, D, D, D, D, C, C, Bb, Bb, C, C, D, D, D, D]
    tamb = [(0, "T", 1.2), (1.5, "T", .8), (2, "S", .6), (3, "T", 1), (3.5, "S", .4)]
    b = Brano(2 + 8 * 6, 108)
    ritmo(b, 2 + 8 * 6, 0, tamb, 0.95)
    b.metti(bordone(hz(38), b.n / SR, 0.4, 108), 0, 0.9)
    b.metti(bordone(hz(45), b.n / SR), 0, 0.35)
    sezioni = [("A", "liuto"), ("A", "flauto"), ("B", "flauto"), ("B", "entrambi"), ("A", "entrambi"), ("B", "liuto")]
    pos = 8
    for sez, chi in sezioni:
        m = A if sez == "A" else Bm
        if chi in ("flauto", "entrambi"):
            b.melodia(m, pos, lambda f, d: flauto(f, d, 0.007), 0.95, 0.25, trasponi=-12 if sez == "A" and chi == "flauto" else 0)
        if chi in ("liuto", "entrambi"):
            b.melodia(m, pos, lambda f, d: liuto(f, d, 0.5), 0.85, -0.15, trasponi=-12 if chi == "entrambi" else 0)
        accompagna(b, radici, pos, ostinato, 0.4, ottava=36)
        pos += 32
    b.finisci("musica-tappa2.mp3", riverbero=2.2, umido=0.3)


# ------------------------------------------------------------------ tappa 3: sentiero di pietra (Sol misolidio, incalzante)
def tappa3():
    A = P("G4:.5 B4:.5 D5:.5 B4:.5 D5:1 G5:1 F5:.5 E5:.5 D5:.5 C5:.5 D5:2 "
          "E5:.5 F5:.5 G5:.5 E5:.5 D5:.5 C5:.5 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:2 "
          "G4:.5 B4:.5 D5:.5 B4:.5 D5:1 G5:1 A5:.5 G5:.5 F5:.5 E5:.5 F5:1 D5:1 "
          "E5:.5 D5:.5 C5:.5 B4:.5 C5:.5 B4:.5 A4:.5 B4:.5 G4:2 G4:2")
    Bm = P("D5:.5 D5:.5 F5:.5 D5:.5 C5:1 F4:1 C5:.5 C5:.5 E5:.5 C5:.5 B4:1 G4:1 "
           "F5:.5 E5:.5 D5:.5 C5:.5 B4:.5 C5:.5 D5:.5 E5:.5 F5:1 E5:1 D5:2 "
           "D5:.5 D5:.5 F5:.5 D5:.5 C5:1 F4:1 C5:.5 C5:.5 E5:.5 C5:.5 B4:1 G4:1 "
           "A4:.5 B4:.5 C5:.5 D5:.5 E5:.5 F5:.5 E5:.5 D5:.5 G4:2 D5:1 G4:1")
    rA = [G, G, F, C, C, G, D, D, G, G, F, F, C, D, G, G]
    rB = [F, F, C, G, F, C, D, D, F, F, C, G, F, D, G, G]
    arp = [(0, .5), (7, .5), (12, .5), (7, .5)]
    tamb = [(0, "T", 1.1), (.5, "S", .5), (1, "T", .8), (1.5, "S", .6), (2, "T", 1), (2.5, "S", .5), (3, "T", .8), (3.25, "T", .5), (3.5, "S", .7)]
    b = Brano(2 + 8 * 6, 150)
    ritmo(b, 2 + 8 * 6, 0, tamb, 0.9)
    b.metti(bordone(hz(43), b.n / SR, 0.35, 150), 0, 0.75)
    sezioni = [("A", "flauto"), ("B", "flauto"), ("A", "liuto"), ("B", "entrambi"), ("A", "entrambi"), ("B", "entrambi")]
    pos = 8
    for sez, chi in sezioni:
        m, radici = (A, rA) if sez == "A" else (Bm, rB)
        if chi in ("flauto", "entrambi"):
            b.melodia(m, pos, flauto, 1.0, 0.25)
        if chi in ("liuto", "entrambi"):
            b.melodia(m, pos, lambda f, d: liuto(f, d, 0.7), 0.9 if chi == "liuto" else 0.55, -0.1,
                      trasponi=-12 if chi == "entrambi" else 0)
        accompagna(b, radici, pos, arp, 0.45, ottava=36 if sez == "B" else 48)
        pos += 32
    b.finisci("musica-tappa3.mp3")


if __name__ == "__main__":
    intro()
    tappa1()
    tappa2()
    tappa3()
