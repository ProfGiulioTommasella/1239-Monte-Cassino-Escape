// ================================================================
//  MONTECASSINO ESCAPE · contenuti del gioco
//  Questo è l'unico file da modificare per cambiare domande e testi.
//  - "giusta" è la posizione dell'opzione corretta, contando da 0
//    (0 = prima opzione, 1 = seconda, 2 = terza).
//  - "tappa" indica in quale ambientazione compare la domanda (1, 2 o 3).
//  - "ripasso" è il concetto mostrato nel riepilogo finale se si sbaglia la domanda.
//  - "suono" (facoltativo) è un suono in più dopo una risposta sbagliata.
// ================================================================

// Ogni tappa ha il suo paesaggio (disegnato in js/sfondi.js) e la sua musica.
const TAPPE = [
  { nome: "Il bosco delle nebbie", musica: "assets/audio/musica-tappa1.mp3" },
  { nome: "La palude oscura", musica: "assets/audio/musica-tappa2.mp3" },
  { nome: "Il sentiero di pietra", musica: "assets/audio/musica-tappa3.mp3" },
];
// Musica della schermata iniziale e del dialogo con l'Abate.
const MUSICA_INTRO = "assets/audio/musica-intro.mp3";

// Didascalie della scena iniziale.
const DIDASCALIE = [
  "1239: i soldati di Federico II di Svevia devastano l'Abbazia di Montecassino.",
  "L'Abbazia era uno dei più importanti centri di produzione di manoscritti.",
  "L'Abate Stefano II deve mettere in salvo i preziosi codici di canto gregoriano in una vicina abbazia, prima che il portone ceda!",
];

const INTRO = [
  "Benvenuti, miei fidati novizi! Come potete vedere, i soldati hanno devastato il nostro povero monastero...",
  "Ho recuperato dallo scriptorium i nostri manoscritti di canto gregoriano appena in tempo, e con il vostro aiuto li porteremo in salvo all'abbazia più vicina!",
];
const DOMANDA_INIZIALE = "Siete con me?";
const RISPOSTA_SI = "Molto bene miei prodi discepoli! Partiamo!";
const RISPOSTA_NO = "Beh, tanto non avete scelta, perché in quanto novizi avete fatto voto di obbedienza!";
const ISTRUZIONI_CORSA =
  "I soldati di Federico II ci inseguono! Ogni risposta giusta ci fa guadagnare terreno, ogni risposta sbagliata li avvicina e ci fa perdere un libro dal carretto. E non perdete tempo: se esitate troppo, accelerano! Attenti: alla sesta risposta sbagliata ci prendono!";

// Minigiochi d'azione alla fine di una tappa (prima di passare alla successiva).
// tipo "salto": saltare sassi e tronchi; tipo "lance": abbassarsi per schivare le lance.
// "quanti" è il numero di ostacoli o di lance.
// "colpiMassimi": quanti ostacoli o lance si possono prendere; al colpo successivo i soldati
// raggiungono il carretto e si ripete il minigioco (non tutta la partita).
const MINIGIOCHI = [
  {
    dopoTappa: 1,
    tipo: "salto",
    quanti: 8,
    colpiMassimi: 3,
    istruzioni: "Attenti! Il sentiero è pieno di sassi, tronchi caduti e botti rotolate giù. Premete la BARRA SPAZIATRICE (o toccate lo schermo) per saltare con il carretto! Possiamo permetterci al massimo 3 colpi!",
  },
  {
    dopoTappa: 2,
    tipo: "lance",
    quanti: 8,
    colpiMassimi: 3,
    istruzioni: "Quei soldati ci tirano le lance! Quando vedete un soldato gridare nel fumetto, premete la FRECCIA GIÙ o la BARRA SPAZIATRICE (o toccate lo schermo) per abbassare la testa! Al quarto colpo ci prendono!",
  },
];

// Cosa dice l'Abate quando i soldati lo prendono durante un minigioco.
const MINIGIOCO_PRESI = "Ahimè, ci hanno raggiunti! Per fortuna sono riuscito a sgusciare via... riproviamo, e stavolta state più attenti!";

