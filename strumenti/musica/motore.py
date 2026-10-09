# Motore di composizione: da una descrizione a sezioni produce un MIDI multitraccia.
import mido, random

NOTE = {'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
MODI = {'dorico':[0,2,3,5,7,9,10],'frigio':[0,1,3,5,7,8,10],
        'misolidio':[0,2,4,5,7,9,10],'eolio':[0,2,3,5,7,8,10]}
CANALI = {'lead1':0,'lead2':1,'lead3':2,'drone':3,'pad':4,'arp':5,'bass':6,
          'ost':7,'timp':8,'lead4':10,'pad2':11}
TPB = 480

def nota(n):
    i, acc = 1, 0
    while n[i] in '#b':
        acc += 1 if n[i] == '#' else -1; i += 1
    return 12*(int(n[i:])+1) + NOTE[n[0]] + acc

def melodia(s):
    out = []
    for t in s.split():
        if t == '|': continue
        p, d = t.split(':')
        out.append((None if p == 'r' else nota(p), float(d)))
    return out

def triade(radice, pcs, ottava):
    r = 12*(ottava+1) + NOTE[radice[0]] + (1 if '#' in radice else -1 if radice.endswith('b') else 0)
    i = pcs.index(r % 12)
    su = lambda pc: r + ((pc - r) % 12)
    return [r, su(pcs[(i+2) % 7]), su(pcs[(i+4) % 7])]

def componi(brano, file_midi):
    random.seed(brano['nome'])
    pcs = [(NOTE[brano['tonica']] + x) % 12 for x in MODI[brano['modo']]]
    q = brano['battute_q']                     # durata battuta in semiminime
    ev = []                                     # (tempo_q, canale, nota, vel, durata_q)
    def suona(ch, n, v, t, d):
        if n is None: return
        ev.append((t, ch, n, max(1, min(127, int(v))), d))
    t0 = 0.0
    for sez in brano['sezioni']:
        accordi = sez['accordi'].split()
        nb = len(accordi)
        for (strum, mel, trasp, vel) in sez.get('mel', []):
            t = t0
            for n, d in melodia(mel):
                if n is not None:
                    suona(CANALI[strum], n + trasp, vel + random.randint(-6, 6), t, d*0.95)
                t += d
            assert abs(t - t0 - nb*q) < 1e-6, (brano['nome'], mel[:20], t - t0, nb*q)
        L = sez['strati']
        for b, acc in enumerate(accordi):
            tb = t0 + b*q
            if 'drone' in L:
                r = triade(acc if sez.get('drone_segue') else brano['tonica'], pcs, 2)
                suona(CANALI['drone'], r[0], L['drone'], tb, q); suona(CANALI['drone'], r[2], L['drone']-8, tb, q)
            if 'pad' in L:
                for n in triade(acc, pcs, 3): suona(CANALI['pad'], n + 12*(n < 55), L['pad'], tb, q)
            if 'pad2' in L:
                for n in triade(acc, pcs, 4): suona(CANALI['pad2'], n, L['pad2'], tb, q)
            if 'arp' in L:
                tr = triade(acc, pcs, 3)
                seq = brano.get('arp', [0,1,2,3,2,1])
                passo = q/len(seq)
                for k, i in enumerate(seq):
                    n = tr[i % 3] + 12*(i // 3)
                    suona(CANALI['arp'], n, L['arp'] - (0 if k == 0 else 12), tb + k*passo, passo*1.6)
            if 'bass' in L:
                r = triade(acc, pcs, 2)[0]
                for pos, rel in brano.get('basso', [(0, 0), (q/2, 7)]):
                    suona(CANALI['bass'], r + rel, L['bass'], tb + pos, q/2*0.9)
            if 'ost' in L:
                tr = triade(acc, pcs, 3)
                seq = brano.get('ost', [0,2,1,2,0,2,1,2])
                passo = q/len(seq)
                for k, i in enumerate(seq):
                    suona(CANALI['ost'], tr[i % 3] + 12*(i // 3), L['ost'] + (10 if k % (len(seq)//2) == 0 else 0), tb + k*passo, passo*0.8)
            if 'timp' in L and b % sez.get('timp_ogni', 2) == 0:
                r = triade(acc, pcs, 2)[0]
                suona(CANALI['timp'], r, L['timp'], tb, q)
            if sez.get('tamburi'):
                for pnota, patt in brano['tamburi'][sez['tamburi']].items():
                    passo = q/len(patt)
                    for k, c in enumerate(patt):
                        if c in 'xo':
                            suona(9, pnota, (100 if c == 'x' else 62) * sez.get('vol_tamburi', 1) + random.randint(-5, 5), tb + k*passo, passo)
        t0 += nb*q
    # costruzione del file
    mf = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack(); mf.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(brano['bpm'])))
    for nome, prog in brano['strumenti'].items():
        tr.append(mido.Message('program_change', channel=CANALI[nome], program=prog))
        tr.append(mido.Message('control_change', channel=CANALI[nome], control=7, value=brano.get('volumi', {}).get(nome, 100)))
        tr.append(mido.Message('control_change', channel=CANALI[nome], control=91, value=70))
        tr.append(mido.Message('control_change', channel=CANALI[nome], control=10, value=brano.get('pan', {}).get(nome, 64)))
    msgs = []
    for t, ch, n, v, d in ev:
        msgs.append((round(t*TPB), 1, mido.Message('note_on', channel=ch, note=n, velocity=v)))
        msgs.append((round((t+d)*TPB), 0, mido.Message('note_off', channel=ch, note=n, velocity=0)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    ora = 0
    for tick, _, m in msgs:
        tr.append(m.copy(time=tick - ora)); ora = tick
    mf.save(file_midi)
    return t0 * 60 / brano['bpm']               # durata del loop in secondi
