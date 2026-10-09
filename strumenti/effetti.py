"""
Genera gli effetti sonori della scena iniziale e dei minigiochi (pubblico dominio, CC0).

Uso:  python3 strumenti/effetti.py   (richiede numpy, scipy e ffmpeg)
Crea: assets/audio/colpo.mp3 (ariete contro il portone), hop.mp3 (salto del carretto),
atterraggio.mp3 (il carretto tocca terra), lancia.mp3 (lancia scagliata).
assets/audio/portone.mp3 (portone sfondato) è invece la registrazione "Colpo su legno-muro"
fornita dal prof. Tommasella, e questo script non la sovrascrive.
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy.signal import lfilter

SR = 44100
RNG = np.random.default_rng(1239)
CARTELLA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "audio")


def tonfo(durata=0.9, f0=58, forza=1.0):
    n = int(durata * SR)
    t = np.arange(n) / SR
    f = f0 + 90 * np.exp(-t * 25)
    corpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    legno = lfilter([0.25], [1, -0.82], RNG.normal(0, 1, n)) * np.exp(-t * 22)
    risonanza = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t * d) for fr, d in ((180, 14), (310, 18), (470, 25))) * 0.25
    return (corpo + legno * 0.8 + risonanza) * forza


def schianto():
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    s[: int(0.9 * SR)] += tonfo(0.9, 50, 1.3)
    rumore = RNG.normal(0, 1, n)
    s += lfilter([0.2], [1, -0.6], rumore) * np.exp(-t * 3.5) * 0.9
    # schegge e assi che cadono
    for k in range(9):
        i = int((0.15 + RNG.uniform(0, 1.6)) * SR)
        pezzo = tonfo(0.35, 120 + RNG.uniform(0, 160), 0.35 + RNG.uniform(0, 0.3))
        s[i: i + len(pezzo)] += pezzo[: n - i]
    return s


def hop():
    # "hop" da cartone animato: un breve glissando verso l'alto con un piccolo vibrato
    n = int(0.26 * SR)
    t = np.arange(n) / SR
    f = 260 + 700 * (t / t[-1]) ** 1.6 + 14 * np.sin(2 * np.pi * 28 * t)
    fase = 2 * np.pi * np.cumsum(f) / SR
    tono = np.sin(fase) + 0.35 * np.sin(2 * fase) + 0.12 * np.sin(3 * fase)
    inviluppo = np.minimum(1, t / 0.008) * np.exp(-t * 9)
    soffio = lfilter([0.3], [1, -0.4], RNG.normal(0, 1, n)) * np.exp(-t * 30) * 0.25
    return tono * inviluppo + soffio


def atterraggio():
    # tonfo leggero del carretto che tocca terra, con un cigolio di legno
    s = tonfo(0.45, 85, 0.6)
    t = np.arange(len(s)) / SR
    cigolio = np.sin(2 * np.pi * (620 - 180 * t) * t) * np.exp(-((t - 0.07) / 0.04) ** 2) * 0.18
    return s + cigolio


def lancia():
    # sibilo della lancia che fende l'aria: rumore filtrato che sale e poi si allontana
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    rumore = RNG.normal(0, 1, n)
    uscita = np.zeros(n)
    y1 = y2 = 0.0
    for i in range(n):
        # filtro passa-banda risonante con frequenza centrale che scende (effetto Doppler)
        fc = 2600 - 1500 * (t[i] / t[-1])
        r = 0.985
        a1 = -2 * r * np.cos(2 * np.pi * fc / SR)
        a2 = r * r
        y = rumore[i] * (1 - r) - a1 * y1 - a2 * y2
        y2, y1 = y1, y
        uscita[i] = y
    inviluppo = np.sin(np.pi * np.minimum(1, t / 0.5)) ** 1.5
    fruscio = lfilter([0.12], [1, -0.9], rumore) * inviluppo * 0.3
    return uscita / np.max(np.abs(uscita)) * inviluppo + fruscio


def salva(segnale, nome):
    segnale = segnale / np.max(np.abs(segnale)) * 0.9
    pcm = (segnale * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, "x.wav")
        with wave.open(w, "wb") as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w, "-codec:a", "libmp3lame", "-b:a", "96k",
                        os.path.join(CARTELLA, nome)], check=True)
    print(nome)


if __name__ == "__main__":
    salva(tonfo(), "colpo.mp3")
    salva(hop(), "hop.mp3")
    salva(atterraggio(), "atterraggio.mp3")
    salva(lancia(), "lancia.mp3")
