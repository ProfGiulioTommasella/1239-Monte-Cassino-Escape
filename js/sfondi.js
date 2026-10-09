// ================================================================
//  MONTECASSINO ESCAPE · sfondi disegnati
//  Stesso stile dei personaggi: colori pieni e contorni scuri.
//  Le tappe sono fatte a strati che scorrono a velocità diverse (parallasse).
// ================================================================
// eslint-disable-next-line no-unused-vars
function creaSfondi(ctx, W, hash) {
  "use strict";
  const L = "#24160c";
  const ORIZZONTE = 600; // sotto c'è la strada

  // ------------------------------------------------------------ utilità
  function contorno(colore, sp = 3) {
    ctx.fillStyle = colore;
    ctx.fill();
    if (sp) { ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = L; ctx.lineWidth = sp; ctx.stroke(); }
  }
  function poli(punti, colore, sp = 3) {
    ctx.beginPath();
    ctx.moveTo(punti[0][0], punti[0][1]);
    for (let i = 1; i < punti.length; i++) ctx.lineTo(punti[i][0], punti[i][1]);
    ctx.closePath();
    contorno(colore, sp);
  }
  function cielo(stops, y0 = 0, y1 = ORIZZONTE) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, ORIZZONTE + 20);
  }
  // profilo di colline/montagne che scorre
  function profilo(off, base, amp, lung, colore, sp = 0, fondo = ORIZZONTE + 20, punte = 0) {
    ctx.beginPath();
    ctx.moveTo(-10, fondo);
    for (let x = -10; x <= W + 10; x += 6) {
      const w = x + off;
      let y = base - amp * (0.55 * Math.sin(w / lung) + 0.3 * Math.sin(w / (lung * 0.43) + 1.7) + 0.15 * Math.sin(w / (lung * 0.19) + 0.4));
      if (punte) y -= punte * Math.abs(Math.sin(w / (lung * 0.31)));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 10, fondo);
    ctx.closePath();
    contorno(colore, sp);
  }
  // ripete oggetti lungo un livello: fn(x, i)
  function ripeti(off, passo, margine, fn) {
    const i0 = Math.floor((off - margine) / passo);
    const i1 = Math.ceil((off + W + margine) / passo);
    for (let i = i0; i <= i1; i++) fn(i * passo - off + (hash(i * 7.3) - 0.5) * passo * 0.5, i);
  }
  function nebbia(y, h, colore, alpha) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, `rgba(${colore},0)`);
    g.addColorStop(0.5, `rgba(${colore},${alpha})`);
    g.addColorStop(1, `rgba(${colore},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, h);
  }
  // cerchi uniti con un solo contorno esterno
  function nuvolaDiCerchi(cerchi, colore, sp = 3) {
    ctx.fillStyle = L;
    for (const [x, y, r] of cerchi) { ctx.beginPath(); ctx.arc(x, y, r + sp, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = colore;
    for (const [x, y, r] of cerchi) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  }
  function ramo(pts, sp, colore) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = L; ctx.lineWidth = sp + 6; ctx.stroke();
    ctx.strokeStyle = colore; ctx.lineWidth = sp; ctx.stroke();
  }
  function fiamma(x, y, s, t, seme = 0) {
    const f = 1 + Math.sin(t * 13 + seme * 3) * 0.12;
    const fy = Math.sin(t * 9 + seme) * 2;
    ctx.beginPath();
    ctx.moveTo(x - 14 * s, y);
    ctx.quadraticCurveTo(x - 16 * s, y - 22 * s * f, x + fy * s, y - 44 * s * f);
    ctx.quadraticCurveTo(x + 16 * s, y - 22 * s * f, x + 14 * s, y);
    ctx.closePath();
    contorno("#ff7a1a", 2.5 * Math.min(1, s));
    ctx.beginPath();
    ctx.moveTo(x - 7 * s, y);
    ctx.quadraticCurveTo(x - 8 * s, y - 12 * s * f, x + fy * 0.5 * s, y - 26 * s * f);
    ctx.quadraticCurveTo(x + 8 * s, y - 12 * s * f, x + 7 * s, y);
    ctx.closePath();
    ctx.fillStyle = "#ffd34d";
    ctx.fill();
  }
  function stelle(n, seme, alpha = 1) {
    for (let i = 0; i < n; i++) {
      const x = hash(i * 3.1 + seme) * W;
      const y = hash(i * 5.7 + seme) * 330;
      ctx.fillStyle = `rgba(255,250,220,${alpha * (0.4 + hash(i) * 0.6)})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // ------------------------------------------------------------ elementi
  function pino(x, base, h, colore, sp = 3) {
    ctx.fillStyle = "#4a2f1b";
    ctx.fillRect(x - 5, base - h * 0.25, 10, h * 0.25);
    ctx.strokeStyle = L; ctx.lineWidth = sp; ctx.strokeRect(x - 5, base - h * 0.25, 10, h * 0.25);
    for (let k = 0; k < 3; k++) {
      const yb = base - h * 0.18 - k * h * 0.24;
      const w = h * (0.34 - k * 0.07);
      poli([[x - w, yb], [x + w, yb], [x, yb - h * 0.42]], colore, sp);
    }
  }
  function alberoTondo(x, base, h, tronco, chioma, chiaro) {
    ramo([[x, base], [x - 2, base - h * 0.55]], 16, tronco);
    ramo([[x - 1, base - h * 0.4], [x + h * 0.14, base - h * 0.6]], 7, tronco);
    const r = h * 0.2;
    const c = [[x, base - h * 0.78, r * 1.15], [x - r, base - h * 0.62, r], [x + r, base - h * 0.64, r * 0.95], [x - r * 0.3, base - h * 0.95, r * 0.85], [x + r * 0.6, base - h * 0.88, r * 0.8]];
    nuvolaDiCerchi(c, chioma);
    ctx.fillStyle = chiaro;
    ctx.beginPath(); ctx.arc(x - r * 0.4, base - h * 0.9, r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  function alberoSecco(x, base, h, colore, seme) {
    const piega = (hash(seme) - 0.5) * 30;
    ramo([[x, base], [x + piega * 0.3, base - h * 0.45], [x + piega, base - h * 0.75]], 14, colore);
    ramo([[x + piega * 0.3, base - h * 0.45], [x - h * 0.25, base - h * 0.7], [x - h * 0.32, base - h * 0.85]], 7, colore);
    ramo([[x + piega * 0.6, base - h * 0.62], [x + h * 0.28, base - h * 0.8], [x + h * 0.36, base - h * 0.78]], 6, colore);
    ramo([[x + piega, base - h * 0.75], [x + piega + h * 0.1, base - h * 0.98]], 5, colore);
    // muschio che pende
    ctx.strokeStyle = "#5d7a3a"; ctx.lineWidth = 3;
    for (const [mx, my] of [[x - h * 0.22, base - h * 0.72], [x + h * 0.24, base - h * 0.8], [x + piega * 0.8, base - h * 0.7]]) {
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 2, my + 22 + hash(mx) * 18); ctx.stroke();
    }
  }
  function cespuglio(x, base, s, colore) {
    nuvolaDiCerchi([[x, base - 14 * s, 18 * s], [x - 20 * s, base - 8 * s, 14 * s], [x + 20 * s, base - 8 * s, 15 * s]], colore);
  }
  function masso(x, base, w, h, colore, chiaro) {
    poli([[x - w / 2, base], [x - w * 0.45, base - h * 0.6], [x - w * 0.2, base - h], [x + w * 0.25, base - h * 0.92], [x + w / 2, base - h * 0.4], [x + w * 0.48, base]], colore);
    ctx.fillStyle = chiaro;
    ctx.beginPath(); ctx.moveTo(x - w * 0.35, base - h * 0.62); ctx.lineTo(x - w * 0.16, base - h * 0.9); ctx.lineTo(x + w * 0.05, base - h * 0.84); ctx.lineTo(x - w * 0.2, base - h * 0.55); ctx.closePath(); ctx.fill();
  }
  function canne(x, base, colore) {
    for (let k = 0; k < 5; k++) {
      const dx = (k - 2) * 6;
      const h = 50 + hash(x + k) * 40;
      ramo([[x + dx, base], [x + dx + (k - 2) * 3, base - h]], 2, colore);
      if (k % 2 === 0) { ctx.beginPath(); ctx.ellipse(x + dx + (k - 2) * 3, base - h + 8, 4, 10, 0, 0, Math.PI * 2); contorno("#6b4520", 2); }
    }
  }

  // Un'abbazia stilizzata (campanile, chiesa, chiostro, mura)
  function abbazia(x, base, s, opz = {}) {
    const muro = opz.muro || "#cbb89a";
    const ombra = opz.ombra || "#a8916f";
    const tetto = opz.tetto || "#9b4a2c";
    const fin = opz.finestre || "#3a2a20";
    ctx.save();
    ctx.translate(x, base);
    ctx.scale(s, s);
    // mura basse
    poli([[-230, 0], [-230, -60], [230, -60], [230, 0]], ombra);
    for (let i = -230; i < 230; i += 30) poli([[i, -60], [i, -74], [i + 16, -74], [i + 16, -60]], ombra, 2.5);
    // ala sinistra
    poli([[-200, -60], [-200, -150], [-60, -150], [-60, -60]], muro);
    poli([[-210, -150], [-130, -190], [-50, -150]], tetto);
    // chiesa
    poli([[-60, -60], [-60, -200], [90, -200], [90, -60]], muro);
    poli([[-72, -200], [15, -270], [102, -200]], tetto);
    ctx.beginPath(); ctx.arc(15, -165, 20, 0, Math.PI * 2); contorno(fin, 3);
    for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(15, -165); ctx.lineTo(15 + Math.cos(a * Math.PI / 4) * 20, -165 + Math.sin(a * Math.PI / 4) * 20); ctx.strokeStyle = muro; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-5, -60); ctx.lineTo(-5, -110); ctx.arc(15, -110, 20, Math.PI, 0); ctx.lineTo(35, -60); ctx.closePath(); contorno("#4a2f1b", 3);
    // ala destra
    poli([[90, -60], [90, -130], [210, -130], [210, -60]], muro);
    poli([[80, -130], [150, -165], [220, -130]], tetto);
    // campanile
    poli([[-130, -150], [-130, -320], [-80, -320], [-80, -150]], muro);
    poli([[-140, -320], [-105, -380], [-70, -320]], tetto);
    poli([[-118, -290], [-118, -260], [-92, -260], [-92, -290]], fin, 2.5);
    ctx.beginPath(); ctx.arc(-105, -290, 13, Math.PI, 0); contorno(fin, 2.5);
    // finestre
    const fx = [[-185, -125], [-155, -125], [-110, -125], [110, -105], [140, -105], [170, -105]];
    for (const [wx, wy] of fx) {
      poli([[wx, wy], [wx, wy - 22], [wx + 14, wy - 22], [wx + 14, wy]], opz.luce ? opz.luce : fin, 2);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------ tappe
  function tappa1(s, t) {
    cielo([[0, "#8fb3c9"], [0.6, "#cfd9cf"], [1, "#e6e2c8"]]);
    // sole velato
    ctx.fillStyle = "rgba(255,248,215,0.8)";
    ctx.beginPath(); ctx.arc(980, 170, 48, 0, Math.PI * 2); ctx.fill();
    profilo(s * 0.04, 430, 40, 260, "#a8bba8", 0);
    nebbia(380, 120, "235,238,228", 0.6);
    ripeti(s * 0.12, 70, 60, (x, i) => pino(x, 520 + hash(i) * 15, 120 + hash(i * 3) * 60, "#7f9a82", 0));
    nebbia(440, 110, "235,238,228", 0.55);
    profilo(s * 0.2, 545, 14, 140, "#6f8f52", 3);
    ripeti(s * 0.32, 210, 140, (x, i) => {
      if (hash(i * 13) < 0.35) pino(x, 560, 220 + hash(i) * 80, "#3e6b3a");
      else alberoTondo(x, 562, 230 + hash(i * 2) * 90, "#6b4423", hash(i * 5) < 0.5 ? "#4f7d3c" : "#5c8a3e", "#73a24f");
    });
    nebbia(470, 100, "240,240,232", 0.35);
    ripeti(s * 0.6, 160, 60, (x, i) => cespuglio(x, 592, 0.8 + hash(i) * 0.6, i % 2 ? "#3c6a30" : "#467a36"));
  }

  function tappa2(s, t) {
    cielo([[0, "#14202c"], [0.55, "#2c3f47"], [1, "#4d5d52"]]);
    stelle(60, 7, 0.8);
    // luna
    ctx.fillStyle = "rgba(240,236,200,0.15)";
    ctx.beginPath(); ctx.arc(1030, 140, 90, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1030, 140, 52, 0, Math.PI * 2); contorno("#ece6be", 3);
    ctx.fillStyle = "#d7d0a3";
    ctx.beginPath(); ctx.arc(1015, 128, 9, 0, Math.PI * 2); ctx.arc(1048, 152, 6, 0, Math.PI * 2); ctx.fill();
    profilo(s * 0.05, 455, 30, 200, "#263640", 0, ORIZZONTE + 20, 18);
    nebbia(420, 120, "150,190,170", 0.3);
    ripeti(s * 0.14, 120, 80, (x, i) => alberoSecco(x, 520, 120 + hash(i) * 50, "#1e2a2c", i));
    // acqua della palude
    ctx.fillStyle = "#2b4246";
    ctx.fillRect(0, 515, W, 90);
    ctx.strokeStyle = "rgba(200,220,200,0.25)"; ctx.lineWidth = 3;
    ripeti(s * 0.4, 90, 40, (x, i) => { const y = 530 + hash(i) * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + hash(i * 3) * 40, y); ctx.stroke(); });
    ctx.fillStyle = "rgba(236,230,190,0.25)"; ctx.fillRect(990, 525, 80, 3); ctx.fillRect(1005, 540, 50, 3);
    ripeti(s * 0.33, 230, 150, (x, i) => alberoSecco(x, 560, 230 + hash(i * 4) * 80, "#3a2c22", i + 50));
    // fuochi fatui
    for (let i = 0; i < 6; i++) {
      const x = ((hash(i * 9) * W * 1.5 - s * 0.33) % (W + 200) + W + 200) % (W + 200) - 100;
      const y = 420 + hash(i * 4) * 120 + Math.sin(t * 1.5 + i) * 12;
      const g = ctx.createRadialGradient(x, y, 1, x, y, 22);
      g.addColorStop(0, "rgba(220,255,160,0.95)"); g.addColorStop(1, "rgba(160,255,120,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 22, y - 22, 44, 44);
    }
    nebbia(480, 110, "140,180,160", 0.35);
    ripeti(s * 0.6, 140, 60, (x) => canne(x, 600, "#4e5f32"));
  }

  function tappa3(s, t, sTappa) {
    cielo([[0, "#6c4f86"], [0.45, "#d9786a"], [0.8, "#f4b765"], [1, "#f8d58e"]]);
    ctx.fillStyle = "rgba(255,226,140,0.5)";
    ctx.beginPath(); ctx.arc(330, 400, 120, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(330, 400, 70, 0, Math.PI * 2); contorno("#ffd27a", 0);
    // montagne lontane con neve
    profilo(s * 0.03, 400, 80, 330, "#8b6b91", 3, ORIZZONTE + 20, 60);
    // l'abbazia di destinazione su un colle: si avvicina piano piano
    const avanti = Math.max(0, s - (sTappa || 0));
    const ax = 1180 - Math.min(520, avanti * 0.025);
    ctx.beginPath(); ctx.ellipse(ax, 520, 260, 110, 0, Math.PI, 0); contorno("#9a7a7c", 3);
    abbazia(ax, 425, 0.38 + Math.min(0.12, avanti * 0.00001), { muro: "#e6cfb0", ombra: "#c2a785", tetto: "#a5523a", luce: "#ffd36b" });
    profilo(s * 0.1, 470, 45, 180, "#9a7f6a", 3, ORIZZONTE + 20, 25);
    ripeti(s * 0.22, 260, 160, (x, i) => masso(x, 560, 180 + hash(i) * 120, 120 + hash(i * 3) * 90, "#8d7d68", "#b3a38a"));
    ripeti(s * 0.35, 190, 100, (x, i) => { if (hash(i * 7) > 0.35) pino(x, 575, 170 + hash(i) * 80, "#2f5a3c"); });
    ripeti(s * 0.6, 230, 80, (x, i) => masso(x, 600, 70 + hash(i) * 40, 40 + hash(i * 2) * 25, "#7c6e5d", "#a09179"));
  }

  // ------------------------------------------------------------ scene fisse
  // Schermata del titolo: l'abbazia in fiamme sulla cima piatta di Montecassino
  function inizio(t) {
    const AX = 1010, AB = 452, AS = 0.85, D = 50; // posizione e scala dell'abbazia
    cielo([[0, "#140b10"], [0.5, "#4a1a16"], [1, "#a8431c"]], 0, 640);
    ctx.fillRect(0, 600, W, 120);
    stelle(60, 3, 0.6);
    const g = ctx.createRadialGradient(AX, 330, 40, AX, 330, 600);
    g.addColorStop(0, "rgba(255,140,40,0.5)"); g.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 720);
    // catene di monti lontani
    profilo(120, 470, 70, 210, "#3a1c1b", 0, 720);
    profilo(400, 540, 45, 160, "#2d1716", 0, 720);
    // colonna di fumo dall'incendio
    for (let i = 0; i < 9; i++) {
      const k = (t * 0.035 + i / 9) % 1;
      const x = AX - 60 + i * 14 + k * 260;
      const y = 300 - k * 330;
      ctx.fillStyle = `rgba(35,24,24,${0.6 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(x, y, 40 + k * 110, 0, Math.PI * 2); ctx.fill();
    }
    // il monte, con la cima piatta su cui poggia l'abbazia
    poli([
      [400, 720], [470, 640], [540, 590], [600, 548], [655, 520], [700, 480], [730, 466], [748, AB],
      [1176, AB], [1196, 470], [1226, 500], [1262, 548], [1300, 590], [1300, 720],
    ].map(([x, y]) => [x + D, y]), "#4a2a22");
    // strati di roccia
    ctx.strokeStyle = "#3a2019"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (const [x1, y1, x2, y2] of [[620, 560, 700, 540], [560, 610, 650, 596], [700, 500, 760, 494], [1170, 500, 1230, 520], [1150, 560, 1250, 575], [800, 520, 900, 512], [960, 540, 1080, 548], [700, 620, 820, 612], [1000, 610, 1120, 604]]) {
      ctx.beginPath(); ctx.moveTo(x1 + D, y1); ctx.lineTo(x2 + D, y2); ctx.stroke();
    }
    // muraglione di sostegno sul bordo della cima
    poli([[740 + D, AB], [740 + D, AB + 22], [1184 + D, AB + 22], [1184 + D, AB]], "#5e4a3e", 2.5);
    ctx.fillStyle = "#4f3d33";
    for (let x = 752 + D; x < 1176 + D; x += 34) ctx.fillRect(x, AB + 6, 20, 9);
    // cipressi sui fianchi
    for (const [x0, y, h] of [[600, 560, 46], [628, 548, 40], [1232, 520, 44], [1262, 556, 50], [560, 600, 52], [520, 630, 58]]) {
      const x = x0 + D;
      ctx.beginPath(); ctx.moveTo(x, y - h); ctx.quadraticCurveTo(x + 11, y - h * 0.4, x + 6, y); ctx.lineTo(x - 6, y); ctx.quadraticCurveTo(x - 11, y - h * 0.4, x, y - h);
      contorno("#1f2a1a", 2.5);
    }
    abbazia(AX, AB, AS, { muro: "#8c7563", ombra: "#6e5a4b", tetto: "#6b3022", luce: "#ffb347" });
    // fiamme sui tetti (punti presi dal disegno dell'abbazia)
    const tetti = [[-105, -378, 1.1], [-130, -188, 1.2], [-175, -170, 0.9], [15, -268, 1.5], [-40, -215, 1.0], [70, -215, 1.1], [150, -163, 1.2], [195, -140, 0.9]];
    tetti.forEach(([px, py, sc], i) => fiamma(AX + px * AS, AB + py * AS, sc, t, i));
    // colline scure in primo piano
    profilo(60, 650, 22, 260, "#1d1210", 3, 760);
  }

  function vittoria(t) {
    // interno della chiesa dell'abbazia di arrivo
    cielo([[0, "#3b2a24"], [1, "#6d5140"]], 0, 720);
    ctx.fillRect(0, 600, W, 120);
    // luce calda dal fondo
    const g = ctx.createRadialGradient(640, 330, 30, 640, 330, 600);
    g.addColorStop(0, "rgba(255,220,150,0.6)"); g.addColorStop(1, "rgba(255,220,150,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 720);
    // abside con vetrate
    poli([[440, 560], [440, 260], [640, 140], [840, 260], [840, 560]], "#c9b18e");
    const colori = ["#c0392b", "#2e6db4", "#f1c40f", "#27ae60", "#8e44ad"];
    for (let k = 0; k < 3; k++) {
      const x = 500 + k * 110;
      ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 330); ctx.arc(x + 30, 330, 30, Math.PI, 0); ctx.lineTo(x + 60, 470); ctx.closePath();
      contorno("#2a1d16", 3);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
        ctx.fillStyle = colori[(r + c + k) % colori.length];
        ctx.globalAlpha = 0.75 + Math.sin(t * 1.5 + r + k) * 0.15;
        ctx.fillRect(x + 6 + c * 25, 340 + r * 21, 22, 18);
      }
      ctx.globalAlpha = 1;
    }
    ctx.beginPath(); ctx.arc(640, 225, 38, 0, Math.PI * 2); contorno("#2a1d16", 3);
    for (let a = 0; a < 8; a++) { ctx.fillStyle = colori[a % colori.length]; ctx.beginPath(); ctx.moveTo(640, 225); ctx.arc(640, 225, 32, (a * Math.PI) / 4, ((a + 1) * Math.PI) / 4); ctx.closePath(); ctx.fill(); }
    // colonne e archi della navata
    for (const lato of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const x = 640 + lato * (250 + k * 150);
        const w = 44 + k * 14;
        poli([[x - w / 2, 640], [x - w / 2, 160 - k * 60], [x + w / 2, 160 - k * 60], [x + w / 2, 640]], k % 2 ? "#b49c7a" : "#bfa784");
        poli([[x - w / 2 - 8, 640], [x - w / 2 - 8, 615], [x + w / 2 + 8, 615], [x + w / 2 + 8, 640]], "#9c8463");
      }
    }
    ctx.lineWidth = 16; ctx.strokeStyle = "#a68f6c";
    for (const lato of [-1, 1]) for (let k = 0; k < 2; k++) {
      const x1 = 640 + lato * (250 + k * 150);
      const x2 = 640 + lato * (250 + (k + 1) * 150);
      ctx.beginPath(); ctx.arc((x1 + x2) / 2, 200 - k * 60, Math.abs(x2 - x1) / 2, Math.PI, 0); ctx.stroke();
    }
    // altare e candele
    poli([[560, 560], [560, 500], [720, 500], [720, 560]], "#e9dcc0");
    ctx.fillStyle = "#c9a227"; ctx.fillRect(560, 506, 160, 8);
    for (const x of [578, 610, 670, 702]) {
      poli([[x - 4, 500], [x - 4, 470], [x + 4, 470], [x + 4, 500]], "#f4ecd8", 2);
      const f = 1 + Math.sin(t * 12 + x) * 0.15;
      ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.ellipse(x, 462, 4 * f, 8 * f, 0, 0, Math.PI * 2); ctx.fill();
    }
    // pavimento e tappeto rosso
    ctx.fillStyle = "#5d4636"; ctx.fillRect(0, 560, W, 160);
    for (let r = 0; r < 4; r++) { ctx.fillStyle = r % 2 ? "#6a5141" : "#544032"; ctx.fillRect(0, 560 + r * 40, W, 40); }
    poli([[600, 560], [680, 560], [800, 720], [480, 720]], "#a3241c");
    ctx.fillStyle = "#d4a531"; ctx.fillRect(608, 562, 64, 4);
    // raggi di luce
    ctx.fillStyle = "rgba(255,235,180,0.12)";
    for (let k = 0; k < 3; k++) { const x = 500 + k * 110; ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x + 60, 330); ctx.lineTo(x + 160 + k * 40, 720); ctx.lineTo(x - 60 + k * 40, 720); ctx.closePath(); ctx.fill(); }
  }

  function quasi(t) {
    // davanti al portone dell'abbazia di arrivo, di notte
    cielo([[0, "#0f1a2c"], [0.7, "#2b3a55"], [1, "#46506a"]], 0, 720);
    ctx.fillRect(0, 600, W, 120);
    stelle(80, 11);
    ctx.beginPath(); ctx.arc(1080, 120, 40, 0, Math.PI * 2); contorno("#ece6be", 3);
    // facciata
    poli([[200, 640], [200, 150], [640, 40], [1080, 150], [1080, 640]], "#8d7a68");
    for (let r = 0; r < 12; r++) for (let c = 0; c < 10; c++) {
      const x = 205 + c * 88 + (r % 2) * 44;
      const y = 160 + r * 40;
      if (y > 630) continue;
      ctx.fillStyle = `hsl(28, 12%, ${36 + hash(r * 13 + c) * 9}%)`;
      ctx.fillRect(x, y, 84, 36);
    }
    poli([[200, 150], [640, 40], [1080, 150], [1080, 175], [640, 65], [200, 175]], "#6b3022");
    // portale ad arco
    ctx.beginPath(); ctx.moveTo(470, 640); ctx.lineTo(470, 360); ctx.arc(640, 360, 170, Math.PI, 0); ctx.lineTo(810, 640); ctx.closePath(); contorno("#a8957c", 4);
    ctx.beginPath(); ctx.moveTo(500, 640); ctx.lineTo(500, 370); ctx.arc(640, 370, 140, Math.PI, 0); ctx.lineTo(780, 640); ctx.closePath(); contorno("#6e4320", 4);
    ctx.strokeStyle = "#3d2410"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(640, 230); ctx.lineTo(640, 640); ctx.stroke();
    for (let i = 1; i < 6; i++) { if (i === 3) continue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(500 + i * 46.6, 300); ctx.lineTo(500 + i * 46.6, 640); ctx.stroke(); }
    ctx.fillStyle = "#2b2b2b";
    for (const y of [400, 520]) ctx.fillRect(500, y, 280, 14);
    for (const x of [615, 665]) { ctx.beginPath(); ctx.arc(x, 470, 12, 0, Math.PI * 2); ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 5; ctx.stroke(); }
    // lunetta con croce
    ctx.fillStyle = "#e6c45a"; ctx.fillRect(632, 270, 16, 70); ctx.fillRect(610, 290, 60, 16);
    // torce
    for (const x of [400, 880]) {
      ctx.fillStyle = "#4a2f1b"; ctx.fillRect(x - 5, 360, 10, 60);
      const gg = ctx.createRadialGradient(x, 340, 5, x, 340, 160);
      gg.addColorStop(0, "rgba(255,170,60,0.45)"); gg.addColorStop(1, "rgba(255,170,60,0)");
      ctx.fillStyle = gg; ctx.fillRect(x - 160, 180, 320, 320);
      fiamma(x, 365, 0.9, t, x);
    }
    // scalini
    poli([[380, 640], [380, 620], [900, 620], [900, 640]], "#7a6a5a");
    ctx.fillStyle = "#2c2a30"; ctx.fillRect(0, 640, W, 80);
  }

  function fiamme(t) {
    // sfondo del finale peggiore: notte rossa e abbazia lontana in fiamme
    cielo([[0, "#14080a"], [0.6, "#5e1a10"], [1, "#a8381a"]], 0, 720);
    ctx.fillRect(0, 600, W, 120);
    for (let i = 0; i < 8; i++) {
      const k = (t * 0.05 + i / 8) % 1;
      ctx.fillStyle = `rgba(30,20,20,${0.6 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(200 + i * 130 + k * 100, 380 - k * 380, 70 + k * 100, 0, Math.PI * 2); ctx.fill();
    }
    profilo(0, 520, 40, 220, "#2a1714", 3, 760);
    // monte su cui poggia l'abbazia lontana
    poli([[760, 720], [830, 560], [880, 500], [893, 470], [1107, 470], [1122, 500], [1180, 560], [1260, 720]], "#3a211b");
    abbazia(1000, 470, 0.45, { muro: "#5e4a3e", ombra: "#4a3a30", tetto: "#3e1c14", luce: "#ff9a3a" });
    [[930, 380], [970, 350], [1040, 340], [1080, 410]].forEach(([x, y], i) => fiamma(x, y, 0.9, t, i + 20));
    ctx.fillStyle = "#1c120e"; ctx.fillRect(0, 610, W, 110);
  }

  // Spaccato dell'abbazia per la scena iniziale: scriptorium a sinistra,
  // cortile con il chiostro al centro, torre del portone a destra e fuori la notte.
  // (il portone, l'ariete e i personaggi li disegna gioco.js)
  function cortile(t, G) {
    // cielo rosso dell'incendio
    cielo([[0, "#1a0f14"], [0.6, "#4a1a14"], [1, "#a3401a"]], 0, G);
    stelle(40, 7, 0.5);
    const bagliore = ctx.createRadialGradient(700, 330, 30, 700, 330, 560);
    bagliore.addColorStop(0, "rgba(255,140,40,0.5)"); bagliore.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = bagliore; ctx.fillRect(0, 0, W, G);
    for (let i = 0; i < 7; i++) {
      const k = (t * 0.045 + i / 7) % 1;
      ctx.fillStyle = `rgba(40,28,28,${0.5 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(600 + i * 40 + k * 140, 250 - k * 260, 40 + k * 80, 0, Math.PI * 2); ctx.fill();
    }
    // fuori dalle mura: colline scure
    profilo(0, G - 130, 25, 140, "#2c1d1a", 3, G + 10);

    // campanile della chiesa che brucia, dietro al chiostro
    poli([[650, 360], [650, 175], [730, 175], [730, 360]], "#7d6656");
    poli([[642, 175], [690, 115], [738, 175]], "#6b3022");
    ctx.beginPath(); ctx.moveTo(672, 260); ctx.lineTo(672, 225); ctx.arc(690, 225, 18, Math.PI, 0); ctx.lineTo(708, 260); ctx.closePath(); contorno("#2a1a14", 2.5);
    fiamma(690, 130, 1.4, t, 1);
    fiamma(662, 182, 0.9, t, 2);

    // chiostro: piano superiore, tetto del portico e arcate
    const cx0 = 430, cx1 = 900;
    poli([[cx0, G - 30], [cx0, 285], [cx1, 285], [cx1, G - 30]], "#9a8470");
    for (let x = cx0 + 45; x < cx1 - 30; x += 95) {
      ctx.beginPath(); ctx.moveTo(x, 335); ctx.lineTo(x, 312); ctx.arc(x + 13, 312, 13, Math.PI, 0); ctx.lineTo(x + 26, 335); ctx.closePath();
      contorno(`rgba(255,${170 + Math.round(Math.sin(t * 7 + x) * 30)},70,1)`, 2.5);
    }
    poli([[cx0 - 10, 372], [cx0 + 10, 348], [cx1 - 10, 348], [cx1 + 10, 372]], "#7a3a26");
    ctx.strokeStyle = "#5a2a1a"; ctx.lineWidth = 2;
    for (let x = cx0 + 20; x < cx1; x += 22) { ctx.beginPath(); ctx.moveTo(x, 352); ctx.lineTo(x - 4, 370); ctx.stroke(); }
    for (let x = cx0 + 20, i = 0; x < cx1 - 40; x += 76, i++) {
      // arcata scura con colonnina
      ctx.beginPath(); ctx.moveTo(x, G - 30); ctx.lineTo(x, 430); ctx.arc(x + 28, 430, 28, Math.PI, 0); ctx.lineTo(x + 56, G - 30); ctx.closePath();
      contorno("#2e1d16", 2.5);
      poli([[x + 60, G - 30], [x + 60, 400], [x + 68, 400], [x + 68, G - 30]], "#b6a189", 2);
    }
    fiamma(560, 350, 1.0, t, 3);
    fiamma(790, 350, 1.2, t, 4);

    // pavimento del cortile
    ctx.fillStyle = "#3e3730";
    ctx.fillRect(0, G - 30, W, 200);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 22; c++) {
        const x = c * 64 + (r % 2) * 32 - 20;
        const y = G - 26 + r * 26;
        ctx.fillStyle = `hsl(28, 10%, ${22 + hash(r * 41 + c) * 10}%)`;
        ctx.beginPath(); ctx.ellipse(x + 30, y + 11, 29, 10, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = "#1c1814"; ctx.fillRect(0, G + 78, W, 200);

    // ---- scriptorium in spaccato
    const s0 = 0, s1 = 452, alto = 262;
    // parete di fondo illuminata dalla candela
    poli([[s0 + 34, G - 30], [s0 + 34, alto], [s1 - 30, alto], [s1 - 30, G - 30]], "#c39a6b");
    const luce = ctx.createRadialGradient(300, 450, 10, 300, 450, 260);
    luce.addColorStop(0, "rgba(255,220,140,0.45)"); luce.addColorStop(1, "rgba(60,30,10,0.35)");
    ctx.fillStyle = luce; ctx.fillRect(s0 + 34, alto, s1 - 64, G - 30 - alto);
    // finestrella sul cielo rosso
    ctx.beginPath(); ctx.moveTo(280, 370); ctx.lineTo(280, 318); ctx.arc(300, 318, 20, Math.PI, 0); ctx.lineTo(320, 370); ctx.closePath();
    contorno("#b8461c", 3);
    arto2(300, 300, 300, 370, 3);
    // pavimento di assi
    poli([[s0, G - 30], [s0, G + 6], [s1, G + 6], [s1, G - 30]], "#7a4f2a", 2.5);
    // scaffale con i codici
    poli([[56, G - 30], [56, 300], [176, 300], [176, G - 30]], "#6b4520");
    for (let r = 0; r < 4; r++) {
      const y = 300 + 12 + r * 66;
      poli([[60, y], [60, y + 52], [172, y + 52], [172, y]], "#3a2414", 2);
      let x = 64;
      for (let i = 0; x < 160; i++) {
        const w = 12 + hash(r * 13 + i) * 6;
        const h = 36 + hash(r * 7 + i) * 12;
        const col = ["#8b1e1e", "#1f4e8c", "#2e6b34", "#7b3f99", "#a86b1d", "#5a3a1a"][(r * 3 + i) % 6];
        poli([[x, y + 52], [x, y + 52 - h], [x + w, y + 52 - h], [x + w, y + 52]], col, 2);
        ctx.fillStyle = "#e8c24a"; ctx.fillRect(x + 3, y + 52 - h + 6, w - 6, 2.5);
        x += w + 1;
      }
    }
    // leggio con il codice aperto e la candela
    poli([[250, G - 30], [262, G - 120], [270, G - 120], [262, G - 30]], "#5a3818", 2.5);
    poli([[340, G - 30], [330, G - 120], [338, G - 120], [350, G - 30]], "#5a3818", 2.5);
    poli([[236, G - 132], [356, G - 150], [362, G - 128], [242, G - 112]], "#7a4a22");
    poli([[256, G - 136], [298, G - 142], [300, G - 128], [258, G - 122]], "#f5ecd2", 2);
    poli([[300, G - 142], [342, G - 148], [344, G - 134], [300, G - 128]], "#f5ecd2", 2);
    ctx.strokeStyle = "#8b1e1e"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(262, G - 133 + i * 4); ctx.lineTo(292, G - 137 + i * 4); ctx.stroke(); }
    ctx.strokeStyle = "#24160c"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(306, G - 139 + i * 4); ctx.lineTo(336, G - 143 + i * 4); ctx.stroke(); }
    poli([[372, G - 150], [372, G - 172], [380, G - 172], [380, G - 150]], "#f2e6c8", 2);
    fiamma(376, G - 172, 0.45, t, 5);
    // muri in sezione e tetto a spiovente
    poli([[s0 - 4, G + 6], [s0 - 4, alto - 6], [s0 + 34, alto - 6], [s0 + 34, G + 6]], "#6e5a4b");
    poli([[s1 - 30, G - 168], [s1 - 30, alto - 6], [s1 + 8, alto - 6], [s1 + 8, G - 168]], "#6e5a4b");
    // arco della porticina (aperta verso il cortile)
    ctx.beginPath(); ctx.moveTo(s1 - 30, G - 168); ctx.quadraticCurveTo(s1 - 11, G - 186, s1 + 8, G - 168); ctx.closePath(); contorno("#6e5a4b", 3);
    poli([[s1 + 8, G - 160], [s1 + 30, G - 152], [s1 + 30, G - 2], [s1 + 8, G + 4]], "#7a4a22", 2.5);
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(s1 + 10, G - 130, 19, 6); ctx.fillRect(s1 + 10, G - 50, 19, 6);
    poli([[s0 - 20, alto], [226, 168], [s1 + 30, alto], [s1 + 30, alto + 14], [226, 184], [s0 - 20, alto + 14]], "#8a3a26");
    ctx.strokeStyle = "#5a2a1a"; ctx.lineWidth = 2;
    for (let i = 1; i < 10; i++) {
      const k = i / 10;
      const xa = s0 - 20 + k * (226 - s0 + 20), ya = alto + 14 - k * (alto + 14 - 184);
      const xb = 226 + k * (s1 + 30 - 226), yb = 184 + k * (alto + 14 - 184);
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, ya - 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xb, yb); ctx.lineTo(xb, yb - 14); ctx.stroke();
    }

    // ---- torre del portone in spaccato (il varco resta aperto: il portone lo disegna il gioco)
    const t0 = 900, t1 = 1000, cima = 210;
    for (let c = 0; c < 4; c++) poli([[t0 - 6 + c * 30, cima], [t0 - 6 + c * 30, cima - 30], [t0 + 14 + c * 30, cima - 30], [t0 + 14 + c * 30, cima]], "#6e5a4b");
    poli([[t0 - 8, cima], [t0 - 8, G - 236], [t1 + 4, G - 236], [t1 + 4, cima]], "#7d6656");
    ctx.fillStyle = "#6a5546";
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      if (hash(r * 9 + c) < 0.5) ctx.fillRect(t0 + c * 24 + (r % 2) * 10, cima + 10 + r * 30, 18, 10);
    }
    // varco sotto la volta
    ctx.beginPath(); ctx.moveTo(t0 - 8, G + 6); ctx.lineTo(t0 - 8, G - 236); ctx.quadraticCurveTo((t0 + t1) / 2, G - 270, t1 + 4, G - 236); ctx.lineTo(t1 + 4, G + 6); ctx.closePath();
    contorno("#3a2a22", 3);
    poli([[t0 - 8, G - 236], [t0 - 8, G - 222], [t1 + 4, G - 222], [t1 + 4, G - 236]], "#6e5a4b", 2.5);
    // torcia sul lato del cortile
    arto2(t0 - 26, 420, t0 - 26, 460, 6);
    fiamma(t0 - 26, 422, 0.55, t, 6);
  }
  function arto2(x1, y1, x2, y2, sp) {
    ctx.lineCap = "round";
    ctx.strokeStyle = L; ctx.lineWidth = sp + 4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = "#6b4520"; ctx.lineWidth = sp;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  return { tappe: [tappa1, tappa2, tappa3], inizio, cortile, vittoria, quasi, fiamme, fiamma };
}
