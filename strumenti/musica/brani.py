# I quattro brani: un brano per ciascuno dei 4 momenti del gioco.

DIES = "F4:2 E4:2 F4:2 D4:2 E4:2 C4:2 D4:4 F4:2 F4:2 G4:2 F4:2 E4:2 D4:2 C4:2 D4:2"

ABBAZIA = dict(
    nome='abbazia', bpm=88, battute_q=4, tonica='D', modo='dorico',
    strumenti=dict(lead1=52, lead2=60, lead3=74, drone=19, pad=48, arp=46, bass=43, ost=48, timp=47),
    volumi=dict(drone=70, pad=80, ost=85, lead1=110, lead2=105, lead3=100, timp=100),
    pan=dict(arp=40, ost=88, lead3=76),
    arp=[0,1,2,3,4,3,2,1], ost=[0,2,1,2,0,2,1,2],
    tamburi=dict(
        marcia={41:'x...o.o.x...o.o.', 45:'....x.......x.o.', 54:'..o...o...o...o.'},
        piano={41:'x.......x.......'},
    ),
    sezioni=[
        dict(accordi='D D D D C C D D', strati=dict(drone=70, pad=55, timp=90), timp_ogni=2,
             mel=[('lead1', DIES, 0, 85)]),
        dict(accordi='D C D D F C D D', strati=dict(drone=70, pad=55, ost=60, timp=95), tamburi='marcia', vol_tamburi=.8,
             mel=[('lead2', DIES, 0, 90)]),
        dict(accordi='F C D A F C D D', strati=dict(pad=50, arp=75, bass=70), tamburi='piano',
             mel=[('lead3', "A4:1 C5:1 D5:2 C5:1 A4:1 G4:2 A4:1 G4:1 F4:1 E4:1 D4:4 "
                             "F4:1 G4:1 A4:2 G4:1 F4:1 E4:2 D4:1 E4:1 F4:1 E4:1 D4:4", 0, 85)]),
        dict(accordi='D C F G D C A D', strati=dict(pad=55, ost=70, bass=80, timp=100), timp_ogni=1, tamburi='marcia',
             mel=[('lead2', "D4:0.5 D4:0.5 A4:1 G4:0.5 F4:0.5 E4:1 D4:0.5 E4:0.5 F4:0.5 G4:0.5 A4:2 "
                             "A4:0.5 A4:0.5 C5:1 B4:0.5 A4:0.5 G4:1 A4:1 G4:1 F4:2 "
                             "D4:0.5 D4:0.5 A4:1 G4:0.5 F4:0.5 E4:1 F4:0.5 G4:0.5 A4:0.5 C5:0.5 D5:2 "
                             "C5:1 A4:1 G4:1 E4:1 D4:4", 0, 95)]),
        dict(accordi='D D C C D F C D', strati=dict(drone=75, pad=60, ost=70, bass=80, timp=105), tamburi='marcia',
             mel=[('lead1', DIES, 12, 95), ('lead2', DIES, 0, 85)]),
        dict(accordi='D D C D D D C D', strati=dict(drone=70, pad=45, arp=60),
             mel=[('lead3', "D5:2 C5:1 A4:1 G4:4 F4:1 G4:1 A4:2 D4:4 F4:2 E4:1 D4:1 C4:4 D4:8", 0, 75)]),
    ])

