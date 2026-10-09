import sys, subprocess, wave, numpy as np
from motore import componi
from brani import BRANI
SF = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
SR = 44100
out = sys.argv[1]
for i, b in enumerate(BRANI, 1):
    if len(sys.argv) > 2 and b['nome'] not in sys.argv[2:]: continue
    mid = f"{b['nome']}.mid"; wav = f"{b['nome']}.wav"
    durata = componi(b, mid)
    subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.5', '-r', str(SR), '-F', wav, SF, mid], check=True)
    with wave.open(wav) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(np.float64)
    L = int(round(durata * SR))
    coda = x[L:]
    loop = x[:L].copy()
    loop[:len(coda)] += coda[:L]            # la coda (riverbero) rientra all'inizio: loop senza stacchi
    rms = np.sqrt(np.mean(loop**2)) / 32768
    loop *= 10**(-20/20) / rms               # tutti i brani allo stesso volume medio (-20 dBFS)
    picco = np.abs(loop).max() / 32768
    if picco > 0.89: loop *= 0.89 / picco
    pcm = np.clip(loop, -32768, 32767).astype(np.int16)
    fin = f"loop_{b['nome']}.wav"
    with wave.open(fin, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    nome = f"{out}/musica{i}-{b['nome']}"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', fin, '-c:a', 'libmp3lame', '-b:a', '112k', nome + '.mp3'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', fin, '-c:a', 'libvorbis', '-q:a', '3', nome + '.ogg'], check=True)
    print(f"{nome}: {durata:.1f}s  rms->-20dB  picco {20*np.log10(max(picco,1e-9)):.1f}dB")