// Banca delle domande: a ogni partita se ne pescano 12 a caso
// (4 per ognuna delle tre tappe, come indicato in DOMANDE_PER_TAPPA).
const BANCA_DOMANDE = [
  {
    tappa: 1,
    testo: 'Li chiamiamo "Inni Gregoriani" in onore di un famoso "MAGNO"... chi era?',
    ripasso: "Il Canto gregoriano prende il nome da Papa Gregorio Magno.",
    opzioni: ["Carlo Magno", "Papa Gregorio Magno", "Alessandro Magno"],
    giusta: 1,
    bravo: "Bravi i miei discepoli!",
    sbagliato: "Il nostro povero Papa Gregorio Magno non sarebbe contento!",
  },
  {
    tappa: 1,
    testo: "In che lingua scriviamo e cantiamo i nostri inni?",
    ripasso: "Il Canto gregoriano è scritto e cantato in latino.",
    opzioni: ["Latino", "Volgare", "Italiano"],
    giusta: 0,
    bravo: "Magno Gaudio!",
    sbagliato: "Non correcto est!",
  },
  {
    tappa: 1,
    testo: "Durante le funzioni sacre, accompagniamo il canto con gli strumenti.",
    ripasso: "Il Canto gregoriano si canta senza strumenti.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Bravi, discìpuli! Gli strumenti distraggono dalla preghiera!!!",
    sbagliato: "Ah, vi piacerebbe far baccano durante le sacre funzioni, eh?! È Falso!",
  },
  {
    tappa: 1,
    testo: "Vi ricordate quanti anni è durata la SCHOLA CANTORUM, dove avete imparato a memoria tutti i canti?",
    ripasso: "Nella Schola Cantorum si studiava per 9 anni, imparando a memoria tutti i canti.",
    opzioni: ["5", "9", "15"],
    giusta: 1,
    bravo: "Già! Sembrano volati, vero?",
    sbagliato: "Ahia! Fosse per me ve ne farei fare altri 20!!!",
  },
  {
    tappa: 1,
    testo: "Quando cantiamo, seguiamo tutti quanti la stessa melodia, all'unisono. Questa pratica si chiama:",
    ripasso: "Il Canto gregoriano è monodico: tutti cantano la stessa melodia, all'unisono.",
    opzioni: ["MONODIA", "POLIFONIA"],
    giusta: 0,
    bravo: "Bene bene, vedo che siete attenti durante le sacre funzioni!",
    sbagliato: "Poffarbacco! Deduco che siate molto distratti mentre cantiamo durante le sacre funzioni!!!",
  },
  {
    tappa: 2,
    testo: "Il nostro Papa Gregorio ha deciso che non possiamo perderci in inutili giochetti musicali, per cui ad ogni sillaba deve corrispondere solo una nota.",
    ripasso: "Il Canto gregoriano è sillabico: a ogni sillaba corrisponde una sola nota.",
    opzioni: ["Vero", "Falso"],
    giusta: 0,
    bravo: "Ma che soddisfazione questi discepoli ben preparati!!!",
    sbagliato: "Perdindirindina!!! Non sarete mica dei fan dei MELISMI profani!!!",
  },
  {
    tappa: 2,
    testo: "Mi pare di ricordare che l'ANTIPHONARIUS CENTO, con tutti i nostri canti, fosse a Roma, nella Basilica di San Giovanni in Laterano.",
    ripasso: "L'Antiphonarius Cento era custodito nella Basilica di San Pietro a Roma.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Oh, avete ragione, era a San Pietro! Sapete, l'età che avanza...",
    sbagliato: "Non datemi ragione solo perché sono vecchio!! Ora ricordo, era a San Pietro!",
  },
  {
    tappa: 2,
    testo: "Come chiamiamo i nostri bravi monaci che copiano tutto il giorno i vari inni? Monaci...",
    ripasso: "I monaci che copiavano i codici si chiamano amanuensi.",
    opzioni: ["Cistercensi", "Copiatori", "Amanuensi"],
    giusta: 2,
    bravo: "Superbo! Già vi ci vedo, tutto il giorno allo scrittoio intenti a copiare!!",
    sbagliato: '"AMANUENSI"!',
  },
  {
    tappa: 2,
    testo: "Finalmente, dopo molti anni di tentativi, abbiamo deciso quanti RIGHI usare per scrivere la musica:",
    ripasso: "Per scrivere la musica si usano 4 righi: il tetragramma di Guido d'Arezzo.",
    opzioni: ["3", "4", "5"],
    giusta: 1,
    bravo: "Siete dei mùsici provetti!",
    sbagliato: "Perdincibacco, ma in che anno vivete! Non siamo ancora nel 1400!!!",
  },
  {
    tappa: 3,
    testo: "I NEUMI, ovvero le nostre note, sono infallibili. Infatti indicano sia l'ALTEZZA che la DURATA della nota.",
    ripasso: "I neumi indicano solo l'altezza delle note, non la durata.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Ah già, la DURATA a noi non interessa, perché è un concetto troppo umano!",
    sbagliato: "Miscredenti! A noi interessa solo l'altezza, non la durata! Tanto che a volte ci addormentiamo tenendo una sola nota!",
    suono: "russare",
  },
  {
    tappa: 3,
    testo: "Non ricordo bene... i nomi delle note sono stati stabiliti da un nostro confratello...",
    ripasso: "I nomi delle note sono stati stabiliti da Guido d'Arezzo.",
    opzioni: ["Guido d'Arezzo", "San Francesco d'Assisi"],
    giusta: 0,
    bravo: "Ah giusto! Era proprio un bravo monaco!",
    sbagliato: "Anche se parlava agli animali, non vuol dire che adesso gli dobbiamo attribuire anche cose che non ha fatto!!!",
  },
  // ---- Domande ricavate dalla verifica ----
  {
    tappa: 1,
    testo: "Dicono che quest'epoca, il MEDIOEVO, sia iniziata nel 476. Con quale avvenimento?",
    ripasso: "Il Medioevo inizia nel 476, con la caduta dell'Impero romano d'Occidente.",
    opzioni: ["La caduta dell'Impero romano d'Occidente", "L'incoronazione di Carlo Magno", "La nascita di San Benedetto"],
    giusta: 0,
    bravo: "Esatto! Roma è caduta e noi monaci abbiamo custodito il sapere!",
    sbagliato: "Ma no! Nel 476 cade l'Impero romano d'Occidente!",
  },
  {
    tappa: 1,
    testo: "Un frate indovino dice che il Medioevo, per convenzione, finirà nel 1492. Perché proprio allora?",
    ripasso: "Per convenzione il Medioevo finisce nel 1492, con la scoperta dell'America.",
    opzioni: ["Per la scoperta dell'America", "Per la fine del mondo", "Per l'invenzione degli occhiali"],
    giusta: 0,
    bravo: "America? Non so cosa sia, ma mi fido di voi!",
    sbagliato: "Ma che dite! Il frate parlava della scoperta dell'America, qualunque cosa sia!",
  },
  {
    tappa: 1,
    testo: "In quale ambiente nasce e si diffonde il nostro Canto gregoriano?",
    ripasso: "Il Canto gregoriano nasce e si diffonde nei monasteri.",
    opzioni: ["Nelle corti dei re", "Nei monasteri", "Nelle piazze del mercato"],
    giusta: 1,
    bravo: "Proprio così! Qui tra le mura del monastero!",
    sbagliato: "Al mercato si vendono cavoli, mica si compongono inni! Nei monasteri!",
  },
  {
    tappa: 1,
    testo: "Il ritmo dei nostri canti com'è?",
    ripasso: "Il ritmo del Canto gregoriano è libero e segue le parole.",
    opzioni: ["Regolare, come una marcia", "Libero, segue le parole", "Veloce, come una danza"],
    giusta: 1,
    bravo: "Benissimo! Il ritmo segue le parole della preghiera!",
    sbagliato: "Marce e danze?! Il nostro ritmo è libero e segue le parole!",
  },
  {
    tappa: 1,
    testo: "Le melodie dei nostri canti sono semplici e senza salti.",
    ripasso: "Le melodie del Canto gregoriano sono semplici e senza salti.",
    opzioni: ["Vero", "Falso"],
    giusta: 0,
    bravo: "Semplici e senza salti, come piace al Signore!",
    sbagliato: "E invece è Vero! Melodie semplici e senza salti, niente acrobazie!",
  },
  {
    tappa: 2,
    testo: "In quale stanza del monastero si creano le copie dei codici e degli Inni gregoriani?",
    ripasso: "Le copie dei codici e degli inni si facevano nello scriptorium.",
    opzioni: ["Refettorio", "Calefactorium", "Scriptorium"],
    giusta: 2,
    bravo: "Lo scriptorium! Proprio da lì ho salvato questi libri!",
    sbagliato: "Ahimè! Si copia nello SCRIPTORIUM, non dove si mangia o ci si scalda!",
  },
  {
    tappa: 2,
    testo: "Come si chiama il grande librone che contiene le copie originali degli Inni Gregoriani?",
    ripasso: "Il librone con le copie originali degli inni si chiama Antiphonarius Cento.",
    opzioni: ["Codex Magnus", "Antiphonarius Cento", "Liber Gregorius"],
    giusta: 1,
    bravo: "L'Antiphonarius Cento! Siete preparatissimi!",
    sbagliato: "Si chiama ANTIPHONARIUS CENTO! Scrivetevelo sulla mano!",
  },
  {
    tappa: 2,
    testo: "Nella Basilica di San Pietro, come era custodito l'Antiphonarius Cento?",
    ripasso: "L'Antiphonarius Cento era legato con una catena d'oro all'altare di San Pietro.",
    opzioni: ["Chiuso in un forziere sottoterra", "Legato con una catena d'oro all'altare", "Appeso al soffitto con una corda"],
    giusta: 1,
    bravo: "Con una catena d'oro! Nessuno poteva portarselo via!",
    sbagliato: "Ma no! Era legato con una catena d'oro all'altare!",
  },
  {
    tappa: 2,
    testo: "Il nostro canto è SILLABICO, ma anche...",
    ripasso: "Il Canto gregoriano è sillabico e neumatico.",
    opzioni: ["Polifonico", "Strumentale", "Neumatico"],
    giusta: 2,
    bravo: "Sillabico e neumatico! Siete dei veri monaci!",
    sbagliato: "Sillabico e NEUMATICO, figlioli!",
  },
  {
    tappa: 2,
    testo: "Come si chiamano le nostre note, scritte sopra le parole del canto?",
    ripasso: "Le note del Canto gregoriano si chiamano neumi.",
    opzioni: ["Neumi", "Crome", "Righi"],
    giusta: 0,
    bravo: "I neumi! Vedo che sfogliate i codici!",
    sbagliato: "Si chiamano NEUMI, figlioli!",
  },
  {
    tappa: 3,
    testo: "Il buon Guido d'Arezzo ha stabilito due chiavi musicali per leggere le note. Quali?",
    ripasso: "Guido d'Arezzo crea la chiave di Do e la chiave di Fa.",
    opzioni: ["Chiave di Do e chiave di Fa", "Chiave di Sol e chiave di Mi", "Chiave di casa e chiave della cantina"],
    giusta: 0,
    bravo: "Do e Fa! Guido ne sarebbe fiero!",
    sbagliato: "Ma quale cantina! Sono la chiave di Do e la chiave di Fa!",
  },
  {
    tappa: 3,
    testo: "Da dove ha preso Guido d'Arezzo i nomi delle note?",
    ripasso: "Guido d'Arezzo prende i nomi delle note dalle sillabe di un inno a San Giovanni.",
    opzioni: ["Dalle lettere dell'alfabeto", "Dalle sillabe di un inno a San Giovanni", "Dai nomi dei suoi confratelli"],
    giusta: 1,
    bravo: "Ut queant laxis... che bell'inno!",
    sbagliato: "Ma no! Dalle prime sillabe dell'inno a San Giovanni!",
  },
  {
    tappa: 3,
    testo: "E l'Antiphonarius Cento, il grande librone degli inni... che fine ha fatto?",
    ripasso: "L'Antiphonarius Cento è andato perduto durante una delle invasioni barbariche.",
    opzioni: ["È conservato in una biblioteca di Parigi", "È andato perduto durante un'invasione barbarica", "Ce l'abbiamo noi nel carretto"],
    giusta: 1,
    bravo: "Già, perduto per sempre... per questo i nostri libri vanno salvati a tutti i costi!",
    sbagliato: "Magari! È andato perduto durante una delle tante invasioni barbariche!",
  },
  {
    tappa: 3,
    testo: "E la nostra Abbazia di Monte Cassino in quale Paese si trova?",
    ripasso: "L'Abbazia di Monte Cassino si trova in Italia.",
    opzioni: ["Francia", "Italia", "Svizzera"],
    giusta: 1,
    bravo: "In Italia, naturalmente! Almeno questa la sapevate!",
    sbagliato: "Ma come?! Ci state scappando adesso! È in ITALIA!",
  },
  {
    tappa: 3,
    testo: "Il famoso Monastero di Cluny si trova in...",
    ripasso: "Il Monastero di Cluny si trova in Francia.",
    opzioni: ["Svizzera", "Italia", "Francia"],
    giusta: 2,
    bravo: "Francia! Salutatemi i confratelli francesi!",
    sbagliato: "Cluny si trova in FRANCIA!",
  },
  {
    tappa: 3,
    testo: "E il Monastero di San Gallo dove si trova?",
    ripasso: "Il Monastero di San Gallo si trova in Svizzera.",
    opzioni: ["Svizzera", "Francia", "Italia"],
    giusta: 0,
    bravo: "In Svizzera, tra le montagne!",
    sbagliato: "San Gallo è in SVIZZERA!",
  },
];