M1 = ("E4:3 F#4:1 G4:2 A4:2 B4:4 A4:2 G4:2 F#4:2 G4:1 A4:1 G4:2 F#4:2 E4:8", 'E G G A D E E E')
M2 = ("B4:2 D5:2 E5:4 D5:2 B4:1 A4:1 B4:4 G4:2 A4:2 B4:2 D5:2 C#5:2 B4:2 A4:4", 'E G E E G D A A')
M3 = ("E4:4 G4:4 F#4:4 D4:4 E4:4 A4:4 G4:2 F#4:2 E4:4", 'E G D D E A G E')
BOSCO = dict(
    nome='bosco', bpm=100, battute_q=4, tonica='E', modo='dorico',
    strumenti=dict(lead1=42, lead2=73, lead3=53, lead4=41, drone=49, pad=48, arp=46, bass=43, ost=45),
    volumi=dict(drone=65, pad=65, arp=90, lead1=110, lead2=95, lead3=100, lead4=105, ost=85),
    pan=dict(arp=44, ost=84, lead2=76),
    arp=[0,2,3,2,1,2,3,2], ost=[0,2,1,2,0,2,1,2], basso=[(0, 0), (2.5, 7)],
    tamburi=dict(
        passi={41:'x.......x.......', 70:'..o...o...o...o.'},
        pieno={41:'x..x....x..x....', 43:'......o.......o.', 70:'o.o.o.o.o.o.o.o.'},
    ),
    sezioni=[
        dict(accordi=M1[1], strati=dict(drone=60, arp=60), mel=[('lead1', M1[0], -12, 85)]),
        dict(accordi=M2[1], strati=dict(drone=60, arp=60, pad=40), tamburi='passi', vol_tamburi=.7, mel=[('lead2', M2[0], 0, 80)]),
        dict(accordi=M3[1], strati=dict(ost=55, pad=40, bass=60), tamburi='passi', vol_tamburi=.7, mel=[('lead3', M3[0], 0, 80)]),
        dict(accordi=M1[1], strati=dict(arp=60, bass=70, pad=45), tamburi='pieno', vol_tamburi=.75, mel=[('lead4', M1[0], 0, 90)]),
        dict(accordi=M2[1], strati=dict(arp=60, bass=70, ost=50), tamburi='pieno', vol_tamburi=.75, mel=[('lead2', M2[0], 0, 85), ('lead1', M2[0], -24, 65)]),
        dict(accordi=M3[1], strati=dict(drone=60, arp=55), tamburi='passi', vol_tamburi=.6, mel=[('lead3', M3[0], 0, 75)]),
        dict(accordi=M1[1], strati=dict(drone=60, arp=55), mel=[('lead1', M1[0], -12, 80)]),
    ])

P1 = ("E4:2 F4:1 E4:1 D4:2 E4:2 G4:1 F4:1 E4:1 D4:1 E4:4 E4:1 G4:1 A4:2 B4:1 A4:1 G4:2 F4:2 G4:1 F4:1 E4:4", 'E E D E A G F E')
P2 = ("B4:1 C5:1 D5:2 C5:1 B4:1 A4:2 B4:2 G4:2 A4:4 C5:1 B4:1 A4:1 G4:1 F4:2 G4:2 A4:1 G4:1 F4:2 E4:4", 'G D E A C F D E')
P3 = ("E4:4 F4:4 G4:4 F4:2 E4:2 A4:4 G4:4 F4:4 E4:4", 'E F C D A G F E')
PALUDE = dict(
    nome='palude', bpm=96, battute_q=4, tonica='E', modo='frigio',
    strumenti=dict(lead1=69, lead2=53, lead3=75, drone=19, pad=49, bass=43, ost=45, timp=47),
    volumi=dict(drone=60, pad=70, ost=95, lead1=100, lead2=100, lead3=100, timp=90),
    pan=dict(ost=40, lead3=80),
    ost=[0,2,1,2,0,2,3,2],
    basso=[(0, 0), (1.5, 0), (3, 7)],
    tamburi=dict(
        leggero={41:'x.......x..o....', 75:'......o.......o.'},
        pieno={41:'x..o....x..o.o..', 43:'....x.......x...', 75:'..o...o...o...o.', 54:'o.o.o.o.o.o.o.o.'},
    ),
    sezioni=[
        dict(accordi=P1[1], strati=dict(drone=60, ost=60), tamburi='leggero', mel=[('lead1', P1[0], 0, 85)]),
        dict(accordi=P2[1], strati=dict(drone=60, ost=60, bass=70, pad=45), tamburi='leggero', mel=[('lead3', P2[0], 0, 85)]),
        dict(accordi=P3[1], strati=dict(ost=65, bass=70, timp=80), tamburi='pieno', vol_tamburi=.85, mel=[('lead2', P3[0], 0, 80)]),
        dict(accordi=P1[1], strati=dict(ost=65, bass=75, pad=45, timp=85), tamburi='pieno', mel=[('lead1', P1[0], 0, 90)]),
        dict(accordi=P2[1], strati=dict(ost=65, bass=75, pad2=40), tamburi='pieno', mel=[('lead3', P2[0], 0, 85), ('lead2', P2[0], -12, 60)]),
        dict(accordi=P1[1], strati=dict(drone=60, ost=55), tamburi='leggero', mel=[('lead3', P1[0], 12, 75)]),
    ])
