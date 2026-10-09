// ================================================================
//  MONTECASSINO ESCAPE · motore di gioco
//  Le domande e i testi sono in js/domande.js
// ================================================================
(() => {
  "use strict";

  const W = 1280;
  const H = 720;
  const SUOLO = 640; // linea dei piedi dei personaggi
  const DISTACCO_INIZIALE = 40;
  const PASSO_DISTACCO = 15; // terreno guadagnato o perso a ogni risposta
const RIMONTA = [10, 13, 16]; // quanto si avvicinano i soldati a ogni rimonta, tappa per tappa
const MINIMO_RIMONTA = 15; // le rimonte da sole non bastano a raggiungere l'Abate
const GRIDA_RIMONTA = ["ALL'ATTACCO!", "PIÙ VELOCI!", "NON SCAPPERETE!", "DI CORSA!"];
  const VEL_BASE = 420; // pixel al secondo della strada

  const $ = (id) => document.getElementById(id);
  const schermo = $("schermo");
  const canvas = $("scena");
  const ctx = canvas.getContext("2d");

  // ---------------------------------------------------------------
  //  Adattamento allo schermo (PC e tablet in orizzontale)
  // ---------------------------------------------------------------
  let k = 1; // scala interna del canvas
  function adatta() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    schermo.style.transform = `scale(${s})`;
    schermo.style.left = `${(window.innerWidth - W * s) / 2}px`;
    schermo.style.top = `${(window.innerHeight - H * s) / 2}px`;
    const dpr = window.devicePixelRatio || 1;
    k = Math.max(1, Math.min(2, s * dpr));
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
  }
  window.addEventListener("resize", adatta);
  window.addEventListener("orientationchange", () => setTimeout(adatta, 300));
  adatta();

  // ---------------------------------------------------------------
  //  Immagini
  // ---------------------------------------------------------------
  const img = {};
  function caricaImmagine(nome, src) {
    return new Promise((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = src;
      img[nome] = i;
    });
  }
  const caricamenti = [
    caricaImmagine("inizio", "assets/img/inizio.jpg"),
    caricaImmagine("libro", "assets/img/libro.png"),
    ...TAPPE.map((t, i) => caricaImmagine("tappa" + (i + 1), t.sfondo)),
    ...FINALI.map((f) => caricaImmagine("finale-" + f.tipo, f.sfondo)),
  ];
  const RITRATTI = {
    normale: "assets/img/abate.svg",
    felice: "assets/img/abate-felice.svg",
    arrabbiato: "assets/img/abate-arrabbiato.svg",
  };
  Object.values(RITRATTI).forEach((src) => { new Image().src = src; });

  // ---------------------------------------------------------------
  //  Suoni
  // ---------------------------------------------------------------
  const NOMI_SUONI = ["giusto", "sbagliato", "esplosione", "vittoria", "magia", "russare", "risata"];
  const suoni = {};
  NOMI_SUONI.forEach((n) => {
    const a = new Audio(`assets/audio/${n}.mp3`);
    a.preload = "auto";
    suoni[n] = a;
  });
  // musiche di sottofondo: una per l'introduzione e una per ogni tappa
  const VOLUME_MUSICA = 0.4;
  const musiche = {};
  [["intro", MUSICA_INTRO], ...TAPPE.map((t, i) => ["tappa" + (i + 1), t.musica])].forEach(([nome, src]) => {
    if (!src) return;
    const a = new Audio(src);
    a.preload = "auto";
    a.loop = true;
    musiche[nome] = a;
  });
  const tuttiGliAudio = () => [...Object.values(suoni), ...Object.values(musiche)];
  let muto = false;
  let audioSbloccato = false;
  let musicaCorrente = null;

  function sbloccaAudio() {
    if (audioSbloccato) return;
    audioSbloccato = true;
    tuttiGliAudio().forEach((a) => {
      a.muted = true;
      const p = a.play();
      const ferma = () => { if (a !== musicaCorrente) { a.pause(); a.currentTime = 0; } a.muted = muto; };
      if (p && p.then) p.then(ferma).catch(() => { a.muted = muto; });
      else ferma();
    });
  }
  function suona(nome, volume = 1) {
    const a = suoni[nome];
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = volume;
      a.muted = muto;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* audio non disponibile */ }
  }
  // Dissolvenza dolce da un brano all'altro (null = silenzio)
  function sfuma(a, da, a_, ms, poi) {
    const inizio = performance.now();
    const passo = () => {
      const k = Math.min(1, (performance.now() - inizio) / ms);
      try { a.volume = Math.max(0, Math.min(1, da + (a_ - da) * k)); } catch (e) { /* iOS */ }
      if (k < 1) requestAnimationFrame(passo); else if (poi) poi();
    };
    passo();
  }
  function musica(nome) {
    const nuova = nome ? musiche[nome] : null;
    if (nuova === musicaCorrente) return;
    const vecchia = musicaCorrente;
    musicaCorrente = nuova;
    if (vecchia) sfuma(vecchia, vecchia.volume, 0, 1200, () => { if (vecchia !== musicaCorrente) vecchia.pause(); });
    if (nuova) {
      nuova.currentTime = 0;
      nuova.muted = muto;
      nuova.volume = 0;
      const p = nuova.play();
      if (p && p.catch) p.catch(() => {});
      sfuma(nuova, 0, VOLUME_MUSICA, 1500);
    }
  }
  $("btn-audio").addEventListener("click", () => {
    muto = !muto;
    tuttiGliAudio().forEach((a) => { a.muted = muto; });
    $("btn-audio").textContent = muto ? "🔇" : "🔊";
  });
  $("btn-schermo").addEventListener("click", () => {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      const el = d.documentElement;
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f) f.call(el);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!musicaCorrente) return;
    if (document.hidden) musicaCorrente.pause();
    else { const p = musicaCorrente.play(); if (p && p.catch) p.catch(() => {}); }
  });

  // ---------------------------------------------------------------
  //  Stato del mondo
  // ---------------------------------------------------------------
  const COLORI_LIBRI = ["#8b1e1e", "#1f4e8c", "#2e6b34", "#7b3f99", "#a86b1d", "#5a3a1a", "#b0462a", "#245e6b", "#6e1f4f", "#3d5b1e", "#8c6a12"];
  const mondo = {
    stato: "titolo", // titolo | intro | corsa | finale
    t: 0,
    scroll: 0,
    vel: 1,
    D: DISTACCO_INIZIALE,
    Dv: DISTACCO_INIZIALE,
    tappa: 1,
    tappaPrec: 1,
    dissolvenza: 1,
    libri: DOMANDE.length,
    libriVolanti: [],
    particelle: [],
    uscita: 0, // spostamento del monaco verso destra nei finali
    cattura: false,
    velo: 0, // velo nero per le transizioni
    veloObiettivo: 0,
    lampo: 0,
    grido: 0,
    inseguimento: false,
    prossimaRimonta: 9,
    scatto: 0,
    passoSoldati: 0,
    finale: null,
    corrette: 0,
    sbagliate: 0,
  };

  function azzeraMondo() {
    Object.assign(mondo, {
      scroll: 0, vel: 1, D: DISTACCO_INIZIALE, Dv: DISTACCO_INIZIALE,
      tappa: 1, tappaPrec: 1, dissolvenza: 1, libri: DOMANDE.length,
      libriVolanti: [], particelle: [], uscita: 0, cattura: false,
      inseguimento: false, prossimaRimonta: 9, scatto: 0, passoSoldati: 0,
      lampo: 0, grido: 0, finale: null, corrette: 0, sbagliate: 0,
    });
  }

  // ---------------------------------------------------------------
  //  Utilità di disegno
  // ---------------------------------------------------------------
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function arto(x1, y1, x2, y2, spessore, colore, bordo = "#24160c") {
    ctx.lineCap = "round";
    ctx.strokeStyle = bordo;
    ctx.lineWidth = spessore + 4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = colore;
    ctx.lineWidth = spessore;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function poligono(punti, riempi, bordo = "#24160c", spessore = 3) {
    ctx.beginPath();
    ctx.moveTo(punti[0][0], punti[0][1]);
    for (let i = 1; i < punti.length; i++) ctx.lineTo(punti[i][0], punti[i][1]);
    ctx.closePath();
    ctx.fillStyle = riempi;
    ctx.fill();
    if (bordo) { ctx.lineJoin = "round"; ctx.strokeStyle = bordo; ctx.lineWidth = spessore; ctx.stroke(); }
  }
  function cerchio(x, y, r, riempi, bordo = "#24160c", spessore = 3) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (riempi) { ctx.fillStyle = riempi; ctx.fill(); }
    if (bordo) { ctx.strokeStyle = bordo; ctx.lineWidth = spessore; ctx.stroke(); }
  }
  // Gamba in corsa: restituisce anca, ginocchio e piede
  function gamba(ax, ay, fase, lung) {
    const a = 0.75 * Math.sin(fase);
    const piega = 0.15 + 1.25 * Math.max(0, Math.cos(fase));
    const gx = ax + lung * Math.sin(a);
    const gy = ay + lung * Math.cos(a);
    const b = a - piega;
    const px = gx + lung * Math.sin(b);
    const py = gy + lung * Math.cos(b);
    return { gx, gy, px, py, b };
  }

  // ---------------------------------------------------------------
  //  Sfondi
  // ---------------------------------------------------------------
  const TW = 1280;
  const TH = 960;
  function disegnaPanorama(immagine, offset, alpha) {
    if (!immagine || !immagine.complete || !immagine.naturalWidth) return;
    ctx.globalAlpha = alpha;
    const y = -190;
    const primo = Math.floor(offset / TW);
    for (let j = primo; j <= primo + 1; j++) {
      const x = j * TW - offset;
      if (j % 2 === 0) {
        ctx.drawImage(immagine, x, y, TW + 1, TH);
      } else {
        ctx.save();
        ctx.translate(x + TW, y);
        ctx.scale(-1, 1);
        ctx.drawImage(immagine, -1, 0, TW + 1, TH);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  function disegnaFissa(immagine, zoom) {
    if (!immagine || !immagine.naturalWidth) { ctx.fillStyle = "#1b130d"; ctx.fillRect(0, 0, W, H); return; }
    const s = (W / immagine.naturalWidth) * zoom;
    const w = immagine.naturalWidth * s;
    const h = immagine.naturalHeight * s;
    ctx.drawImage(immagine, (W - w) / 2, (H - h) / 2 - 40 * zoom, w, h);
  }

  const PALETTE_STRADA = [
    { erba: "#4f6b2a", erbaScura: "#34491a", strada: "#a07a4c", solco: "#7f5f37", bordo: "#3b2a18", sasso: "#8d8476", primo: "#2a1c10" },
    { erba: "#3a4a26", erbaScura: "#253117", strada: "#5e4a33", solco: "#463626", bordo: "#221810", sasso: "#5d6a6e", primo: "#141009", pozza: "#3d5560" },
    { erba: "#66724e", erbaScura: "#454f33", strada: "#8f877a", solco: "#716a5c", bordo: "#3a362e", sasso: "#a39d90", primo: "#1e1c18" },
  ];
  function disegnaStrada() {
    const p = PALETTE_STRADA[(mondo.tappa - 1) % PALETTE_STRADA.length];
    const s = mondo.scroll;
    // erba di bordo
    ctx.fillStyle = p.erbaScura;
    ctx.fillRect(0, 568, W, 40);
    ctx.fillStyle = p.erba;
    ctx.beginPath();
    ctx.moveTo(0, 600);
    const passo = 16;
    const inizio = Math.floor(s / passo) - 1;
    for (let i = inizio; i < inizio + W / passo + 3; i++) {
      const x = i * passo - s;
      const h = 10 + hash(i) * 18;
      ctx.lineTo(x, 586);
      ctx.lineTo(x + passo / 2, 586 - h);
    }
    ctx.lineTo(W, 600);
    ctx.closePath();
    ctx.fill();
    // strada
    ctx.fillStyle = p.strada;
    ctx.fillRect(0, 598, W, 92);
    ctx.fillStyle = p.bordo;
    ctx.fillRect(0, 596, W, 5);
    // solchi
    ctx.fillStyle = p.solco;
    for (const yy of [622, 662]) {
      const ps = 120;
      const i0 = Math.floor(s / ps) - 1;
      for (let i = i0; i < i0 + W / ps + 3; i++) {
        const x = i * ps - s;
        ctx.fillRect(x, yy, 70 + hash(i + yy) * 40, 4);
      }
    }
    // pozzanghere (palude) e sassi
    const ps2 = 170;
    const j0 = Math.floor(s / ps2) - 1;
    for (let i = j0; i < j0 + W / ps2 + 3; i++) {
      const x = i * ps2 - s + hash(i * 3) * 80;
      const y = 612 + hash(i * 7) * 66;
      if (p.pozza && hash(i * 11) > 0.55) {
        ctx.fillStyle = p.pozza;
        ctx.beginPath(); ctx.ellipse(x, y, 34, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x - 18, y - 2, 16, 2);
      } else {
        ctx.fillStyle = p.sasso;
        ctx.beginPath(); ctx.ellipse(x, y, 7 + hash(i) * 6, 4 + hash(i * 5) * 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x - 6, y + 3, 12, 2);
      }
    }
    // primo piano
    ctx.fillStyle = p.bordo;
    ctx.fillRect(0, 688, W, 32);
    const sp = s * 1.35;
    const ps3 = 260;
    const q0 = Math.floor(sp / ps3) - 1;
    ctx.fillStyle = p.primo;
    for (let i = q0; i < q0 + W / ps3 + 3; i++) {
      const x = i * ps3 - sp;
      const r = 26 + hash(i * 13) * 30;
      ctx.beginPath();
      ctx.arc(x, 726, r, Math.PI, 0);
      ctx.arc(x + r * 0.9, 730, r * 0.75, Math.PI, 0);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------
  //  Personaggi
  // ---------------------------------------------------------------
  const SAIO = "#8a4b24";
  const SAIO_SCURO = "#6b3818";
  const PELLE = "#f0c08a";

  function disegnaCarretto(x, fase) {
    const G = SUOLO;
    const sobb = Math.sin(mondo.scroll / 23) * 1.5;
    const ruotaX = x - 150;
    const ruotaY = G - 30;
    const yb = G - 84 + sobb; // piano del carro
    // stanghe
    arto(x - 40, G - 76, ruotaX + 55, yb + 14, 6, "#7a4a22");
    // libri
    disegnaLibriCarretto(x, yb);
    // cassone
    poligono([[x - 228, yb], [x - 72, yb], [x - 78, yb + 30], [x - 222, yb + 30]], "#8b5a2b");
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 226, yb + i * 10); ctx.lineTo(x - 75, yb + i * 10); ctx.stroke(); }
    ctx.fillStyle = "#5a3818";
    ctx.fillRect(x - 190, yb + 2, 5, 27); ctx.fillRect(x - 115, yb + 2, 5, 27);
    // ruota
    cerchio(ruotaX, ruotaY, 30, "#5a3818", "#24160c", 4);
    cerchio(ruotaX, ruotaY, 23, "#b98a52", null);
    const ang = mondo.scroll / 30;
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = ang + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(ruotaX + Math.cos(a) * 23, ruotaY + Math.sin(a) * 23);
      ctx.lineTo(ruotaX - Math.cos(a) * 23, ruotaY - Math.sin(a) * 23);
      ctx.stroke();
    }
    cerchio(ruotaX, ruotaY, 7, "#3b2412", "#24160c", 2);
  }

  // 11 libri: 6 in piedi sul fondo, 5 sdraiati sopra
  function posizioneLibro(i, x, yb) {
    if (i < 6) return { x: x - 218 + i * 23, y: yb, tipo: "piedi" };
    const j = i - 6;
    const pile = [[x - 214, 0], [x - 214, 1], [x - 150, 0], [x - 150, 1], [x - 182, 2]];
    return { x: pile[j][0], y: yb - 40 - pile[j][1] * 13, tipo: "steso" };
  }
  function disegnaLibriCarretto(x, yb) {
    for (let i = 0; i < Math.min(mondo.libri, 11); i++) {
      const p = posizioneLibro(i, x, yb);
      const c = COLORI_LIBRI[i % COLORI_LIBRI.length];
      if (p.tipo === "piedi") {
        const h = 36 + hash(i + 3) * 8;
        ctx.save();
        ctx.translate(p.x + 10, p.y);
        ctx.rotate((hash(i) - 0.5) * 0.12);
        poligono([[-10, 0], [10, 0], [10, -h], [-10, -h]], c, "#24160c", 2.5);
        ctx.fillStyle = "#e8c24a";
        ctx.fillRect(-8, -h + 6, 16, 3); ctx.fillRect(-8, -10, 16, 3);
        ctx.restore();
      } else {
        poligono([[p.x, p.y], [p.x + 58, p.y], [p.x + 58, p.y - 13], [p.x, p.y - 13]], c, "#24160c", 2.5);
        ctx.fillStyle = "#f5ecd2";
        ctx.fillRect(p.x + 50, p.y - 11, 6, 9);
        ctx.fillStyle = "#e8c24a";
        ctx.fillRect(p.x + 6, p.y - 8, 30, 2);
      }
    }
  }

  function disegnaMonaco(x, fase, umore) {
    const G = SUOLO;
    const bob = -Math.abs(Math.sin(fase)) * 5;
    const anca = { x: x + 2, y: G - 54 + bob };
    // gamba dietro
    const g2 = gamba(anca.x, anca.y, fase + Math.PI, 27);
    arto(anca.x, anca.y, g2.gx, g2.gy, 9, "#d9a86f");
    arto(g2.gx, g2.gy, g2.px, g2.py, 8, "#d9a86f");
    poligono([[g2.px - 6, g2.py - 3], [g2.px + 12, g2.py - 1], [g2.px + 12, g2.py + 4], [g2.px - 6, g2.py + 4]], "#4a2f1b", "#24160c", 2);
    // braccio dietro (tira la stanga)
    arto(x + 4, G - 108 + bob, x - 40, G - 76, 13, SAIO_SCURO);
    cerchio(x - 40, G - 76, 6, PELLE, "#24160c", 2);
    // cappuccio
    cerchio(x - 6, G - 118 + bob, 13, SAIO_SCURO);
    // saio
    const sv = Math.sin(fase * 2) * 4;
    poligono([
      [x - 8, G - 124 + bob], [x + 18, G - 122 + bob], [x + 30, G - 96 + bob],
      [x + 26 + sv, G - 34], [x - 4, G - 30], [x - 30 - sv, G - 38], [x - 18, G - 92 + bob],
    ], SAIO);
    // stola viola con croci
    poligono([[x + 14, G - 120 + bob], [x + 24, G - 118 + bob], [x + 26, G - 66 + bob], [x + 16, G - 66 + bob]], "#6a2c8c", "#24160c", 2);
    ctx.fillStyle = "#f2c94c";
    ctx.fillRect(x + 18, G - 82 + bob, 3, 11); ctx.fillRect(x + 15, G - 79 + bob, 9, 3);
    // cordone
    ctx.strokeStyle = "#e9dcc0"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 20, G - 76 + bob); ctx.lineTo(x + 28, G - 78 + bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 14, G - 76 + bob); ctx.lineTo(x - 20 - sv, G - 52 + bob); ctx.stroke();
    // gamba davanti
    const g1 = gamba(anca.x, anca.y, fase, 27);
    const vis = (gg) => gg.py > G - 40;
    if (vis(g1)) {
      arto(g1.gx, g1.gy, g1.px, g1.py, 8, "#e8b57a");
    }
    poligono([[g1.px - 6, g1.py - 3], [g1.px + 12, g1.py - 1], [g1.px + 12, g1.py + 4], [g1.px - 6, g1.py + 4]], "#4a2f1b", "#24160c", 2);
    // testa
    const tx = x + 22;
    const ty = G - 138 + bob;
    cerchio(tx, ty, 16, PELLE);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.ellipse(tx - 2, ty - 10, 6, 3, -0.3, 0, Math.PI * 2); ctx.fill();
    // corona di capelli bianchi
    ctx.fillStyle = "#f4f1ea";
    ctx.beginPath(); ctx.ellipse(tx - 12, ty + 1, 7, 10, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#24160c"; ctx.lineWidth = 1.5; ctx.stroke();
    // orecchio
    cerchio(tx - 3, ty + 1, 4, "#e2a970", "#24160c", 1.5);
    // naso
    poligono([[tx + 14, ty - 4], [tx + 22, ty + 3], [tx + 14, ty + 4]], PELLE, "#24160c", 2);
    // occhio e sopracciglio
    cerchio(tx + 9, ty - 3, 2.4, "#24160c", null);
    ctx.strokeStyle = "#f4f1ea"; ctx.lineWidth = 4;
    ctx.beginPath();
    if (umore === "paura") { ctx.moveTo(tx + 3, ty - 12); ctx.lineTo(tx + 14, ty - 8); }
    else if (umore === "felice") { ctx.moveTo(tx + 3, ty - 10); ctx.quadraticCurveTo(tx + 9, ty - 14, tx + 15, ty - 10); }
    else { ctx.moveTo(tx + 3, ty - 9); ctx.lineTo(tx + 15, ty - 10); }
    ctx.stroke();
    // barba al vento
    const onda = Math.sin(mondo.t * 9) * 3;
    poligono([
      [tx + 2, ty + 6], [tx + 18, ty + 6], [tx + 17, ty + 22],
      [tx + 8, ty + 42 + onda], [tx - 4, ty + 40 + onda], [tx - 10, ty + 24],
    ], "#f4f1ea", "#24160c", 2);
    // gocce di sudore quando i soldati sono vicini
    if (umore === "paura") {
      const g = (mondo.t * 2) % 1;
      ctx.fillStyle = "#9fd4ff";
      ctx.beginPath(); ctx.ellipse(tx - 16 - g * 10, ty - 14 + g * 10, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  const TIPI_SOLDATO = ["lancia", "torcia", "spada", "stendardo", "lancia"];
  const FORMAZIONE = [
    { dx: 0, dy: 0, s: 1 },
    { dx: -95, dy: -8, s: 0.95 },
    { dx: -175, dy: 5, s: 1 },
    { dx: -255, dy: -12, s: 0.93 },
    { dx: -330, dy: 3, s: 0.97 },
  ];

  function aquila(cx, cy, s) {
    ctx.fillStyle = "#151515";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 3.5 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2 * s); ctx.lineTo(cx - 10 * s, cy - 7 * s); ctx.lineTo(cx - 7 * s, cy + 2 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2 * s); ctx.lineTo(cx + 10 * s, cy - 7 * s); ctx.lineTo(cx + 7 * s, cy + 2 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 7 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
  }

  function disegnaSoldato(x, y, s, fase, tipo) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const G = 0;
    const bob = -Math.abs(Math.sin(fase)) * 5;
    const MAGLIA = "#8d939b";
    const anca = { x: 0, y: G - 56 + bob };
    // stendardo dietro
    if (tipo === "stendardo") {
      arto(-14, G - 70 + bob, -22, G - 200 + bob, 4, "#6b4520");
      const o = mondo.t * 8;
      ctx.beginPath();
      ctx.moveTo(-22, G - 198 + bob);
      for (let i = 0; i <= 6; i++) ctx.lineTo(-22 - i * 12, G - 198 + bob + Math.sin(o + i) * 4);
      for (let i = 6; i >= 0; i--) ctx.lineTo(-22 - i * 12, G - 150 + bob + Math.sin(o + i) * 4);
      ctx.closePath();
      ctx.fillStyle = "#e3b22c"; ctx.fill();
      ctx.strokeStyle = "#24160c"; ctx.lineWidth = 2.5; ctx.stroke();
      aquila(-58, G - 172 + bob + Math.sin(o + 3) * 4, 1.4);
    }
    // gamba dietro
    const g2 = gamba(anca.x, anca.y, fase + Math.PI, 28);
    arto(anca.x, anca.y, g2.gx, g2.gy, 11, "#6f747b");
    arto(g2.gx, g2.gy, g2.px, g2.py, 10, "#6f747b");
    poligono([[g2.px - 7, g2.py - 7], [g2.px + 14, g2.py - 2], [g2.px + 14, g2.py + 4], [g2.px - 7, g2.py + 4]], "#3a2414", "#24160c", 2);
    // braccio dietro
    if (tipo === "lancia") arto(-4, G - 108 + bob, 22, G - 92 + bob, 10, "#6f747b");
    else arto(-4, G - 108 + bob, -24, G - 84 + bob, 10, "#6f747b");
    // scudo sulla schiena
    if (tipo === "spada" || tipo === "torcia") {
      cerchio(-16, G - 92 + bob, 20, "#b3261e", "#24160c", 3);
      cerchio(-16, G - 92 + bob, 13, "#f0e2c0", null);
      cerchio(-16, G - 92 + bob, 5, "#8d939b", "#24160c", 2);
    }
    // gamba davanti
    const g1 = gamba(anca.x, anca.y, fase, 28);
    arto(anca.x, anca.y, g1.gx, g1.gy, 11, MAGLIA);
    arto(g1.gx, g1.gy, g1.px, g1.py, 10, MAGLIA);
    poligono([[g1.px - 7, g1.py - 7], [g1.px + 14, g1.py - 2], [g1.px + 14, g1.py + 4], [g1.px - 7, g1.py + 4]], "#4a2f1b", "#24160c", 2);
    // sopravveste gialla con aquila sveva
    poligono([
      [-12, G - 120 + bob], [14, G - 120 + bob], [22, G - 70 + bob], [26, G - 46 + bob],
      [-22, G - 46 + bob], [-18, G - 70 + bob],
    ], "#d9a521");
    aquila(3, G - 92 + bob, 1.3);
    ctx.fillStyle = "#4a2f1b";
    ctx.fillRect(-19, G - 68 + bob, 42, 6);
    // testa ed elmo
    const tx = 6;
    const ty = G - 134 + bob;
    cerchio(tx, ty, 15, "#e9b384");
    poligono([[tx - 6, ty + 4], [tx + 14, ty + 4], [tx + 10, ty + 16], [tx - 4, ty + 16]], "#5a3018", "#24160c", 2);
    poligono([[tx - 17, ty - 2], [tx + 17, ty - 2], [tx + 4, ty - 30]], "#a7adb5", "#24160c", 3);
    ctx.fillStyle = "#a7adb5";
    ctx.fillRect(tx + 9, ty - 3, 4, 13);
    ctx.strokeStyle = "#24160c"; ctx.lineWidth = 1.5; ctx.strokeRect(tx + 9, ty - 3, 4, 13);
    cerchio(tx + 6, ty + 1, 2.2, "#24160c", null);
    ctx.strokeStyle = "#24160c"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(tx + 1, ty - 4); ctx.lineTo(tx + 12, ty + 1); ctx.stroke();
    cerchio(tx + 13, ty + 9, 3, "#3a1208", null);
    // braccio davanti e arma
    if (tipo === "lancia") {
      arto(-30, G - 84 + bob, 92, G - 112 + bob, 4, "#6b4520");
      poligono([[92, G - 118 + bob], [114, G - 117 + bob], [93, G - 106 + bob]], "#cfd5dc", "#24160c", 2);
      arto(6, G - 108 + bob, 30, G - 98 + bob, 10, MAGLIA);
      cerchio(32, G - 98 + bob, 5, "#e9b384", "#24160c", 2);
    } else if (tipo === "torcia") {
      arto(6, G - 108 + bob, 26, G - 140 + bob, 10, MAGLIA);
      arto(22, G - 132 + bob, 34, G - 168 + bob, 5, "#6b4520");
      const f = 1 + Math.sin(mondo.t * 23 + x) * 0.15;
      ctx.fillStyle = "#ff7a1a";
      ctx.beginPath(); ctx.ellipse(35, G - 178 + bob, 10 * f, 16 * f, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd34d";
      ctx.beginPath(); ctx.ellipse(36, G - 174 + bob, 5 * f, 9 * f, 0.3, 0, Math.PI * 2); ctx.fill();
      cerchio(26, G - 140 + bob, 5, "#e9b384", "#24160c", 2);
      if (Math.random() < 0.3) particella(x + 35 * s, y + (G - 185) * s, "scintilla");
    } else if (tipo === "spada") {
      const a = Math.sin(mondo.t * 6) * 0.25;
      ctx.save();
      ctx.translate(26, G - 128 + bob);
      ctx.rotate(-0.5 + a);
      poligono([[-3, 0], [3, 0], [3, -56], [0, -64], [-3, -56]], "#cfd5dc", "#24160c", 2);
      ctx.fillStyle = "#6b4520"; ctx.fillRect(-10, -2, 20, 5);
      ctx.restore();
      arto(6, G - 108 + bob, 24, G - 128 + bob, 10, MAGLIA);
      cerchio(26, G - 128 + bob, 5, "#e9b384", "#24160c", 2);
    } else {
      arto(6, G - 108 + bob, -10, G - 96 + bob, 10, MAGLIA);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------
  //  Particelle
  // ---------------------------------------------------------------
  function particella(x, y, tipo) {
    if (mondo.particelle.length > 260) return;
    if (tipo === "polvere") {
      mondo.particelle.push({ x, y, vx: -40 - Math.random() * 60, vy: -20 - Math.random() * 30, r: 5 + Math.random() * 8, vita: 0.7, max: 0.7, tipo });
    } else if (tipo === "scintilla") {
      mondo.particelle.push({ x, y, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 80, r: 1.5 + Math.random() * 2.5, vita: 1, max: 1, tipo });
    } else if (tipo === "stella") {
      mondo.particelle.push({ x, y, vx: (Math.random() - 0.5) * 260, vy: -100 - Math.random() * 200, r: 3 + Math.random() * 3, vita: 0.9, max: 0.9, tipo });
    }
  }
  function aggiornaParticelle(dt, velStrada) {
    for (const p of mondo.particelle) {
      p.vita -= dt;
      p.x += p.vx * dt - (p.tipo === "polvere" ? velStrada * dt * 0.6 : 0);
      p.y += p.vy * dt;
      if (p.tipo === "stella") p.vy += 500 * dt;
    }
    mondo.particelle = mondo.particelle.filter((p) => p.vita > 0);
  }
  function disegnaParticelle() {
    for (const p of mondo.particelle) {
      const a = Math.max(0, p.vita / p.max);
      if (p.tipo === "polvere") ctx.fillStyle = `rgba(214,190,150,${a * 0.55})`;
      else if (p.tipo === "scintilla") ctx.fillStyle = `rgba(255,${150 + Math.floor(a * 100)},60,${a})`;
      else ctx.fillStyle = `rgba(255,230,120,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.tipo === "polvere" ? 2 - a : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------
  //  Aggiornamento e disegno della corsa
  // ---------------------------------------------------------------
  function posizioni() {
    const gx = 590 + mondo.Dv * 1.6 + mondo.uscita;
    const retro = gx - 228;
    const capo = mondo.cattura ? retro - 70 : retro - 100 - mondo.Dv * 3.6;
    return { gx, retro, capo };
  }

  function aggiornaCorsa(dt) {
    mondo.vel += (1 - mondo.vel) * Math.min(1, dt * 1.1);
    const velStrada = VEL_BASE * mondo.vel;
    mondo.scroll += velStrada * dt;
    mondo.Dv += (mondo.D - mondo.Dv) * Math.min(1, dt * 1.6);
    if (mondo.dissolvenza < 1) mondo.dissolvenza = Math.min(1, mondo.dissolvenza + dt * 0.8);
    const { gx, capo } = posizioni();
    // polvere da ruota e piedi
    if (Math.random() < 0.5 * mondo.vel) particella(gx - 150 + Math.random() * 20, SUOLO - 4, "polvere");
    if (Math.random() < 0.25) particella(capo + Math.random() * 30, SUOLO - 4, "polvere");
    aggiornaParticelle(dt, velStrada);
    // libri caduti
    for (const l of mondo.libriVolanti) {
      if (!l.aTerra) {
        l.vy += 1600 * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        l.r += l.vr * dt;
        if (l.y > SUOLO - 12) {
          l.y = SUOLO - 12;
          if (Math.abs(l.vy) > 300) { l.vy = -l.vy * 0.3; l.vr *= 0.5; }
          else { l.aTerra = true; l.r = 0.25; }
        }
      } else {
        l.x -= velStrada * dt;
      }
    }
    mondo.libriVolanti = mondo.libriVolanti.filter((l) => l.x > -150);
    mondo.lampo = Math.max(0, mondo.lampo - dt * 2);
    mondo.grido = Math.max(0, mondo.grido - dt);
    mondo.scatto = Math.max(0, mondo.scatto - dt);
    mondo.passoSoldati += mondo.scatto * dt * 9;
    // se si tarda a rispondere, i soldati accelerano e si rifanno sotto (una volta per domanda)
    if (mondo.inseguimento) {
      mondo.prossimaRimonta -= dt;
      if (mondo.prossimaRimonta <= 0) {
        mondo.prossimaRimonta = Infinity;
        if (mondo.D > MINIMO_RIMONTA) {
          mondo.D = Math.max(MINIMO_RIMONTA, mondo.D - RIMONTA[(mondo.tappa - 1) % RIMONTA.length]);
          mondo.scatto = 1.2;
          mondo.grido = 1.8;
          mondo.testoGrido = GRIDA_RIMONTA[Math.floor(Math.random() * GRIDA_RIMONTA.length)];
        }
      }
    }
  }

  function disegnaCorsa() {
    const off = mondo.scroll * 0.18;
    if (mondo.dissolvenza < 1) disegnaPanorama(img["tappa" + mondo.tappaPrec], off, 1);
    disegnaPanorama(img["tappa" + mondo.tappa], off, mondo.dissolvenza < 1 ? mondo.dissolvenza : 1);
    // leggera foschia sull'orizzonte
    const nebbia = ctx.createLinearGradient(0, 380, 0, 590);
    nebbia.addColorStop(0, "rgba(20,14,10,0)");
    nebbia.addColorStop(1, "rgba(20,14,10,0.45)");
    ctx.fillStyle = nebbia;
    ctx.fillRect(0, 380, W, 210);
    disegnaStrada();

    const { gx, capo } = posizioni();
    const fase = mondo.scroll / 34;
    // soldati (dal più lontano al più vicino)
    for (let i = FORMAZIONE.length - 1; i >= 0; i--) {
      const f = FORMAZIONE[i];
      const jitter = Math.sin(mondo.t * 1.7 + i * 2.1) * 10;
      const sx = capo + f.dx + jitter;
      if (sx < -140 || sx > W + 140) continue;
      disegnaSoldato(sx, SUOLO + f.dy, f.s, fase * 1.08 + mondo.passoSoldati + i * 1.3, TIPI_SOLDATO[i]);
    }
    if (mondo.grido > 0 && capo > -40) {
      fumetto(capo + 10, SUOLO - 215, mondo.testoGrido || "FERMATELI!");
    }
    disegnaCarretto(gx, fase);
    const umore = mondo.Dv < 22 ? "paura" : mondo.vel > 1.3 ? "felice" : "normale";
    disegnaMonaco(gx, fase, umore);
    // libri che cadono
    for (const l of mondo.libriVolanti) {
      if (!img.libro || !img.libro.naturalWidth) continue;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.r);
      ctx.drawImage(img.libro, -26, -22, 52, 44);
      ctx.restore();
    }
    disegnaParticelle();
    // linee di velocità
    if (mondo.vel > 1.25) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.5, (mondo.vel - 1.25) * 0.7)})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const y = 420 + hash(i * 3 + Math.floor(mondo.t * 12)) * 240;
        const x = ((hash(i) * W - mondo.scroll * 2.2) % W + W) % W;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y); ctx.stroke();
      }
    }
    if (mondo.lampo > 0) {
      ctx.fillStyle = `rgba(200,20,10,${mondo.lampo * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
    vignetta();
  }

  function fumetto(x, y, testo) {
    ctx.font = '16px "Press Start 2P", monospace';
    const w = ctx.measureText(testo).width + 28;
    const bx = Math.max(10, Math.min(W - w - 10, x - w / 2));
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#24160c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, y - 22, w, 40, 10) : ctx.rect(bx, y - 22, w, 40);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 17); ctx.lineTo(x + 4, y + 34); ctx.lineTo(x + 10, y + 17); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 5, y + 14, 14, 5);
    ctx.fillStyle = "#b3261e";
    ctx.textBaseline = "middle";
    ctx.fillText(testo, bx + 14, y);
  }

  function vignetta() {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Schermate fisse (titolo, intro, finale) con braci o scintille
  function disegnaFissaAnimata(dt) {
    const fin = mondo.finale;
    const immagine = fin ? img["finale-" + fin.tipo] : img.inizio;
    disegnaFissa(immagine, 1.02 + Math.sin(mondo.t * 0.15) * 0.02);
    const tipo = fin ? fin.tipo : "fiamme";
    if (tipo === "fiamme" && Math.random() < 0.7) particella(Math.random() * W, H + 10, "scintilla");
    if (tipo === "vittoria" && Math.random() < 0.3) particella(Math.random() * W, H * 0.7, "stella");
    for (const p of mondo.particelle) if (p.tipo === "scintilla") p.vy -= 30 * dt;
    aggiornaParticelle(dt, 0);
    disegnaParticelle();
    vignetta();
  }

  // ---------------------------------------------------------------
  //  Ciclo principale
  // ---------------------------------------------------------------
  let ultimo = performance.now();
  function ciclo(ora) {
    const dt = Math.min(0.05, (ora - ultimo) / 1000);
    ultimo = ora;
    mondo.t += dt;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    if (mondo.stato === "corsa") {
      aggiornaCorsa(dt);
      disegnaCorsa();
      aggiornaHud();
    } else {
      disegnaFissaAnimata(dt);
    }
    mondo.velo += (mondo.veloObiettivo - mondo.velo) * Math.min(1, dt * 5);
    if (mondo.velo > 0.01) {
      ctx.fillStyle = `rgba(0,0,0,${mondo.velo})`;
      ctx.fillRect(0, 0, W, H);
    }
    requestAnimationFrame(ciclo);
  }
  requestAnimationFrame(ciclo);

  // ---------------------------------------------------------------
  //  Interfaccia: HUD, banner, pergamena
  // ---------------------------------------------------------------
  $("tot-domande").textContent = DOMANDE.length;
  function aggiornaHud() {
    const d = Math.max(0, Math.min(100, mondo.Dv));
    $("barra-segno").style.left = d + "%";
    $("barra-pieno").style.width = 100 - d + "%";
    $("n-libri").textContent = mondo.libri;
  }

  function banner(piccolo, grande, colore = "") {
    const b = $("banner");
    b.className = "nascosto";
    void b.offsetWidth;
    $("banner-piccolo").textContent = piccolo;
    $("banner-grande").textContent = grande;
    b.className = colore ? colore + " esito" : "";
  }

  const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
  const velo = async (v, ms = 500) => { mondo.veloObiettivo = v; await attendi(ms); };

  let scelte = []; // pulsanti attivi per la tastiera
  const LETTERE = ["A", "B", "C", "D"];

  // Mostra la pergamena; restituisce l'indice del pulsante scelto
  function dialogo(testo, umore, pulsanti, opz = {}) {
    const p = $("pergamena");
    p.classList.remove("nascosto");
    p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
    const r = $("ritratto");
    r.className = umore === "normale" ? "" : umore;
    $("ritratto-img").src = RITRATTI[umore] || RITRATTI.normale;
    $("intestazione").textContent = opz.intestazione || "Abate Stefano II";
    const t = $("testo");
    t.textContent = testo;
    if (opz.nota) {
      const n = document.createElement("span");
      n.className = "giusta-era";
      n.textContent = opz.nota;
      t.appendChild(n);
    }
    const box = $("opzioni");
    box.innerHTML = "";
    box.className = opz.risposte ? "risposte" : "";
    return new Promise((risolvi) => {
      scelte = pulsanti.map((etichetta, i) => {
        const b = document.createElement("button");
        if (opz.risposte) {
          b.className = "opzione";
          const l = document.createElement("span");
          l.className = "lettera";
          l.textContent = LETTERE[i];
          b.appendChild(l);
          b.appendChild(document.createTextNode(etichetta));
        } else {
          b.className = "avanti";
          b.textContent = etichetta;
        }
        b.addEventListener("click", () => {
          if (!scelte.length) return;
          scelte = [];
          box.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          risolvi(i);
        });
        box.appendChild(b);
        return { b, etichetta: etichetta.toLowerCase() };
      });
    });
  }
  function chiudiPergamena() { $("pergamena").classList.add("nascosto"); scelte = []; }

  document.addEventListener("keydown", (e) => {
    if (!scelte.length) {
      if ((e.key === "Enter" || e.key === " ") && !$("titolo").classList.contains("nascosto")) $("btn-inizia").click();
      return;
    }
    const tasto = e.key.toLowerCase();
    let i = -1;
    if (["a", "b", "c", "d"].includes(tasto) && scelte.length > 1) i = "abcd".indexOf(tasto);
    else if (["1", "2", "3", "4"].includes(tasto)) i = Number(tasto) - 1;
    else if (tasto === "v") i = scelte.findIndex((s) => s.etichetta === "vero");
    else if (tasto === "f") i = scelte.findIndex((s) => s.etichetta === "falso");
    else if (tasto === "s") i = scelte.findIndex((s) => s.etichetta === "sì");
    else if (tasto === "n") i = scelte.findIndex((s) => s.etichetta === "no");
    else if ((tasto === "enter" || tasto === " ") && scelte.length === 1) i = 0;
    if (i >= 0 && i < scelte.length) { e.preventDefault(); scelte[i].b.click(); }
  });

  // ---------------------------------------------------------------
  //  Svolgimento della partita
  // ---------------------------------------------------------------
  function perdiLibro() {
    if (mondo.libri <= 0) return;
    mondo.libri -= 1;
    const { gx } = posizioni();
    const pos = posizioneLibro(mondo.libri, gx, SUOLO - 84);
    mondo.libriVolanti.push({ x: pos.x + 20, y: pos.y - 20, vx: -260, vy: -620, r: 0, vr: -9, aTerra: false });
  }

  function cambiaTappa(n) {
    mondo.tappaPrec = mondo.tappa;
    mondo.tappa = n;
    mondo.dissolvenza = 0;
    musica("tappa" + n);
    banner("TAPPA " + n, TAPPE[n - 1].nome.toUpperCase());
  }

  async function partita() {
    azzeraMondo();
    $("finale").classList.add("nascosto");
    $("hud").classList.add("nascosto");
    mondo.stato = "intro";
    mondo.particelle = [];
    musica("intro");
    await velo(0, 300);

    for (const riga of INTRO) await dialogo(riga, "normale", ["Avanti ▶"]);
    const si = await dialogo(DOMANDA_INIZIALE, "normale", ["Sì", "No"], { risposte: true });
    if (si === 0) {
      suona("giusto", 0.6);
      await dialogo(RISPOSTA_SI, "felice", ["Partiamo! ▶"]);
    } else {
      suona("risata");
      await dialogo(RISPOSTA_NO, "arrabbiato", ["Va bene... ▶"]);
    }
    chiudiPergamena();

    // inizio della fuga
    await velo(1, 450);
    mondo.stato = "corsa";
    mondo.particelle = [];
    mondo.tappa = DOMANDE[0].tappa;
    mondo.tappaPrec = mondo.tappa;
    $("hud").classList.remove("nascosto");
    $("n-domanda").textContent = 1;
    musica("tappa" + mondo.tappa);
    await velo(0, 400);
    mondo.grido = 2.2;
    mondo.testoGrido = "PRENDETELI!";
    banner("TAPPA " + mondo.tappa, TAPPE[mondo.tappa - 1].nome.toUpperCase());
    await attendi(2000);
    await dialogo(ISTRUZIONI_CORSA, "normale", ["Via! ▶"]);
    chiudiPergamena();

    for (let i = 0; i < DOMANDE.length; i++) {
      const q = DOMANDE[i];
      $("n-domanda").textContent = i + 1;
      if (q.tappa !== mondo.tappa) {
        cambiaTappa(q.tappa);
        await attendi(2600);
      }
      await attendi(i === 0 ? 900 : 1800);

      mondo.inseguimento = true;
      mondo.prossimaRimonta = 4 + Math.random() * 3;
      const scelta = await dialogo(q.testo, "normale", q.opzioni, {
        risposte: true,
        intestazione: `Domanda ${i + 1} di ${DOMANDE.length}`,
      });
      mondo.inseguimento = false;
      const bottoni = $("opzioni").querySelectorAll("button");
      const giusta = scelta === q.giusta;
      bottoni[q.giusta].classList.add("corretta");
      if (!giusta) bottoni[scelta].classList.add("errata");

      if (giusta) {
        mondo.corrette++;
        mondo.D = Math.min(100, mondo.D + PASSO_DISTACCO);
        mondo.vel = 2.1;
        suona("giusto");
        banner("", "GIUSTO!", "verde");
        for (let s = 0; s < 14; s++) particella(posizioni().gx - 80 + Math.random() * 120, SUOLO - 60, "stella");
      } else {
        mondo.sbagliate++;
        mondo.D = Math.max(0, mondo.D - PASSO_DISTACCO);
        mondo.vel = 0.55;
        mondo.lampo = 1;
        mondo.grido = 1.8;
        mondo.testoGrido = ["FERMATELI!", "PRESTO!", "SONO NOSTRI!", "AVANTI!"][i % 4];
        suona("sbagliato");
        banner("", "SBAGLIATO!", "rosso");
        perdiLibro();
      }
      await attendi(1100);

      if (giusta) {
        await dialogo(q.bravo, "felice", ["Avanti ▶"]);
      } else {
        const fine = dialogo(q.sbagliato, "arrabbiato", ["Avanti ▶"], {
          nota: "Risposta giusta: " + q.opzioni[q.giusta],
        });
        if (q.suono) { await attendi(1200); suona(q.suono); }
        await fine;
      }
      chiudiPergamena();
    }

    await finale();
  }

  async function finale() {
    const c = mondo.corrette;
    const fin = FINALI.find((f) => c >= f.minimo) || FINALI[FINALI.length - 1];
    mondo.inseguimento = false;
    $("hud").classList.add("nascosto");
    await attendi(600);

    if (fin.tipo === "fiamme") {
      mondo.D = 0;
      mondo.grido = 3;
      mondo.testoGrido = "PRESI!";
      await attendi(1300);
      mondo.cattura = true;
      mondo.vel = 0.3;
      await attendi(700);
      suona("esplosione");
      mondo.lampo = 1.5;
      await attendi(500);
    } else {
      if (fin.tipo === "vittoria") mondo.D = 140;
      mondo.vel = 1.8;
      await attendi(1200);
      const parti = performance.now();
      await new Promise((ok) => {
        const corri = () => {
          mondo.uscita = (performance.now() - parti) * 0.55;
          if (mondo.uscita > 700) ok(); else requestAnimationFrame(corri);
        };
        corri();
      });
    }

    await velo(1, 700);
    musica(null);
    mondo.stato = "finale";
    mondo.finale = fin;
    mondo.particelle = [];
    await velo(0, 600);

    suona(fin.tipo === "vittoria" ? "vittoria" : fin.tipo === "quasi" ? "magia" : "esplosione");
    const umore = fin.tipo === "vittoria" ? "felice" : fin.tipo === "quasi" ? "normale" : "arrabbiato";
    dialogo(fin.testo, umore, []);
    $("finale-titolo").textContent = fin.titolo;
    $("finale-punteggio").textContent = `Inni salvati: ${c} su ${DOMANDE.length}`;
    $("finale").classList.remove("nascosto");
  }

  // ---------------------------------------------------------------
  //  Avvio
  // ---------------------------------------------------------------
  const btnInizia = $("btn-inizia");
  btnInizia.disabled = true;
  btnInizia.textContent = "CARICAMENTO...";
  Promise.all(caricamenti).then(() => {
    btnInizia.disabled = false;
    btnInizia.textContent = "▶ INIZIA";
  });

  btnInizia.addEventListener("click", () => {
    if (btnInizia.disabled) return;
    sbloccaAudio();
    $("titolo").classList.add("nascosto");
    partita();
  });
  $("btn-rigioca").addEventListener("click", () => {
    chiudiPergamena();
    partita();
  });

  // Modalità di prova per l'insegnante: index.html?prova=finale-vittoria
  window.__mondo = mondo;
  window.__musica = () => (musicaCorrente ? musicaCorrente.src.split("/").pop() + (musicaCorrente.paused ? " (ferma)" : "") : "nessuna");
})();
