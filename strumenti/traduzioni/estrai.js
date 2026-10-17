// Raccoglie tutti i testi italiani del gioco da tradurre: node strumenti/traduzioni/estrai.js
const fs = require("fs");
const path = require("path");
const radice = path.join(__dirname, "..", "..");
eval(fs.readFileSync(path.join(radice, "js", "domande.js"), "utf8") + "\nglobal.C = { TAPPE, DIDASCALIE, INTRO, DOMANDA_INIZIALE, RISPOSTA_SI, RISPOSTA_NO, ISTRUZIONI_CORSA, MINIGIOCHI, MINIGIOCO_PRESI, BANCA_DOMANDE, FINALI };");
const testi = [];
const aggiungi = (t, nota) => { if (t && !testi.some((x) => x.it === t)) testi.push(nota ? { it: t, nota } : { it: t }); };
// interfaccia (con segnaposto tra graffe)
[
  ["Un gioco di ripasso sul Canto Gregoriano.", "schermata del titolo"],
  ["Rispondete alle domande dell'Abate e aiutatelo a sfuggire ai soldati!", "schermata del titolo"],
  ["INIZIA", "pulsante"], ["GIOCA ANCORA", "pulsante"], ["DA RIPASSARE", "pulsante"], ["OK", "pulsante"],
  ["Avanti", "pulsante"], ["Via!", "pulsante"], ["Pronti!", "pulsante"], ["Riprova", "pulsante"], ["Partiamo!", "pulsante"], ["Va bene...", "pulsante"],
  ["Sì", "risposta"], ["No", "risposta"],
  ["Abate Stefano II", "nome del personaggio"],
  ["Domanda {n} di {tot}", "intestazione"],
  ["Risposta giusta: {r}", "dopo un errore"],
  ["TAPPA {n}", "banner"], ["GIUSTO!", "banner"], ["SBAGLIATO!", "banner"], ["SALTA!", "banner minigioco"], ["ABBASSATI!", "banner minigioco"],
  ["PERFETTO!", "banner"], ["EVITATI {n} SU {tot}", "banner"], ["PRESI!", "banner, i soldati ci hanno preso"],
  ["Inni salvati: {n} su {tot}", "finale"], ["Vi hanno raggiunto alla domanda {n} di {tot}", "finale"],
  ["Da ripassare", "titolo del riepilogo"],
  ["Avete sbagliato una domanda. Ecco il concetto da ripassare:", "riepilogo"],
  ["Avete sbagliato {n} domande. Ecco i concetti da ripassare:", "riepilogo"],
  ["SALTA", "pulsante minigioco"], ["GIÙ", "pulsante minigioco (abbassati)"],
].forEach(([t, n]) => aggiungi(t, n));
C.TAPPE.forEach((t) => aggiungi(t.nome, "nome della tappa"));
C.DIDASCALIE.forEach((t) => aggiungi(t, "didascalia iniziale"));
C.INTRO.forEach((t) => aggiungi(t, "l'Abate"));
[C.DOMANDA_INIZIALE, C.RISPOSTA_SI, C.RISPOSTA_NO, C.ISTRUZIONI_CORSA, C.MINIGIOCO_PRESI].forEach((t) => aggiungi(t, "l'Abate"));
C.MINIGIOCHI.forEach((m) => aggiungi(m.istruzioni, "istruzioni del minigioco"));
C.BANCA_DOMANDE.forEach((q, i) => {
  aggiungi(q.testo, `domanda ${i + 1}`);
  q.opzioni.forEach((o) => aggiungi(o, `risposta della domanda ${i + 1}` + (o === q.opzioni[q.giusta] ? " (giusta)" : "")));
  aggiungi(q.bravo, `l'Abate dopo una risposta giusta alla domanda ${i + 1}`);
  aggiungi(q.sbagliato, `l'Abate dopo una risposta sbagliata alla domanda ${i + 1}`);
  aggiungi(q.ripasso, `concetto da ripassare (domanda ${i + 1})`);
});
C.FINALI.forEach((f) => { aggiungi(f.titolo, "titolo del finale"); aggiungi(f.testo, "l'Abate nel finale"); });
testi.forEach((t, i) => { t.id = i + 1; });
fs.writeFileSync(path.join(__dirname, "testi-italiani.json"), JSON.stringify(testi, null, 1));
console.log(testi.length + " testi");