// Quante domande pescare in ogni tappa (in tutto 12).
const DOMANDE_PER_TAPPA = { 1: 4, 2: 4, 3: 4 };

// Alla sesta risposta sbagliata i soldati raggiungono il carretto e la partita finisce.
const ERRORI_PER_CATTURA = 6;

// Le domande della partita in corso: le sceglie pescaDomande() all'inizio di ogni partita,
// preferendo quelle che non sono uscite nella partita precedente.
const DOMANDE = [];
let domandeUscite = new Set();
function pescaDomande() {
  const scelte = [];
  for (const tappa of [1, 2, 3]) {
    const gruppo = BANCA_DOMANDE.filter((q) => q.tappa === tappa);
    for (let i = gruppo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gruppo[i], gruppo[j]] = [gruppo[j], gruppo[i]];
    }
    gruppo.sort((a, b) => domandeUscite.has(a) - domandeUscite.has(b));
    scelte.push(...gruppo.slice(0, DOMANDE_PER_TAPPA[tappa]));
  }
  domandeUscite = new Set(scelte);
  DOMANDE.length = 0;
  DOMANDE.push(...scelte);
}
pescaDomande();

// I tre finali. "minimo" = risposte giuste necessarie (vale il primo che corrisponde).
// Il finale "fiamme" arriva solo quando i soldati raggiungono il carretto (ERRORI_PER_CATTURA).
const FINALI = [
  {
    tipo: "vittoria",
    minimo: DOMANDE.length,
   
    titolo: "SALVI!",
    testo: "Ottimo lavoro! Abbiamo salvato gli inni, così li potrete studiare in classe tra 1000 anni!",
  },
  {
    tipo: "quasi",
    minimo: 0,
   
    titolo: "QUASI SALVI!",
    testo: "Non male, miei novizi... ma si può sempre migliorare!",
  },
  {
    tipo: "fiamme",
    minimo: 0,
   
    titolo: "PRESI!",
    testo: "Avete lasciato che i soldati incendiassero tutti i nostri inni!",
  },
];
