/**
 * Kurze, eigene Erklärungen zu den Grammatik-Themen der Lektionen 1–11.
 * Tabellen werden automatisch aus dem Wortschatz erzeugt.
 */
export interface GrammarBlock {
  title: string;
  text: string[];
  /** Beispieltabellen: Wörter (lateinisch, wie im Wortschatz) */
  nouns?: string[];
  verbs?: string[];
  /** zeigt nur diese Verbformen (sonst alle bis zur Lektion freigeschalteten) */
  verbKeys?: ('inf' | '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'impSg' | 'impPl')[];
}

export interface LessonGrammar { lesson: number; blocks: GrammarBlock[]; tip?: string }

export const GRAMMAR: LessonGrammar[] = [
  {
    lesson: 1,
    blocks: [
      {
        title: 'Substantive: a- und o-Deklination (Nominativ)',
        text: [
          'Im Lateinischen gibt es keinen Artikel. Beim Übersetzen entscheidest du selbst: „der Sklave“, „ein Sklave“ oder nur „Sklaven“.',
          'Jedes Substantiv hat ein Genus: m (maskulin), f (feminin), n (neutrum). Wörter auf -a (a-Deklination) sind meist feminin, Wörter auf -us (o-Deklination) meist maskulin.',
          'An der Endung erkennst du Numerus (Singular/Plural), Kasus (Fall) und Deklinationsklasse. Der Nominativ ist der 1. Fall.',
        ],
        nouns: ['serva', 'servus'],
      },
      {
        title: 'Aussprache und Betonung',
        text: [
          'Zweisilbige Wörter betont man auf der ersten Silbe: cámpus, sérvus, Róma.',
          'Längere Wörter betont man auf der vorletzten Silbe, wenn sie lang ist (Romā́nus) – sonst auf der drittletzten (dóminus).',
          'Lang ist eine Silbe mit Längenstrich (ā, ē …), mit Doppellaut (ae, au) oder vor zwei Konsonanten (campus).',
          'In der App ist der betonte Vokal farbig markiert.',
        ],
      },
    ],
    tip: 'Viele lateinische Wörter leben in anderen Sprachen weiter – campus → Camping, camp, campo.',
  },
  {
    lesson: 2,
    blocks: [
      {
        title: 'Verben: e-Konjugation und esse (3. Person, Infinitiv)',
        text: [
          'Der Infinitiv (Grundform) endet auf -re: rīdē-re „lachen“.',
          '3. Person Singular endet auf -t, 3. Person Plural auf -nt.',
          'Die e-Konjugation heißt so, weil der Wortstamm auf -ē endet (rīdē-). Das Hilfsverb esse musst du extra lernen.',
        ],
        verbs: ['rīdēre', 'esse'],
        verbKeys: ['inf', '3sg', '3pl'],
      },
      {
        title: 'Subjekt und Prädikat',
        text: [
          'Ein einfacher Satz besteht aus Subjekt (wer oder was?) und Prädikat (was wird ausgesagt?).',
          'Subjekt und Prädikat stimmen im Numerus überein (Kongruenz): servus ridet – servi rident.',
          'Ein Substantiv kann mit esse das Prädikat bilden (Prädikatsnomen: Cornelia puella est) oder ein anderes Substantiv näher erklären (Attribut: Cornelia puella ridet).',
        ],
      },
    ],
    tip: 'Karteikarten-Technik: vorne Latein, hinten Deutsch – Wörter, die du nicht kannst, sortierst du aus und übst sie extra. Genau das macht die App für dich.',
  },
  {
    lesson: 3,
    blocks: [
      {
        title: 'Substantive: Akkusativ',
        text: [
          'Der Akkusativ ist der 4. Fall: Sg. -am / -um, Pl. -ās / -ōs.',
          'Der Akkusativ ist meist Objekt. Du fragst: wen oder was?',
        ],
        nouns: ['serva', 'servus'],
      },
      {
        title: 'Satzbau beim Übersetzen',
        text: [
          'Im Lateinischen steht das Prädikat meist am Ende, im Deutschen an zweiter Stelle: Avus servum monet → Der Großvater ermahnt den Sklaven.',
          'Das Subjekt kann im Prädikat stecken: Rident. → Sie lachen.',
          'Konjunktionen (et, neque, sed, nam) und Adverbien (hic, ibi) verbinden Sätze.',
        ],
      },
    ],
  },
  {
    lesson: 4,
    blocks: [
      {
        title: 'Verben: e-Konjugation und esse (alle Personen)',
        text: [
          'Endungen: 1. Sg. -ō, 2. Sg. -s, 3. Sg. -t, 1. Pl. -mus, 2. Pl. -tis, 3. Pl. -nt.',
          'Lerne bei jedem Verb die 1. Person Singular mit: rīdēre, rīdeō.',
        ],
        verbs: ['rīdēre', 'esse'],
      },
    ],
    tip: 'Lerne mit mehreren Sinnen: Wörter laut sprechen (🔊), schreiben (✎) und anschauen.',
  },
  {
    lesson: 5,
    blocks: [
      {
        title: 'Substantive: Dativ',
        text: [
          'Der Dativ ist der 3. Fall: Sg. -ae / -ō, Pl. -īs / -īs. Du fragst: wem?',
          'Manche Verben haben ein Dativ- und ein Akkusativobjekt: Servus dominō tabulam praebet – Der Sklave gibt dem Herrn die Tafel.',
        ],
        nouns: ['serva', 'servus'],
      },
    ],
  },
  {
    lesson: 6,
    blocks: [
      {
        title: 'Imperativ (Befehlsform)',
        text: [
          'Singular = Verbstamm: rīdē! lache! – Plural mit -te: rīdēte! lacht!',
          'esse: es! sei! – este! seid!',
        ],
        verbs: ['rīdēre', 'esse'],
        verbKeys: ['impSg', 'impPl'],
      },
      {
        title: 'Vokativ (Anredefall)',
        text: [
          'Mit dem Vokativ (5. Fall) redet man jemanden an. Er sieht meist aus wie der Nominativ: Respondē, puella!',
          'Ausnahme: Wörter auf -us haben -e (serve!), Wörter auf -ius haben -ī (fīlī!, Gaī!).',
        ],
      },
    ],
    tip: 'Knüpfe an Bekanntes an: aqua → Aquarium, tabula → Tabelle. Die 🔗-Hinweise in der App helfen dir dabei.',
  },
  {
    lesson: 7,
    blocks: [
      {
        title: 'Substantive: Genitiv',
        text: [
          'Der Genitiv ist der 2. Fall: Sg. -ae / -ī, Pl. -ārum / -ōrum. Du fragst: wessen?',
          'Als Attribut zeigt er, wem etwas gehört: equus avī – das Pferd des Großvaters.',
        ],
        nouns: ['serva', 'servus'],
      },
    ],
    tip: 'Genauigkeit ist angesagt: Lerne bei den Vokabeln jeden Buchstaben – und jedes Längenzeichen!',
  },
  {
    lesson: 8,
    blocks: [
      {
        title: 'Verben: a-Konjugation',
        text: [
          'Der Stamm endet auf -ā (rogā-). Die Endungen sind dieselben wie bei der e-Konjugation.',
          'Achtung: 1. Sg. rogō (nicht rogaō).',
        ],
        verbs: ['rogāre'],
      },
    ],
    tip: 'Fünf Wiederholungen: am Abend, am nächsten Tag, nach zwei Tagen, am Wochenende, vor der Arbeit. Die App plant das automatisch.',
  },
  {
    lesson: 9,
    blocks: [
      {
        title: 'Substantive: Ablativ',
        text: [
          'Der Ablativ ist der 6. Fall – im Deutschen gibt es ihn nicht. Sg. -ā / -ō, Pl. -īs / -īs.',
          'Man übersetzt ihn oft mit „mit“ oder „durch“: Ablativ des Mittels (womit? wodurch?): ventō – durch den Wind.',
        ],
        nouns: ['cēna', 'ventus'],
      },
    ],
    tip: 'Vor einer Arbeit: eine Woche vorher anfangen, jeden Tag Vokabeln, Grammatik und Übersetzung – mit dem Neuesten beginnen.',
  },
  {
    lesson: 10,
    blocks: [
      {
        title: 'Verben: i-Konjugation',
        text: [
          'Der Stamm endet auf -ī (venī-). Die Endungen sind dieselben wie bei a- und e-Konjugation.',
          'In der 3. Person Plural kommt ein -u- dazu (Bindevokal): veni-u-nt.',
        ],
        verbs: ['venīre'],
      },
    ],
    tip: 'Ordne Wörter in Gruppen: nach Wortarten, nach Wortfamilien (scīre – nescīre) oder erfinde eine Geschichte mit den neuen Wörtern.',
  },
  {
    lesson: 11,
    blocks: [
      {
        title: 'Substantive: o-Deklination – Neutra auf -um',
        text: [
          'Bei Neutra sind Nominativ und Akkusativ immer gleich: Sg. -um, Pl. -a.',
          'Die anderen Endungen sind wie bei den Wörtern auf -us.',
        ],
        nouns: ['dōnum'],
      },
    ],
    tip: 'Sachfelder: Sammle Wörter zu einem Thema, z. B. „Lernen“: lūdus, audīre, scīre, discipulus, docēre …',
  },
];
