// Crea js/traduzioni.js dai file sq.json, es.json, zh.json: node strumenti/traduzioni/genera.js
const fs = require("fs");
const path = require("path");
const testi = JSON.parse(fs.readFileSync(path.join(__dirname, "testi-italiani.json"), "utf8"));
const out = {};
for (const l of ["sq", "es", "zh"]) {
  const tr = JSON.parse(fs.readFileSync(path.join(__dirname, l + ".json"), "utf8"));
  out[l] = {};
  for (const t of testi) if (tr[t.id]) out[l][t.it] = tr[t.id];
}
fs.writeFileSync(path.join(__dirname, "..", "..", "js", "traduzioni.js"),
  "// Traduzioni per la versione bilingue (generato da strumenti/traduzioni/genera.js: modificare i file .json lì)\n" +
  "// La chiave è il testo italiano esatto di js/domande.js o dell'interfaccia.\n" +
  "const TRADUZIONI = " + JSON.stringify(out, null, 1) + ";\n");
console.log(Object.entries(out).map(([l, o]) => l + ": " + Object.keys(o).length).join(", "));
