// ================================================================
//  MONTECASSINO ESCAPE · contenuti del gioco
//  Questo è l'unico file da modificare per cambiare domande e testi.
//  - "giusta" è la posizione dell'opzione corretta, contando da 0
//    (0 = prima opzione, 1 = seconda, 2 = terza).
//  - "tappa" indica in quale ambientazione compare la domanda (1, 2 o 3).
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

// Didascalie della scena iniziale (testo delle istruzioni del progetto Scratch).
const DIDASCALIE = [
  "1239: i soldati di Federico II di Svevia devastano l'Abbazia di Montecassino.",
  "Nel famoso scriptorium dell'Abbazia sono nati i preziosi inni gregoriani.",
  "L'Abate Stefano II deve metterli in salvo in una vicina abbazia, prima che il portone ceda!",
];

const INTRO = [
  "Benvenuti, miei fidati novizi! Come potete vedere, i soldati hanno devastato il nostro povero monastero...",
  "Ho recuperato dalla biblioteca i nostri inni sacri appena in tempo, e con il vostro aiuto li porteremo in salvo all'abbazia più vicina!",
];
const DOMANDA_INIZIALE = "Siete con me?";
const RISPOSTA_SI = "Molto bene miei prodi discepoli! Partiamo!";
const RISPOSTA_NO = "Beh, tanto non avete scelta, perché in quanto novizi avete fatto voto di obbedienza!";
const ISTRUZIONI_CORSA =
  "I soldati di Federico II ci inseguono! Ogni risposta giusta ci fa guadagnare terreno, ogni risposta sbagliata li avvicina e ci fa perdere un libro dal carretto. E non perdete tempo: se esitate troppo, accelerano!";

const DOMANDE = [
  {
    tappa: 1,
    testo: 'Li chiamiamo "Inni Gregoriani" in onore di un famoso "MAGNO"... chi era?',
    opzioni: ["Carlo Magno", "Papa Gregorio Magno", "Alessandro Magno"],
    giusta: 1,
    bravo: "Bravi i miei discepoli!",
    sbagliato: "Il nostro povero Papa Gregorio Magno non sarebbe contento!",
  },
  {
    tappa: 1,
    testo: "In che lingua scriviamo e cantiamo i nostri inni?",
    opzioni: ["Latino", "Volgare", "Italiano"],
    giusta: 0,
    bravo: "Magno Gaudio!",
    sbagliato: "Non correcto est!",
  },
  {
    tappa: 1,
    testo: "Durante le funzioni sacre, accompagniamo il canto con gli strumenti.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Bravi, discìpuli! Gli strumenti distraggono dalla preghiera!!!",
    sbagliato: "Ah, vi piacerebbe far baccano durante le sacre funzioni, eh?! È Falso!",
  },
  {
    tappa: 1,
    testo: "Vi ricordate quanti anni è durata la SCHOLA CANTORUM, dove avete imparato a memoria tutti i canti?",
    opzioni: ["5", "9", "15"],
    giusta: 1,
    bravo: "Già! Sembrano volati, vero?",
    sbagliato: "Ahia! Fosse per me ve ne farei fare altri 20!!!",
  },
  {
    tappa: 1,
    testo: "Quando cantiamo, seguiamo tutti quanti la stessa melodia, all'unisono. Questa pratica si chiama:",
    opzioni: ["MONODIA", "POLIFONIA"],
    giusta: 0,
    bravo: "Bene bene, vedo che siete attenti durante le sacre funzioni!",
    sbagliato: "Poffarbacco! Deduco che siate molto distratti mentre cantiamo durante le sacre funzioni!!!",
  },
  {
    tappa: 2,
    testo: "Il nostro Papa Gregorio ha deciso che non possiamo perderci in inutili giochetti musicali, per cui ad ogni sillaba deve corrispondere solo una nota.",
    opzioni: ["Vero", "Falso"],
    giusta: 0,
    bravo: "Ma che soddisfazione questi discepoli ben preparati!!!",
    sbagliato: "Perdindirindina!!! Non sarete mica dei fan dei MELISMI profani!!!",
  },
  {
    tappa: 2,
    testo: "Mi pare di ricordare che l'ANTIPHONARIUM CENTO, con tutti i nostri canti, fosse a Roma, nella Basilica di San Giovanni in Laterano.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Oh, avete ragione, era a San Pietro! Sapete, l'età che avanza...",
    sbagliato: "Non datemi ragione solo perché sono vecchio!! Ora ricordo, era a San Pietro!",
  },
  {
    tappa: 2,
    testo: "Come chiamiamo i nostri bravi monaci che copiano tutto il giorno i vari inni? Monaci...",
    opzioni: ["Cistercensi", "Copiatori", "Amanuensi"],
    giusta: 2,
    bravo: "Superbo! Già vi ci vedo, tutto il giorno allo scrittoio intenti a copiare!!",
    sbagliato: '"AMANUENSI"!',
  },
  {
    tappa: 2,
    testo: "Finalmente, dopo molti anni di tentativi, abbiamo deciso quanti RIGHI usare per scrivere la musica:",
    opzioni: ["3", "4", "5"],
    giusta: 1,
    bravo: "Siete dei mùsici provetti!",
    sbagliato: "Perdincibacco, ma in che anno vivete! Non siamo ancora nel 1400!!!",
  },
  {
    tappa: 3,
    testo: "I NEUMI, ovvero le nostre note, sono infallibili. Infatti indicano sia l'ALTEZZA che la DURATA della nota.",
    opzioni: ["Vero", "Falso"],
    giusta: 1,
    bravo: "Ah già, la DURATA a noi non interessa, perché è un concetto troppo umano!",
    sbagliato: "Miscredenti! A noi interessa solo l'altezza, non la durata! Tanto che a volte ci addormentiamo tenendo una sola nota!",
    suono: "russare",
  },
  {
    tappa: 3,
    testo: "Non ricordo bene... i nomi delle note sono stati stabiliti da un nostro confratello...",
    opzioni: ["Guido d'Arezzo", "San Francesco d'Assisi"],
    giusta: 0,
    bravo: "Ah giusto! Era proprio un bravo monaco!",
    sbagliato: "Anche se parlava agli animali, non vuol dire che adesso gli dobbiamo attribuire anche cose che non ha fatto!!!",
  },
];

// I tre finali. "minimo" = risposte giuste necessarie (vale il primo che corrisponde).
const FINALI = [
  {
    tipo: "vittoria",
    minimo: DOMANDE.length,
   
    titolo: "SALVI!",
    testo: "Ottimo lavoro! Abbiamo salvato gli inni, così li potrete studiare in classe tra 1000 anni!",
  },
  {
    tipo: "quasi",
    minimo: 5,
   
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