PALUDE['strumenti']['pad2'] = 52

S1 = ("A4:0.5 B4:0.5 C5:0.5 D5:0.5 E5:1 A4:1 G4:0.5 A4:0.5 B4:0.5 G4:0.5 A4:2 "
      "A4:0.5 B4:0.5 C5:0.5 D5:0.5 E5:1 F#5:0.5 G5:0.5 F#5:0.5 E5:0.5 D5:0.5 F#5:0.5 E5:2 "
      "E5:0.5 D5:0.5 C5:0.5 B4:0.5 C5:1 A4:1 B4:0.5 A4:0.5 G4:0.5 B4:0.5 A4:1 E4:1 "
      "G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5:1 B4:1 A4:4", 'A G A D C G G A')
S2 = ("E5:1.5 D5:0.5 C5:1 B4:1 A4:1.5 B4:0.5 C5:2 D5:1.5 C5:0.5 B4:1 A4:1 G4:1.5 A4:0.5 B4:2 "
      "C5:1 D5:1 E5:1 G5:1 F#5:1 E5:1 D5:2 C5:1 B4:1 A4:1 G4:1 A4:4", 'A A G E C D G A')
S3 = ("A4:1 A4:0.5 A4:0.5 C5:1 A4:1 G4:1 G4:0.5 G4:0.5 B4:1 G4:1 A4:1 A4:0.5 A4:0.5 C5:1 E5:1 D5:2 B4:2 "
      "A4:1 A4:0.5 A4:0.5 C5:1 A4:1 G4:1 G4:0.5 G4:0.5 B4:1 D5:1 E5:1 D5:1 C5:1 B4:1 A4:4", 'A G A G A G E A')
SENTIERO = dict(
    nome='sentiero', bpm=132, battute_q=4, tonica='A', modo='dorico',
    strumenti=dict(lead1=110, lead2=111, lead3=109, drone=48, pad=48, arp=24, bass=32, ost=45, timp=47),
    volumi=dict(drone=60, pad=65, ost=95, lead1=105, lead2=95, lead3=70, timp=95, bass=110),
    pan=dict(ost=40, arp=88, lead2=74),
    ost=[0,1,2,1,0,1,2,1], basso=[(0, 0), (1, 0), (2, 7), (3, 0)],
    tamburi=dict(
        corsa={36:'x.....x.x.......', 41:'....x.......x.o.', 54:'o.x.o.x.o.x.o.x.', 39:'....x.......x...'},
        pausa={41:'x.......x.......', 54:'..o...o...o...o.'},
    ),
    sezioni=[
        dict(accordi=S1[1], strati=dict(ost=70, bass=75, drone=55), tamburi='corsa', vol_tamburi=.8),
        dict(accordi=S1[1], strati=dict(ost=70, bass=80, pad=45), tamburi='corsa', mel=[('lead1', S1[0], 0, 90)]),
        dict(accordi=S2[1], strati=dict(ost=70, bass=80, pad=45, timp=85), tamburi='corsa', mel=[('lead2', S2[0], 0, 85)]),
        dict(accordi=S3[1], strati=dict(arp=70, bass=80, drone=55), tamburi='pausa', mel=[('lead3', S3[0], 0, 75), ('lead1', S3[0], 0, 70)]),
        dict(accordi=S1[1], strati=dict(ost=75, bass=85, pad=50, timp=90), timp_ogni=1, tamburi='corsa', mel=[('lead1', S1[0], 0, 95), ('lead2', S1[0], -12, 65)]),
        dict(accordi=S2[1], strati=dict(ost=70, bass=80, arp=60), tamburi='corsa', mel=[('lead1', S2[0], 0, 85)]),
        dict(accordi=S3[1], strati=dict(arp=70, bass=80, drone=55), tamburi='pausa', mel=[('lead2', S3[0], 0, 80)]),
        dict(accordi=S1[1], strati=dict(ost=70, bass=80, pad=45, timp=85), tamburi='corsa', mel=[('lead1', S1[0], 0, 90), ('lead3', S1[0], -12, 55)]),
    ])

BRANI = [ABBAZIA, BOSCO, PALUDE, SENTIERO]
