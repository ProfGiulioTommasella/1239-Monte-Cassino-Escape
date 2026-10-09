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
    caricaImmagine("libro", "assets/img/libro.png"),
  ];

  // ---------------------------------------------------------------
  //  Suoni
  // ---------------------------------------------------------------
  const NOMI_SUONI = ["colpo", "crollo", "giusto", "sbagliato", "esplosione", "vittoria", "magia", "russare", "risata"];
  const suoni = {};
  NOMI_SUONI.forEach((n) => {
    const a = new Audio(`assets/audio/${n}.mp3`);
    a.preload = "auto";
    suoni[n] = a;
  });
  // musiche di sottofondo: una per l'introduzione e una per ogni tappa
  const VOLUME_MUSICA = 0.18; // musica molto bassa, sotto gli effetti sonori
  const musiche = {};
  [["intro", MUSICA_INTRO], ...TAPPE.map((t, i) => ["tappa" + (i + 1), t.musica])].forEach(([nome, src]) => {
    if (!src) return;
    const a = new Audio(src);
    a.preload = "auto";
    a.loop = true;
    musiche[nome] = a;
  });
  const tuttiGliAudio = () => [...Object.values(suoni), ...Object.values(musiche)];
  // musica ed effetti si spengono separatamente; la scelta resta per le partite successive
  const leggi = (k) => { try { return localStorage.getItem(k) === "1"; } catch (e) { return false; } };
  const scrivi = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch (e) { /* niente */ } };
  let mutoMusica = leggi("mce-muto-musica");
  let mutoEffetti = leggi("mce-muto-effetti");
  const mutoPer = (a) => (Object.values(musiche).includes(a) ? mutoMusica : mutoEffetti);
  let audioSbloccato = false;
  let musicaCorrente = null;

  function sbloccaAudio() {
    if (audioSbloccato) return;
    audioSbloccato = true;
    tuttiGliAudio().forEach((a) => {
      a.muted = true;
      const p = a.play();
      const ferma = () => { if (a !== musicaCorrente) { a.pause(); a.currentTime = 0; } a.muted = mutoPer(a); };
      if (p && p.then) p.then(ferma).catch(() => { a.muted = mutoPer(a); });
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
      a.muted = mutoEffetti;
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
      nuova.muted = mutoMusica;
      nuova.volume = 0;
      const p = nuova.play();
      if (p && p.catch) p.catch(() => {});
      sfuma(nuova, 0, VOLUME_MUSICA, 1500);
    }
  }
  function aggiornaPulsantiAudio() {
    $("btn-musica").classList.toggle("spento", mutoMusica);
    $("btn-musica").title = mutoMusica ? "Accendi la musica" : "Spegni la musica";
    $("btn-audio").classList.toggle("spento", mutoEffetti);
    $("btn-audio").textContent = mutoEffetti ? "🔇" : "🔊";
    $("btn-audio").title = mutoEffetti ? "Accendi gli effetti sonori" : "Spegni gli effetti sonori";
    tuttiGliAudio().forEach((a) => { a.muted = mutoPer(a); });
  }
  $("btn-musica").addEventListener("click", () => {
    mutoMusica = !mutoMusica;
    scrivi("mce-muto-musica", mutoMusica);
    aggiornaPulsantiAudio();
  });
  $("btn-audio").addEventListener("click", () => {
    mutoEffetti = !mutoEffetti;
    scrivi("mce-muto-effetti", mutoEffetti);
    aggiornaPulsantiAudio();
  });
  aggiornaPulsantiAudio();
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
    mini: null, // minigioco in corso
    salto: 0, // altezza del salto del carretto
    vSalto: 0,
    incl: 0, // inclinazione del carretto in aria
    chino: 0, // 0 = in piedi, 1 = testa abbassata
    abbassaFino: 0,
    urto: 0,
  };

  function azzeraMondo() {
    Object.assign(mondo, {
      scroll: 0, vel: 1, D: DISTACCO_INIZIALE, Dv: DISTACCO_INIZIALE,
      tappa: 1, tappaPrec: 1, dissolvenza: 1, libri: DOMANDE.length,
      libriVolanti: [], particelle: [], uscita: 0, cattura: false,
      inseguimento: false, prossimaRimonta: 9, scatto: 0, passoSoldati: 0,
      lampo: 0, grido: 0, finale: null, corrette: 0, sbagliate: 0, daRipassare: [],
      mini: null, salto: 0, vSalto: 0, incl: 0, chino: 0, abbassaFino: 0, urto: 0,
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
  const sfondi = creaSfondi(ctx, W, hash);

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

  // posa: "traino" (tira il carretto), "porta" (regge un libro); fermo: in piedi senza correre
  function disegnaMonaco(x, fase, umore, posa = "traino", fermo = false) {
    const G = SUOLO;
    const bob = fermo ? 0 : -Math.abs(Math.sin(fase)) * 5;
    const anca = { x: x + 2, y: G - 54 + bob };
    const piedeFermo = (dx) => ({ gx: anca.x + dx * 0.5, gy: anca.y + 27, px: anca.x + dx, py: anca.y + 53 });
    // gamba dietro
    const g2 = fermo ? piedeFermo(-8) : gamba(anca.x, anca.y, fase + Math.PI, 27);
    arto(anca.x, anca.y, g2.gx, g2.gy, 9, "#d9a86f");
    arto(g2.gx, g2.gy, g2.px, g2.py, 8, "#d9a86f");
    poligono([[g2.px - 6, g2.py - 3], [g2.px + 12, g2.py - 1], [g2.px + 12, g2.py + 4], [g2.px - 6, g2.py + 4]], "#4a2f1b", "#24160c", 2);
    // braccio dietro (tira la stanga)
    if (posa === "traino") {
      arto(x + 4, G - 108 + bob, x - 40, G - 76, 13, SAIO_SCURO);
      cerchio(x - 40, G - 76, 6, PELLE, "#24160c", 2);
    }
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
    const g1 = fermo ? piedeFermo(8) : gamba(anca.x, anca.y, fase, 27);
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
    // braccia in avanti che reggono un libro
    if (posa === "porta") {
      if (img.libro && img.libro.naturalWidth) ctx.drawImage(img.libro, x + 18, G - 112 + bob, 46, 38);
      arto(x + 2, G - 108 + bob, x + 34, G - 86 + bob, 13, SAIO_SCURO);
      cerchio(x + 38, G - 86 + bob, 6, PELLE, "#24160c", 2);
    } else if (posa === "vuote") {
      const osc = fermo ? 0 : Math.sin(fase) * 14;
      arto(x + 2, G - 108 + bob, x + 6 + osc, G - 74 + bob, 13, SAIO_SCURO);
      cerchio(x + 7 + osc, G - 70 + bob, 6, PELLE, "#24160c", 2);
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
    else if (tipo === "ariete") arto(-4, G - 108 + bob, 20, G - 84, 10, "#6f747b");
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
    } else if (tipo === "ariete") {
      // braccia in avanti che reggono la trave
      arto(6, G - 108 + bob, 30, G - 84, 10, MAGLIA);
      cerchio(32, G - 84, 5.5, "#e9b384", "#24160c", 2);
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
    aggiornaMinigioco(dt, velStrada);
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
    const disegnaTappa = (n) => sfondi.tappe[(n - 1) % sfondi.tappe.length](mondo.scroll, mondo.t, mondo.scrollTappa);
    if (mondo.dissolvenza < 1) {
      disegnaTappa(mondo.tappaPrec);
      ctx.globalAlpha = mondo.dissolvenza;
      disegnaTappa(mondo.tappa);
      ctx.globalAlpha = 1;
    } else {
      disegnaTappa(mondo.tappa);
    }
    disegnaStrada();

    const { gx, capo } = posizioni();
    const fase = mondo.scroll / 34;
    disegnaOstacoli();
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
    // ombra a terra durante il salto
    if (mondo.salto > 1) {
      ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.max(0.3, 1 - mondo.salto / 260)})`;
      ctx.beginPath(); ctx.ellipse(gx - 100, SUOLO + 2, 150 * (1 - mondo.salto / 700), 10, 0, 0, Math.PI * 2); ctx.fill();
    }
    const scossa = mondo.urto > 0 ? Math.sin(mondo.t * 60) * 6 * mondo.urto : 0;
    ctx.save();
    ctx.translate(scossa, -mondo.salto);
    // in aria il carretto ruota attorno alle stanghe: sale con il retro basso, scende con il retro alto
    const incl = mondo.incl;
    if (Math.abs(incl) > 0.002) {
      ctx.save();
      ctx.translate(gx - 40, SUOLO - 76); ctx.rotate(incl); ctx.translate(-(gx - 40), -(SUOLO - 76));
      disegnaCarretto(gx, fase);
      ctx.restore();
      // anche l'Abate segue un po' la curva
      ctx.translate(gx, SUOLO); ctx.rotate(incl * 0.35); ctx.translate(-gx, -SUOLO);
    } else disegnaCarretto(gx, fase);
    const umore = mondo.urto > 0 || mondo.Dv < 22 ? "paura" : mondo.vel > 1.3 ? "felice" : "normale";
    if (mondo.chino > 0.01) {
      // il monaco si abbassa piegandosi in avanti
      const c = mondo.chino;
      ctx.translate(gx, SUOLO);
      ctx.rotate(0.28 * c);
      ctx.scale(1 + 0.06 * c, 1 - 0.3 * c);
      ctx.translate(-gx, -SUOLO);
    }
    disegnaMonaco(gx, fase, umore);
    ctx.restore();
    disegnaLance();
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

  // ---------------------------------------------------------------
  //  Minigiochi d'azione: saltare gli ostacoli, schivare le lance
  // ---------------------------------------------------------------
  const SALTO_SPINTA = 820;
  const GRAVITA_SALTO = 1650;
  // ostacoli del sentiero: larghezza e altezza decidono quando serve saltare
  const TIPI_OSTACOLO = [
    { nome: "masso", w: 64, h: 46 },
    { nome: "tronco", w: 86, h: 40 },
    { nome: "botte", w: 48, h: 54 },
    { nome: "sassi", w: 72, h: 32 },
  ];

  function testaMonaco() {
    const { gx } = posizioni();
    return { x: gx + 22, y: SUOLO - 138 };
  }

  function azione() {
    const m = mondo.mini;
    if (!m || !m.attivo) return;
    if (m.tipo === "salto") {
      if (mondo.salto <= 0.5) { mondo.vSalto = SALTO_SPINTA; mondo.salto = 1; }
    } else {
      mondo.abbassaFino = mondo.t + 0.75;
    }
  }

  function aggiornaMinigioco(dt, velStrada) {
    // salto e chinata (anche fuori dal minigioco, per finire il movimento)
    if (mondo.salto > 0 || mondo.vSalto > 0) {
      mondo.vSalto -= GRAVITA_SALTO * dt;
      mondo.salto += mondo.vSalto * dt;
      if (mondo.salto <= 0) {
        mondo.salto = 0; mondo.vSalto = 0;
        const { gx } = posizioni();
        for (let i = 0; i < 8; i++) particella(gx - 160 + Math.random() * 180, SUOLO - 4, "polvere");
      }
    }
    // inclinazione: muso in su salendo, in giù scendendo; la ruota non affonda mai nel terreno
    let inclObiettivo = 0;
    if (mondo.salto > 0) {
      inclObiettivo = Math.max(-0.26, Math.min(0.2, -0.26 * mondo.vSalto / SALTO_SPINTA));
      if (inclObiettivo < 0) inclObiettivo = Math.max(inclObiettivo, -mondo.salto / 115);
    }
    mondo.incl += (inclObiettivo - mondo.incl) * Math.min(1, dt * (mondo.salto > 0 ? 9 : 14));
    const chinoObiettivo = mondo.t < mondo.abbassaFino ? 1 : 0;
    mondo.chino += (chinoObiettivo - mondo.chino) * Math.min(1, dt * 16);
    mondo.urto = Math.max(0, mondo.urto - dt * 2.5);
    const m = mondo.mini;
    if (!m) return;
    const { gx, capo } = posizioni();

    // nuovi ostacoli o lance
    if (m.attivo && m.lanciati < m.quanti) {
      m.prossimo -= dt;
      if (m.prossimo <= 0) {
        m.lanciati++;
        const r = Math.random();
        if (m.tipo === "salto") {
          // intervalli imprevedibili: a volte a raffica, a volte una lunga pausa (mai meno del tempo di un salto)
          m.prossimo = r < 0.3 ? 1.15 + Math.random() * 0.2 : r < 0.75 ? 1.5 + Math.random() * 0.7 : 2.4 + Math.random() * 0.9;
          let t;
          do t = TIPI_OSTACOLO[Math.floor(Math.random() * TIPI_OSTACOLO.length)]; while (t.nome === m.ultimoTipo);
          m.ultimoTipo = t.nome;
          m.oggetti.push({ x: W + 60, w: t.w, h: t.h, tipo: t.nome, seme: Math.random() * 100, colpito: false, superato: false });
        } else {
          // il lanciere grida e poi tira dopo un'attesa che cambia ogni volta
          m.prossimo = r < 0.25 ? 0.9 + Math.random() * 0.3 : r < 0.7 ? 1.6 + Math.random() * 0.9 : 2.8 + Math.random() * 1.0;
          const inAttesa = m.oggetti.filter((o) => o.stato === "pronta").map((o) => o.attesa);
          const attesa = Math.max(0.4 + Math.random() * 0.9, inAttesa.length ? Math.max(...inAttesa) + 0.45 : 0);
          mondo.grido = 1.1;
          mondo.testoGrido = ["LANCIA!", "PRENDI!", "ECCO!", "ORA!"][Math.floor(Math.random() * 4)];
          m.oggetti.push({ attesa, vel: 620 + Math.random() * 280, x: 0, y: 0, vx: 0, vy: 0, r: 0, stato: "pronta", colpito: false, superato: false });
        }
      }
    }

    for (const o of m.oggetti) {
      if (m.tipo === "salto") {
        o.x -= velStrada * dt;
        if (o.colpito) {
          // l'ostacolo urtato viene sbalzato via all'indietro
          if (o.oy < 0 || o.voy < 0) {
            o.voy += 1800 * dt; o.oy += o.voy * dt; o.x -= 260 * dt; o.rot -= 7 * dt;
            if (o.oy >= 0) { o.oy = 0; o.voy = 0; }
          }
          continue;
        }
        if (o.superato) continue;
        // si urta con la ruota o con i piedi dell'Abate se non si è abbastanza in alto
        const sopra = mondo.salto > o.h * 0.65;
        const tocca = (a, b) => o.x < b && o.x + o.w > a;
        if (!sopra && (tocca(gx - 176, gx - 124) || tocca(gx - 14, gx + 18))) {
          o.colpito = true;
          o.voy = -620; o.oy = -1; o.rot = 0;
          m.colpiti++;
          mondo.D = Math.max(5, mondo.D - 6);
          mondo.urto = 1;
          mondo.lampo = 0.7;
          mondo.vel = 0.6;
          suona("colpo", 0.8);
        } else if (o.x + o.w < gx - 180) {
          o.superato = true;
          m.evitati++;
          mondo.D = Math.min(100, mondo.D + 2);
        }
      } else {
        if (o.stato === "pronta") {
          o.attesa -= dt;
          if (o.attesa <= 0) {
            // parte dalla mano del lanciere verso la testa dell'Abate
            const tm = testaMonaco();
            o.x = Math.max(-40, capo + 30);
            o.y = SUOLO - 235;
            o.vx = o.vel;
            o.vy = ((tm.y - o.y) / (tm.x - o.x)) * o.vel;
            o.r = Math.atan2(o.vy, o.vx);
            o.stato = "volo";
          }
        } else if (o.stato === "volo") {
          const prima = o.x;
          o.x += o.vx * dt;
          o.y += o.vy * dt;
          const tm = testaMonaco();
          if (!o.superato && !o.colpito && prima + 55 < tm.x + 6 && o.x + 55 >= tm.x - 14) {
            if (mondo.chino > 0.55) {
              o.superato = true;
              m.evitati++;
              mondo.D = Math.min(100, mondo.D + 2);
            } else {
              // la lancia colpisce di piatto il cappuccio e rimbalza indietro
              o.colpito = true;
              m.colpiti++;
              o.stato = "caduta";
              o.vx = -220; o.vy = -380;
              mondo.D = Math.max(5, mondo.D - 6);
              mondo.urto = 1;
              mondo.lampo = 0.7;
              mondo.vel = 0.6;
              suona("sbagliato", 0.7);
            }
          }
          if (o.y + Math.sin(o.r) * 55 >= SUOLO - 8 && o.x > tm.x) o.stato = "piantata";
        } else if (o.stato === "caduta") {
          o.vy += 1800 * dt;
          o.x += o.vx * dt;
          o.y += o.vy * dt;
          o.r += 9 * dt;
          if (o.y > SUOLO - 6) { o.y = SUOLO - 6; o.r = 0.05; o.stato = "terra"; }
        } else {
          o.x -= velStrada * dt;
        }
      }
    }
    m.oggetti = m.oggetti.filter((o) => o.x > -260 && o.x < W + 400);
  }

  function disegnaOstacoli() {
    const m = mondo.mini;
    if (!m || m.tipo !== "salto") return;
    for (const o of m.oggetti) {
      const y = SUOLO + 4;
      const k = (i) => hash(o.seme + i);
      // ombra a terra (resta giù anche quando l'ostacolo vola via)
      if (!o.colpito || o.oy > -30) {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, y, o.w / 2 + 10, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      if (o.colpito) {
        const cx = o.x + o.w / 2, cy = y - o.h / 2;
        ctx.translate(cx, cy + o.oy); ctx.rotate(o.rot); ctx.translate(-cx, -cy);
      }
      const x = o.x, w = o.w, h = o.h;
      if (o.tipo === "tronco") {
        // tronco abbattuto di traverso, con la sezione verso il monaco
        const r = h / 2, cy = y - r;
        poligono([[x + r * 0.6, y], [x + w - r, y], [x + w - r, y - h], [x + r * 0.6, y - h]], "#6e4220");
        ctx.beginPath(); ctx.ellipse(x + r * 0.6, cy, r * 0.6, r, 0, Math.PI / 2, Math.PI * 1.5); ctx.fillStyle = "#6e4220"; ctx.fill();
        ctx.strokeStyle = "#24160c"; ctx.lineWidth = 3; ctx.stroke();
        // corteccia
        ctx.strokeStyle = "#4a2c12"; ctx.lineWidth = 3; ctx.lineCap = "round";
        for (let i = 0; i < 4; i++) {
          const yy = y - h + 8 + i * 8 + k(i) * 3;
          ctx.beginPath(); ctx.moveTo(x + 10 + k(i + 5) * 12, yy); ctx.lineTo(x + w - r - 8 - k(i + 9) * 14, yy + 1); ctx.stroke();
        }
        ctx.fillStyle = "#8c5a2e"; ctx.fillRect(x + r * 0.6, y - h + 2, w - r * 1.6, 5);
        // sezione con gli anelli
        cerchio(x + w - r, cy, r, "#e0b070");
        ctx.strokeStyle = "#a8743c"; ctx.lineWidth = 2;
        for (const f of [0.68, 0.42, 0.18]) { ctx.beginPath(); ctx.arc(x + w - r, cy, r * f, 0, Math.PI * 2); ctx.stroke(); }
        // muschio e rametto con foglie
        ctx.fillStyle = "#5c8a34";
        ctx.beginPath(); ctx.ellipse(x + w * 0.4, y - h + 1, 16, 5, 0, Math.PI, 0); ctx.fill();
        arto(x + 22, y - h + 3, x + 12, y - h - 18, 5, "#6e4220");
        cerchio(x + 10, y - h - 22, 8, "#4f7a32", "#24160c", 2.5);
        cerchio(x + 20, y - h - 25, 6, "#6a9a40", "#24160c", 2.5);
      } else if (o.tipo === "botte") {
        // botte rovesciata in piedi, con doghe e cerchi di ferro
        const pancia = 5;
        ctx.beginPath();
        ctx.moveTo(x + 4, y); ctx.quadraticCurveTo(x - pancia, y - h / 2, x + 4, y - h);
        ctx.lineTo(x + w - 4, y - h); ctx.quadraticCurveTo(x + w + pancia, y - h / 2, x + w - 4, y);
        ctx.closePath();
        ctx.fillStyle = "#9a6232"; ctx.fill();
        ctx.lineJoin = "round"; ctx.strokeStyle = "#24160c"; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = "#6e4220"; ctx.lineWidth = 2;
        for (const f of [0.3, 0.5, 0.7]) { ctx.beginPath(); ctx.moveTo(x + w * f, y - h + 3); ctx.lineTo(x + w * f, y - 3); ctx.stroke(); }
        ctx.fillStyle = "#c08850"; ctx.fillRect(x + 8, y - h + 5, 6, h - 10);
        for (const f of [0.18, 0.82]) {
          ctx.fillStyle = "#4a4e55"; ctx.fillRect(x + 1, y - h * f - 3, w - 2, 7);
          ctx.strokeStyle = "#24160c"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y - h * f - 3, w - 2, 7);
        }
        // coperchio visto appena dall'alto
        ctx.beginPath(); ctx.ellipse(x + w / 2, y - h, w / 2 - 4, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#7a4a22"; ctx.fill(); ctx.strokeStyle = "#24160c"; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (o.tipo === "sassi") {
        // mucchio di sassi
        const sasso = (cx, cy, rx, ry, c, i) => {
          const pts = [];
          for (let a = 0; a < 7; a++) {
            const ang = (a / 7) * Math.PI * 2, f = 0.85 + k(i * 7 + a) * 0.25;
            pts.push([cx + Math.cos(ang) * rx * f, Math.min(y, cy + Math.sin(ang) * ry * f)]);
          }
          poligono(pts, c);
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.beginPath(); ctx.ellipse(cx - rx * 0.25, cy - ry * 0.45, rx * 0.35, ry * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
        };
        sasso(x + 18, y - 12, 18, 13, "#7d766c", 1);
        sasso(x + w - 18, y - 13, 19, 14, "#8f877c", 2);
        sasso(x + w / 2, y - h + 9, 17, 12, "#a39a8c", 3);
        ctx.strokeStyle = "#5c8a34"; ctx.lineWidth = 3; ctx.lineCap = "round";
        for (const d of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x + w + 6, y); ctx.lineTo(x + w + 6 + d, y - 12 + Math.abs(d)); ctx.stroke(); }
      } else {
        // masso con faccia in luce, crepa e ciuffi d'erba
        const j = (i) => k(i) * 7;
        const pts = [[x, y], [x + 3 + j(1), y - h * 0.5], [x + 14, y - h + j(2) * 0.6], [x + 34, y - h - 2],
          [x + w - 10, y - h * 0.72 + j(3) * 0.5], [x + w, y - h * 0.3], [x + w + 2, y]];
        poligono(pts, "#8a8277");
        poligono([[x + 14, y - h + j(2) * 0.6 + 2], [x + 34, y - h + 1], [x + w - 12, y - h * 0.7 + j(3) * 0.5], [x + 30, y - h * 0.55]], "#aaa192", null);
        ctx.fillStyle = "#6c655c";
        poligono([[x + w - 14, y - h * 0.6], [x + w - 2, y - h * 0.3], [x + w, y - 2], [x + w - 22, y - 2]], "#6c655c", null);
        ctx.strokeStyle = "#24160c"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 32, y - h + 6); ctx.lineTo(x + 26, y - h * 0.55); ctx.lineTo(x + 32, y - h * 0.3); ctx.stroke();
        ctx.fillStyle = "#5c8a34";
        ctx.beginPath(); ctx.ellipse(x + 26, y - h + 3, 11, 4, -0.2, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = "#4f7a32"; ctx.lineWidth = 3; ctx.lineCap = "round";
        for (const d of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 4 + d, y - 11 + Math.abs(d)); ctx.stroke(); }
      }
      ctx.restore();
    }
  }

  function disegnaLance() {
    const m = mondo.mini;
    if (!m || m.tipo !== "lance") return;
    for (const o of m.oggetti) {
      if (o.stato === "pronta") continue;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.r);
      // asta e punta di ferro (la punta è a +55 dal centro)
      arto(-55, 0, 38, 0, 5, "#8b5a2b");
      poligono([[36, -6], [60, 0], [36, 6]], "#c9ced6", "#24160c", 2.5);
      ctx.restore();
    }
    // punto esclamativo sopra l'Abate quando sta per arrivare una lancia
    if (m.oggetti.some((o) => o.stato === "pronta" || (o.stato === "volo" && !o.superato && !o.colpito))) {
      const tm = testaMonaco();
      const pulsa = 1 + Math.sin(mondo.t * 18) * 0.12;
      ctx.save();
      ctx.translate(tm.x + 4, tm.y - 58 - mondo.salto);
      ctx.scale(pulsa, pulsa);
      ctx.font = '28px "Press Start 2P", monospace';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 6; ctx.strokeStyle = "#24160c"; ctx.strokeText("!", 0, 0);
      ctx.fillStyle = "#ff5a3c"; ctx.fillText("!", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
    }
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

  // Personaggi nelle scene finali: il carretto con i libri rimasti
  function disegnaScenaFinale(tipo) {
    const gx = 330;
    if (tipo === "fiamme") {
      disegnaCarretto(gx, 0);
      for (let i = 0; i < 6; i++) sfondi.fiamma(gx - 210 + i * 26, SUOLO - 80, 1 + hash(i) * 0.6, mondo.t, i);
      disegnaSoldato(gx + 60, SUOLO, 1, 0.4, "torcia");
      disegnaSoldato(gx - 270, SUOLO - 6, 0.95, 2.2, "lancia");
      if (Math.random() < 0.5) particella(gx - 150 + Math.random() * 120, SUOLO - 120, "scintilla");
    } else {
      disegnaCarretto(gx, 0);
      disegnaMonaco(gx, 0, tipo === "vittoria" ? "felice" : "normale", "traino", true);
    }
  }

  // Schermate fisse (titolo, intro, finale) con braci o scintille
  function disegnaFissaAnimata(dt) {
    const fin = mondo.finale;
    const tipo = fin ? fin.tipo : "fiamme";
    if (fin) sfondi[fin.tipo](mondo.t);
    else sfondi.inizio(mondo.t);
    if (fin) disegnaScenaFinale(fin.tipo);
    if (tipo === "fiamme" && Math.random() < 0.7) particella(Math.random() * W, H + 10, "scintilla");
    if (tipo === "vittoria" && Math.random() < 0.3) particella(Math.random() * W, H * 0.7, "stella");
    for (const p of mondo.particelle) if (p.tipo === "scintilla") p.vy -= 30 * dt;
    aggiornaParticelle(dt, 0);
    disegnaParticelle();
    vignetta();
  }

  // ---------------------------------------------------------------
  //  Scena iniziale, in spaccato: a destra i soldati battono l'ariete sul portone,
  //  a sinistra l'Abate fa avanti e indietro dallo scriptorium per caricare i codici
  // ---------------------------------------------------------------
  const SCAFFALE_X = 196; // dove l'Abate prende i codici
  const PILA_X = 70; // codici ancora da caricare, a terra davanti allo scaffale
  const LANCIO_X = 600; // dove si ferma per gettarli sul carretto
  const CARRO_X = 540; // muso del carretto (girato verso sinistra, la via di fuga)
  const PORTONE_X = 981; // portone, sul lato esterno della torre
  const scena = {};
  function azzeraScena() {
    Object.assign(scena, {
      periodoColpo: 2,
      prossimoColpo: 2.2,
      scossa: 0,
      bum: 0,
      porta: "chiusa",
      caduta: 0, // rotazione del portone che crolla
      ariete: 0, // arretramento dell'ariete
      assi: [],
      soldati: [],
      prossimoSoldato: 0,
      libri: 7,
      libroVolo: null,
      monaco: { x: LANCIO_X, dir: -1, carica: false, sosta: 0.3, fase: 0, stato: "carica" },
      gx: CARRO_X,
      vFuga: 0,
      esclama: 0,
      tremore: 0,
    });
  }
  azzeraScena();

  // disegna fn() specchiato rispetto alla verticale x = cx
  function specchia(cx, fn) {
    ctx.save();
    ctx.translate(cx * 2, 0);
    ctx.scale(-1, 1);
    fn();
    ctx.restore();
  }

  function aggiornaScena(dt) {
    const m = scena.monaco;
    // colpi d'ariete sul portone
    if (scena.porta === "chiusa") {
      scena.prossimoColpo -= dt;
      if (scena.prossimoColpo <= 0) {
        scena.periodoColpo = 1.6 + Math.random() * 0.8;
        scena.prossimoColpo = scena.periodoColpo;
        scena.scossa = 1;
        scena.bum = 1;
        scena.tremore = 0.3;
        suona("colpo", 0.9);
        for (let i = 0; i < 8; i++) particella(PORTONE_X - 20 + Math.random() * 30, SUOLO - Math.random() * 200, "polvere");
      }
      // l'ariete arretra e poi scatta in avanti contro il portone
      const u = 1 - scena.prossimoColpo / scena.periodoColpo;
      scena.ariete = u < 0.75 ? 75 * Math.sin((u / 0.75) * Math.PI * 0.5) : 75 * (1 - (u - 0.75) / 0.25);
    } else {
      scena.caduta = Math.min(Math.PI / 2, scena.caduta + dt * (2 + scena.caduta * 6));
    }
    scena.scossa = Math.max(0, scena.scossa - dt * 4);
    scena.bum = Math.max(0, scena.bum - dt * 1.6);
    scena.tremore = Math.max(0, scena.tremore - dt);
    scena.esclama = Math.max(0, scena.esclama - dt);
    for (const a of scena.assi) {
      a.vy += 1400 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.r += a.vr * dt;
      if (a.y > SUOLO - 6) { a.y = SUOLO - 6; a.vy *= -0.25; a.vx *= 0.6; a.vr *= 0.5; }
    }
    // l'Abate fa avanti e indietro tra lo scriptorium e il carretto
    const pieno = Math.min(11, DOMANDE.length);
    if (m.stato === "carica" || m.stato === "posizione") {
      if (m.sosta > 0) {
        m.sosta -= dt;
      } else {
        const meta = m.stato === "posizione" ? CARRO_X : m.carica ? LANCIO_X : SCAFFALE_X;
        const d = meta - m.x;
        if (Math.abs(d) > 0.5) m.dir = d < 0 ? -1 : 1;
        const passo = Math.sign(d) * Math.min(Math.abs(d), 250 * dt);
        m.x += passo;
        m.fase += Math.abs(passo) / 22;
        if (Math.abs(d) < 1) {
          if (m.stato === "posizione") {
            m.stato = "pronto";
            m.dir = -1;
          } else if (m.carica) {
            // getta il codice sul carretto
            m.carica = false;
            m.sosta = 0.35;
            const p = posizioneLibro(scena.libri, CARRO_X, SUOLO - 84);
            scena.libroVolo = { x: m.x + 30, y: SUOLO - 100, tx: 2 * CARRO_X - (p.x + 20), ty: p.y - 10, t: 0 };
            if (scena.libri + 1 >= pieno) m.stato = "posizione";
          } else {
            // prende un codice dalla pila
            m.carica = true;
            m.sosta = 0.45;
          }
        }
      }
    }
    if (scena.libroVolo) {
      const l = scena.libroVolo;
      l.t += dt * 2.2;
      if (l.t >= 1) {
        scena.libroVolo = null;
        scena.libri = Math.min(pieno, scena.libri + 1);
      }
    }
    // il portone cede e i soldati entrano da destra
    if (scena.porta === "rotta") {
      scena.prossimoSoldato -= dt;
      if (scena.prossimoSoldato <= 0 && scena.soldati.length < FORMAZIONE.length) {
        scena.prossimoSoldato = 0.4;
        const f = FORMAZIONE[scena.soldati.length];
        scena.soldati.push({ x: PORTONE_X + 60, tipo: TIPI_SOLDATO[scena.soldati.length], fase: Math.random() * 6, dy: f.dy, s: f.s });
      }
      for (const sd of scena.soldati) {
        sd.x -= 210 * dt;
        sd.fase += (210 * dt) / 34;
      }
      if (m.stato === "fuga") {
        scena.vFuga = Math.min(420, scena.vFuga + 500 * dt);
        scena.gx -= scena.vFuga * dt;
        m.fase += (scena.vFuga * dt) / 34;
        mondo.scroll += scena.vFuga * dt; // fa girare la ruota
        if (Math.random() < 0.6) particella(scena.gx + 150, SUOLO - 4, "polvere");
      }
    }
    aggiornaParticelle(dt, 0);
  }

  function sfondaPorta() {
    scena.porta = "rotta";
    scena.tremore = 0.8;
    mondo.lampo = 1.2;
    suona("crollo");
    for (let i = 0; i < 10; i++) {
      scena.assi.push({
        x: PORTONE_X - 10 + Math.random() * 20, y: 420 + Math.random() * 180,
        vx: -120 - Math.random() * 280, vy: -300 - Math.random() * 400,
        r: 0, vr: (Math.random() - 0.5) * 14, w: 12 + Math.random() * 8, h: 40 + Math.random() * 40,
      });
    }
    for (let i = 0; i < 25; i++) particella(PORTONE_X - 60 + Math.random() * 100, SUOLO - Math.random() * 220, "polvere");
  }

  // il portone di legno nel varco della torre (crolla verso il cortile)
  function disegnaPortone() {
    const h = 222;
    const dx = scena.porta === "chiusa" ? Math.sin(mondo.t * 70) * 4 * scena.scossa : 0;
    ctx.save();
    ctx.translate(PORTONE_X - 16 + dx, SUOLO);
    ctx.rotate(-scena.caduta);
    poligono([[0, 0], [0, -h], [18, -h], [18, 0]], "#6e4320", "#24160c", 3);
    ctx.fillStyle = "#2b2b2b";
    for (const y of [-h + 26, -h / 2, -30]) ctx.fillRect(-1, y, 20, 10);
    ctx.restore();
    // trave di sbarramento sul lato del cortile
    if (scena.porta === "chiusa") poligono([[PORTONE_X - 30 + dx, SUOLO - 120], [PORTONE_X - 16 + dx, SUOLO - 120], [PORTONE_X - 16 + dx, SUOLO - 100], [PORTONE_X - 30 + dx, SUOLO - 100]], "#4a2c12", "#24160c", 2);
  }

  // fuori: tre soldati con l'ariete (girati verso sinistra)
  function disegnaAriete() {
    const off = scena.porta === "chiusa" ? scena.ariete : 40;
    const fase = scena.porta === "chiusa" ? off / 18 : 0;
    const x0 = PORTONE_X + 4 + off;
    const y = SUOLO - 80;
    if (scena.porta === "rotta") {
      // ariete lasciato a terra
      poligono([[x0 + 30, SUOLO - 2], [x0 + 30, SUOLO - 24], [x0 + 230, SUOLO - 24], [x0 + 230, SUOLO - 2]], "#7a4a22", "#24160c", 3);
      return;
    }
    // trave con la testa di ferro
    poligono([[x0 + 22, y - 12], [x0 + 215, y - 12], [x0 + 215, y + 12], [x0 + 22, y + 12]], "#7a4a22", "#24160c", 3);
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + 40, y - 3); ctx.lineTo(x0 + 200, y - 3); ctx.stroke();
    poligono([[x0, y - 16], [x0 + 26, y - 16], [x0 + 26, y + 16], [x0, y + 16]], "#5e646c", "#24160c", 3);
    for (const [i, dxs] of [[0, 62], [1, 122], [2, 182]]) {
      const sx = x0 + dxs;
      specchia(sx, () => disegnaSoldato(sx, SUOLO + (i === 1 ? -4 : 0), 0.95, fase + i * 1.3, "ariete"));
    }
  }

  // La scena è disegnata con il portone a destra e poi specchiata, così sullo schermo
  // i soldati arrivano da sinistra e l'Abate fugge verso destra, come nella corsa.
  function disegnaScena() {
    ctx.save();
    if (scena.tremore > 0) ctx.translate((Math.random() - 0.5) * 16 * scena.tremore, (Math.random() - 0.5) * 10 * scena.tremore);
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    sfondi.cortile(mondo.t, SUOLO);
    const m = scena.monaco;
    // codici ancora da caricare, a terra nello scriptorium
    const rimasti = Math.max(0, Math.min(11, DOMANDE.length) - scena.libri - (scena.libroVolo ? 1 : 0) - (m.carica && m.stato === "carica" ? 1 : 0));
    for (let i = 0; i < rimasti; i++) {
      const x = PILA_X + (i % 2) * 34;
      const y = SUOLO - 4 - Math.floor(i / 2) * 15;
      poligono([[x, y], [x + 56, y], [x + 56, y - 14], [x, y - 14]], COLORI_LIBRI[(i + 7) % COLORI_LIBRI.length], "#24160c", 2.5);
      ctx.fillStyle = "#f5ecd2"; ctx.fillRect(x + 48, y - 12, 6, 10);
    }
    disegnaAriete();
    disegnaPortone();
    for (const a of scena.assi) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.r);
      poligono([[-a.w / 2, -a.h / 2], [a.w / 2, -a.h / 2], [a.w / 2, a.h / 2], [-a.w / 2, a.h / 2]], "#6e4320", "#24160c", 2);
      ctx.restore();
    }
    // carretto (girato verso sinistra) e Abate
    mondo.libri = scena.libri;
    const davanti = m.stato === "pronto" || m.stato === "fuga";
    const cx = davanti ? scena.gx : CARRO_X;
    specchia(cx, () => {
      disegnaCarretto(cx, 0);
      if (davanti) disegnaMonaco(cx, m.fase, m.stato === "fuga" ? "paura" : "normale", "traino", m.stato === "pronto");
    });
    if (!davanti) {
      const disegna = () => disegnaMonaco(m.x, m.fase, "normale", m.carica ? "porta" : "vuote", m.sosta > 0);
      if (m.dir < 0) specchia(m.x, disegna); else disegna();
    }
    if (scena.libroVolo && img.libro && img.libro.naturalWidth) {
      const l = scena.libroVolo;
      const x = l.x + (l.tx - l.x) * l.t;
      const y = l.y + (l.ty - l.y) * l.t - Math.sin(l.t * Math.PI) * 90;
      ctx.save(); ctx.translate(x, y); ctx.rotate(l.t * 6.3); ctx.drawImage(img.libro, -24, -20, 48, 40); ctx.restore();
    }
    // soldati che irrompono nel cortile
    for (let i = scena.soldati.length - 1; i >= 0; i--) {
      const sd = scena.soldati[i];
      specchia(sd.x, () => disegnaSoldato(sd.x, SUOLO + sd.dy, sd.s, sd.fase, sd.tipo));
    }
    disegnaParticelle();
    ctx.restore();
    // scritte fuori dallo specchio, per leggerle dritte
    if (scena.bum > 0) {
      ctx.save();
      ctx.translate(W - (PORTONE_X - 70), 330);
      ctx.rotate(-0.12);
      ctx.scale(0.8 + scena.bum * 0.5, 0.8 + scena.bum * 0.5);
      ctx.globalAlpha = Math.min(1, scena.bum * 2);
      ctx.font = '40px "Press Start 2P", monospace';
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 8; ctx.strokeStyle = "#000"; ctx.strokeText("BUM!", 0, 0);
      ctx.fillStyle = "#ffcf3a"; ctx.fillText("BUM!", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
    }
    if (scena.esclama > 0) fumetto(W - (scena.gx - 30), SUOLO - 205, "!!!");
    if (scena.soldati.length && scena.soldati[0].x > 560) fumetto(W - (scena.soldati[0].x - 10), SUOLO - 215, "ALL'ASSALTO!");
    ctx.restore();
    if (mondo.lampo > 0) {
      ctx.fillStyle = `rgba(255,200,120,${mondo.lampo * 0.35})`;
      ctx.fillRect(0, 0, W, H);
      mondo.lampo = Math.max(0, mondo.lampo - 0.03);
    }
    vignetta();
  }

  // Didascalie con effetto macchina da scrivere
  let saltaScena = null;
  async function didascalie(righe) {
    const box = $("didascalia");
    box.classList.remove("nascosto");
    let saltato = false;
    const salta = new Promise((ok) => { saltaScena = () => { saltato = true; ok(); }; });
    $("btn-salta").classList.remove("nascosto");
    for (const riga of righe) {
      if (saltato) break;
      box.textContent = "";
      for (let i = 1; i <= riga.length && !saltato; i++) {
        box.textContent = riga.slice(0, i);
        await Promise.race([attendi(30), salta]);
      }
      await Promise.race([attendi(1800 + riga.length * 22), salta]);
    }
    box.classList.add("nascosto");
    $("btn-salta").classList.add("nascosto");
    saltaScena = null;
    return saltato;
  }
  $("btn-salta").addEventListener("click", () => { if (saltaScena) saltaScena(); });

  async function scenaIniziale() {
    const saltato = await didascalie(DIDASCALIE);
    const m = scena.monaco;
    if (saltato || m.stato !== "pronto") {
      // carretto già carico e Abate al suo posto
      if (saltato) await velo(1, 250);
      scena.libri = Math.min(11, DOMANDE.length);
      scena.libroVolo = null;
      Object.assign(m, { stato: "pronto", carica: false, sosta: 0, dir: 1 });
      if (saltato) await velo(0, 250);
    }
  }

  async function fugaIniziale() {
    sfondaPorta();
    await attendi(900);
    scena.esclama = 1.2;
    await attendi(450);
    scena.monaco.stato = "fuga";
    await attendi(2300);
  }

  // ---------------------------------------------------------------
  //  Ritratto dell'Abate nella pergamena (stesso stile dei personaggi)
  //  umore: "normale", "felice" (occhi sorridenti), "arrabbiato" (viso rosso)
  // ---------------------------------------------------------------
  const rCanvas = $("ritratto-canvas");
  const rctx = rCanvas.getContext("2d");
  let umoreRitratto = "normale";
  let cambioUmore = 0;

  function disegnaRitratto(t) {
    const c = rctx;
    const RW = 150;
    const RH = 170;
    c.setTransform(rCanvas.width / RW, 0, 0, rCanvas.height / RH, 0, 0);
    c.clearRect(0, 0, RW, RH);
    const u = umoreRitratto;
    const linea = "#24160c";
    const BIANCO = "#f4f1ea";
    const forma = (fn, riempi, sp = 3) => {
      c.beginPath(); fn(); c.closePath();
      if (riempi) { c.fillStyle = riempi; c.fill(); }
      c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = linea; c.lineWidth = sp; c.stroke();
    };
    const ell = (x, y, rx, ry, riempi, sp = 3, rot = 0) => forma(() => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2), riempi, sp);
    const tratto = (pts, colore, sp) => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = linea; c.lineWidth = sp + 4; c.stroke();
      c.strokeStyle = colore; c.lineWidth = sp; c.stroke();
    };

    // piccolo movimento: respiro, saltello di gioia, tremito di rabbia
    const dt = t - cambioUmore;
    let dy = Math.sin(t * 2.2) * 1.5;
    let dx = 0;
    if (u === "felice") dy -= Math.abs(Math.sin(dt * 7)) * 4 * Math.max(0, 1 - dt / 1.6);
    if (u === "arrabbiato") dx = Math.sin(t * 45) * 1.5 * Math.max(0.25, 1 - dt / 1.2);
    c.translate(dx, dy);

    // cappuccio, saio e stola
    ell(75, 114, 50, 22, SAIO_SCURO);
    forma(() => {
      c.moveTo(-4, RH + 4); c.lineTo(8, 138); c.quadraticCurveTo(20, 118, 46, 114);
      c.lineTo(104, 114); c.quadraticCurveTo(130, 118, 142, 138); c.lineTo(154, RH + 4);
    }, SAIO);
    for (const sx of [44, 94]) {
      forma(() => { c.moveTo(sx, 116); c.lineTo(sx + 12, 116); c.lineTo(sx + 13, RH + 4); c.lineTo(sx - 1, RH + 4); }, "#6a2c8c", 2.5);
      c.fillStyle = "#f2c94c";
      c.fillRect(sx + 4.5, 148, 3.5, 12); c.fillRect(sx + 1, 152, 10.5, 3.5);
    }

    // testa
    const pelle = u === "arrabbiato" ? "#e8735a" : PELLE;
    ell(75, 64, 33, 37, pelle);
    c.fillStyle = "rgba(255,255,255,0.5)";
    c.beginPath(); c.ellipse(63, 38, 9, 4.5, -0.4, 0, Math.PI * 2); c.fill();
    // ciuffi di capelli bianchi ai lati
    ell(44, 70, 9, 14, BIANCO, 2.5, 0.15);
    ell(106, 70, 9, 14, BIANCO, 2.5, -0.15);
    if (u === "felice") {
      c.fillStyle = "rgba(230,90,90,0.4)";
      c.beginPath(); c.arc(55, 76, 6, 0, Math.PI * 2); c.arc(95, 76, 6, 0, Math.PI * 2); c.fill();
    }

    // occhi
    const chiusi = u === "normale" && (t % 3.7) < 0.12;
    for (const ex of [62, 88]) {
      if (u === "felice") {
        c.beginPath(); c.arc(ex, 67, 5, Math.PI * 1.1, Math.PI * 1.9);
        c.strokeStyle = linea; c.lineWidth = 3.5; c.lineCap = "round"; c.stroke();
      } else if (chiusi) {
        c.beginPath(); c.moveTo(ex - 4, 65); c.lineTo(ex + 4, 65);
        c.strokeStyle = linea; c.lineWidth = 3; c.stroke();
      } else {
        c.fillStyle = linea;
        c.beginPath(); c.ellipse(ex, 65, 3.6, 5, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#fff";
        c.beginPath(); c.arc(ex + 1.2, 63, 1.3, 0, Math.PI * 2); c.fill();
      }
    }
    // sopracciglia
    for (const [x, lato] of [[62, -1], [88, 1]]) {
      if (u === "arrabbiato") tratto([[x + 9 * lato, 49], [x - 6 * lato, 56]], BIANCO, 5);
      else if (u === "felice") tratto([[x - 7, 54], [x, 50], [x + 7, 54]], BIANCO, 5);
      else tratto([[x - 7, 54], [x + 7, 53]], BIANCO, 5);
    }
    // naso
    ell(75, 79, 6.5, 5.5, pelle, 2.5);

    // barba: una sola forma morbida
    const onda = Math.sin(t * 3) * 1.2;
    forma(() => {
      c.moveTo(43, 74);
      c.quadraticCurveTo(38, 122, 75, 152 + onda);
      c.quadraticCurveTo(112, 122, 107, 74);
      c.quadraticCurveTo(96, 92, 75, 89);
      c.quadraticCurveTo(54, 92, 43, 74);
    }, BIANCO);
    // bocca (solo quando cambia espressione)
    if (u === "felice") {
      forma(() => { c.moveTo(65, 97); c.quadraticCurveTo(75, 112, 85, 97); c.quadraticCurveTo(75, 100, 65, 97); }, "#5a1a10", 2.5);
    } else if (u === "arrabbiato") {
      const ap = 3 + Math.abs(Math.sin(t * 9)) * 3;
      forma(() => { c.moveTo(66, 102); c.quadraticCurveTo(75, 95, 84, 102); c.quadraticCurveTo(75, 98 + ap, 66, 102); }, "#5a1a10", 2.5);
    }
    // baffi
    ell(66, 89, 11, 5.5, BIANCO, 2.5, -0.25);
    ell(84, 89, 11, 5.5, BIANCO, 2.5, 0.25);

    // fumo dalle orecchie quando è arrabbiato
    if (u === "arrabbiato") {
      for (let i = 0; i < 2; i++) {
        const k = (t * 1.2 + i * 0.5) % 1;
        c.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`;
        for (const sx of [26, 124]) {
          c.beginPath(); c.arc(sx + (sx < 75 ? -k * 10 : k * 10), 50 - k * 34, 5 + k * 8, 0, Math.PI * 2); c.fill();
        }
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
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
    } else if (mondo.stato === "scena") {
      aggiornaScena(dt);
      disegnaScena();
    } else {
      disegnaFissaAnimata(dt);
    }
    if (!$("pergamena").classList.contains("nascosto")) disegnaRitratto(mondo.t);
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
    if (umoreRitratto !== umore) cambioUmore = mondo.t;
    umoreRitratto = umore;
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

  const TASTI_AZIONE = [" ", "ArrowUp", "ArrowDown", "w", "s", "W", "S"];
  document.addEventListener("keydown", (e) => {
    if (mondo.mini && mondo.mini.attivo) {
      if (TASTI_AZIONE.includes(e.key)) { e.preventDefault(); azione(); }
      return;
    }
    if (!scelte.length) {
      if ((e.key === "Enter" || e.key === " ") && !$("titolo").classList.contains("nascosto")) $("btn-inizia").click();
      else if ((e.key === "Enter" || e.key === " " || e.key === "Escape") && saltaScena) { e.preventDefault(); saltaScena(); }
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
    mondo.scrollTappa = mondo.scroll;
    musica("tappa" + n);
    banner("TAPPA " + n, TAPPE[n - 1].nome.toUpperCase());
  }

  // A ogni partita le risposte cambiano posto rispetto alla partita precedente
  // (Vero/Falso resta in quest'ordine)
  const ordiniPrecedenti = new Map();
  function mescola(q) {
    let indici = q.opzioni.map((_, i) => i);
    const fisse = q.opzioni.join("|").toLowerCase() === "vero|falso";
    if (!fisse && indici.length > 1) {
      const prima = ordiniPrecedenti.get(q) || indici.join();
      do {
        for (let i = indici.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indici[i], indici[j]] = [indici[j], indici[i]];
        }
      } while (indici.join() === prima);
      ordiniPrecedenti.set(q, indici.join());
    }
    return { opzioni: indici.map((i) => q.opzioni[i]), giustaOra: indici.indexOf(q.giusta) };
  }

  async function minigioco(mg) {
    await attendi(1200);
    await dialogo(mg.istruzioni, "normale", ["Pronti! ▶"]);
    chiudiPergamena();
    const btn = $("btn-azione");
    btn.textContent = mg.tipo === "salto" ? "SALTA" : "GIÙ";
    btn.className = mg.tipo;
    banner("", mg.tipo === "salto" ? "SALTA!" : "ABBASSATI!", "verde");
    mondo.mini = { tipo: mg.tipo, quanti: mg.quanti, lanciati: 0, prossimo: 1.0 + Math.random() * 1.4, oggetti: [], evitati: 0, colpiti: 0, attivo: true };
    const m = mondo.mini;
    while (m.evitati + m.colpiti < m.quanti) await attendi(100);
    m.attivo = false;
    btn.className = "nascosto";
    await attendi(500);
    if (m.colpiti === 0) {
      mondo.D = Math.min(100, mondo.D + 6);
      mondo.vel = 2.1;
      suona("giusto");
      banner("", "PERFETTO!", "verde");
      for (let s = 0; s < 14; s++) particella(posizioni().gx - 80 + Math.random() * 120, SUOLO - 60, "stella");
    } else {
      banner("", `EVITATI ${m.evitati} SU ${m.quanti}`, m.evitati >= m.quanti / 2 ? "verde" : "rosso");
    }
    await attendi(1800);
    mondo.mini = null;
  }

  async function partita() {
    pescaDomande();
    azzeraMondo();
    $("finale").classList.add("nascosto");
    $("hud").classList.add("nascosto");
    musica("intro");
    await velo(1, 200);
    azzeraScena();
    mondo.stato = "scena";
    mondo.particelle = [];
    await velo(0, 500);
    await scenaIniziale();

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
    await fugaIniziale();

    // inizio della fuga
    await velo(1, 450);
    mondo.libri = DOMANDE.length;
    mondo.scroll = 0;
    mondo.scrollTappa = 0;
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
        const mg = (typeof MINIGIOCHI !== "undefined" ? MINIGIOCHI : []).find((g) => g.dopoTappa === mondo.tappa);
        if (mg) await minigioco(mg);
        cambiaTappa(q.tappa);
        await attendi(2600);
      }
      await attendi(i === 0 ? 900 : 1800);

      mondo.inseguimento = true;
      mondo.prossimaRimonta = 4 + Math.random() * 3;
      const { opzioni, giustaOra } = mescola(q);
      const scelta = await dialogo(q.testo, "normale", opzioni, {
        risposte: true,
        intestazione: `Domanda ${i + 1} di ${DOMANDE.length}`,
      });
      mondo.inseguimento = false;
      const bottoni = $("opzioni").querySelectorAll("button");
      const giusta = scelta === giustaOra;
      bottoni[giustaOra].classList.add("corretta");
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
        mondo.daRipassare.push(q);
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
    preparaRipasso();
    $("finale").classList.remove("nascosto");
  }

  // Riepilogo finale: un concetto da ripassare per ogni domanda sbagliata
  function preparaRipasso() {
    const sbagliate = mondo.daRipassare;
    $("btn-ripasso").classList.toggle("nascosto", sbagliate.length === 0);
    $("ripasso-sotto").textContent = sbagliate.length === 1
      ? "Avete sbagliato una domanda. Ecco il concetto da ripassare:"
      : `Avete sbagliato ${sbagliate.length} domande. Ecco i concetti da ripassare:`;
    const lista = $("ripasso-lista");
    lista.innerHTML = "";
    lista.classList.toggle("tante", sbagliate.length > 8);
    for (const q of sbagliate) {
      const li = document.createElement("li");
      li.textContent = q.ripasso || q.testo;
      lista.appendChild(li);
    }
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
  // sul tablet basta toccare lo schermo (o il pulsante) per saltare o abbassarsi
  $("schermo").addEventListener("pointerdown", (e) => {
    if (!mondo.mini || !mondo.mini.attivo) return;
    if (e.target.closest("#comandi")) return;
    e.preventDefault();
    azione();
  });
  $("btn-ripasso").addEventListener("click", () => $("ripasso").classList.remove("nascosto"));
  $("btn-chiudi-ripasso").addEventListener("click", () => $("ripasso").classList.add("nascosto"));
  $("btn-rigioca").addEventListener("click", () => {
    $("ripasso").classList.add("nascosto");
    chiudiPergamena();
    partita();
  });

  // Modalità di prova per l'insegnante: index.html?prova=finale-vittoria
  window.__mondo = mondo;
  window.__musica = () => (musicaCorrente ? musicaCorrente.src.split("/").pop() + (musicaCorrente.paused ? " (ferma)" : "") : "nessuna");
})();
