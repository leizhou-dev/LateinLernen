import type { Word } from './types';
import { nfc, stripMacrons } from './text';

export type Case = 'Nom' | 'Gen' | 'Dat' | 'Akk' | 'Abl' | 'Vok';
export type Num = 'Sg' | 'Pl';
export type VerbKey = 'inf' | '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'impSg' | 'impPl';

/** Reihenfolge wie in den Tabellen des Buches */
export const CASES_TABLE: Case[] = ['Nom', 'Gen', 'Dat', 'Akk', 'Abl'];
export const CASE_LABEL: Record<Case, string> = {
  Nom: 'Nominativ', Gen: 'Genitiv', Dat: 'Dativ', Akk: 'Akkusativ', Abl: 'Ablativ', Vok: 'Vokativ',
};
export const NUM_LABEL: Record<Num, string> = { Sg: 'Singular', Pl: 'Plural' };

/** In welcher Lektion ein Kasus eingeführt wird */
export const CASE_FROM: Record<Case, number> = { Nom: 1, Akk: 3, Dat: 5, Vok: 6, Gen: 7, Abl: 9 };
export const NEUTER_FROM = 11;

export const VERB_KEYS: VerbKey[] = ['inf', '1sg', '2sg', '3sg', '1pl', '2pl', '3pl', 'impSg', 'impPl'];
export const PERSON_KEYS: VerbKey[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
export const VERB_LABEL: Record<VerbKey, string> = {
  inf: 'Infinitiv',
  '1sg': '1. Person Singular', '2sg': '2. Person Singular', '3sg': '3. Person Singular',
  '1pl': '1. Person Plural', '2pl': '2. Person Plural', '3pl': '3. Person Plural',
  impSg: 'Imperativ Singular', impPl: 'Imperativ Plural',
};
export const VERB_SHORT: Record<VerbKey, string> = {
  inf: 'Inf.', '1sg': '1. Sg.', '2sg': '2. Sg.', '3sg': '3. Sg.',
  '1pl': '1. Pl.', '2pl': '2. Pl.', '3pl': '3. Pl.', impSg: 'Imp. Sg.', impPl: 'Imp. Pl.',
};
export const VERB_KEY_FROM: Record<VerbKey, number> = {
  inf: 2, '3sg': 2, '3pl': 2, '1sg': 4, '2sg': 4, '1pl': 4, '2pl': 4, impSg: 6, impPl: 6,
};
export const CONJ_FROM: Record<string, number> = { e: 2, esse: 2, a: 8, i: 10 };
export const CONJ_LABEL: Record<string, string> = {
  a: 'a-Konjugation', e: 'e-Konjugation', i: 'i-Konjugation', esse: 'Hilfsverb esse',
};

export const PRONOUN_DE: Record<VerbKey, string> = {
  inf: '', '1sg': 'ich', '2sg': 'du', '3sg': 'er (sie, es)', '1pl': 'wir', '2pl': 'ihr', '3pl': 'sie',
  impSg: '(Befehl an eine Person)', impPl: '(Befehl an mehrere)',
};

const NOUN_ENDINGS = {
  a: {
    Sg: { Nom: 'a', Gen: 'ae', Dat: 'ae', Akk: 'am', Abl: 'ā', Vok: 'a' },
    Pl: { Nom: 'ae', Gen: 'ārum', Dat: 'īs', Akk: 'ās', Abl: 'īs', Vok: 'ae' },
  },
  om: {
    Sg: { Nom: 'us', Gen: 'ī', Dat: 'ō', Akk: 'um', Abl: 'ō', Vok: 'e' },
    Pl: { Nom: 'ī', Gen: 'ōrum', Dat: 'īs', Akk: 'ōs', Abl: 'īs', Vok: 'ī' },
  },
  on: {
    Sg: { Nom: 'um', Gen: 'ī', Dat: 'ō', Akk: 'um', Abl: 'ō', Vok: 'um' },
    Pl: { Nom: 'a', Gen: 'ōrum', Dat: 'īs', Akk: 'a', Abl: 'īs', Vok: 'a' },
  },
} as const;

export type NounTable = Record<Num, Record<Case, string>>;

function nounClass(w: Word): 'a' | 'om' | 'on' | null {
  if (w.declension === 'a' && w.latin.endsWith('a')) return 'a';
  if (w.declension === 'o' && w.gender === 'n' && w.latin.endsWith('um')) return 'on';
  if (w.declension === 'o' && w.latin.endsWith('us')) return 'om';
  return null;
}

export function nounStem(w: Word): string {
  const cls = nounClass(w);
  if (cls === 'a') return w.latin.slice(0, -1);
  if (cls) return w.latin.slice(0, -2);
  return w.latin;
}

export function nounEndings(w: Word): NounTable | null {
  const cls = nounClass(w);
  if (!cls) return null;
  const t = NOUN_ENDINGS[cls];
  const res = { Sg: { ...t.Sg }, Pl: { ...t.Pl } } as NounTable;
  // Substantive auf -ius: Vokativ Sg. auf -ī (fīlius → fīlī)
  if (cls === 'om' && nounStem(w).endsWith('i')) res.Sg.Vok = '';
  return res;
}

export function declineNoun(w: Word): NounTable | null {
  const cls = nounClass(w);
  const end = nounEndings(w);
  if (!cls || !end) return null;
  const stem = nounStem(w);
  const out = { Sg: {}, Pl: {} } as NounTable;
  for (const n of ['Sg', 'Pl'] as Num[]) {
    for (const c of Object.keys(end[n]) as Case[]) out[n][c] = nfc(stem + end[n][c]);
  }
  if (cls === 'om' && stem.endsWith('i')) out.Sg.Vok = nfc(stem.slice(0, -1) + 'ī');
  return out;
}

export function canDecline(w: Word, lesson: number): boolean {
  if (w.type !== 'noun' || w.irregular || w.lesson > lesson) return false;
  const cls = nounClass(w);
  if (!cls) return false;
  if (cls === 'on' && lesson < NEUTER_FROM) return false;
  return true;
}

export function unlockedCases(lesson: number, withVocative = false): Case[] {
  return CASES_TABLE.concat(withVocative ? ['Vok'] : []).filter((c) => CASE_FROM[c] <= lesson);
}

function shorten(v: string): string {
  return stripMacrons(v);
}

export type VerbTable = Record<VerbKey, string>;

export function conjugate(w: Word): VerbTable | null {
  if (w.type !== 'verb' || !w.conjugation) return null;
  if (w.conjugation === 'esse') {
    return {
      inf: 'esse', '1sg': 'sum', '2sg': 'es', '3sg': 'est', '1pl': 'sumus', '2pl': 'estis', '3pl': 'sunt',
      impSg: 'es', impPl: 'este',
    };
  }
  const inf = nfc(w.latin);
  if (!inf.endsWith('re')) return null;
  const stem = inf.slice(0, -2); // rīdē / rogā / venī
  const head = stem.slice(0, -1);
  const v = stem.slice(-1);
  const short = head + shorten(v); // rīde / roga / veni
  const t: VerbTable = {
    inf,
    '1sg': w.conjugation === 'a' ? head + 'ō' : short + 'ō',
    '2sg': stem + 's',
    '3sg': short + 't',
    '1pl': stem + 'mus',
    '2pl': stem + 'tis',
    '3pl': w.conjugation === 'i' ? short + 'unt' : short + 'nt',
    impSg: stem,
    impPl: stem + 'te',
  };
  for (const k of VERB_KEYS) t[k] = nfc(t[k]);
  return t;
}

/** Endung (für farbige Hervorhebung wie im Buch) */
export function verbEnding(key: VerbKey, form: string, conj: string): [string, string] {
  if (conj === 'esse') {
    const m: Partial<Record<VerbKey, number>> = { inf: 2, '1sg': 1, '3sg': 1, '1pl': 3, '2pl': 3, '3pl': 2, impPl: 2 };
    const n = m[key] ?? 0;
    return [form.slice(0, form.length - n), form.slice(form.length - n)];
  }
  const ends: Record<VerbKey, string> = {
    inf: 're', '1sg': 'ō', '2sg': 's', '3sg': 't', '1pl': 'mus', '2pl': 'tis',
    '3pl': conj === 'i' ? 'unt' : 'nt', impSg: '', impPl: 'te',
  };
  const e = ends[key];
  return [form.slice(0, form.length - e.length), form.slice(form.length - e.length)];
}

export function canConjugate(w: Word, lesson: number): boolean {
  if (w.type !== 'verb' || !w.conjugation || w.lesson > lesson) return false;
  return (CONJ_FROM[w.conjugation] ?? 99) <= lesson;
}

export function unlockedVerbKeys(lesson: number): VerbKey[] {
  return VERB_KEYS.filter((k) => VERB_KEY_FROM[k] <= lesson);
}

export interface NounReading { num: Num; cas: Case }

/** Alle Bestimmungen einer Form (z. B. servae → Gen. Sg., Dat. Sg., Nom. Pl.) */
export function identifyNoun(w: Word, form: string, lesson: number, withVocative = false): NounReading[] {
  const t = declineNoun(w);
  if (!t) return [];
  const f = nfc(form);
  const res: NounReading[] = [];
  for (const num of ['Sg', 'Pl'] as Num[]) {
    for (const cas of unlockedCases(lesson, withVocative)) if (t[num][cas] === f) res.push({ num, cas });
  }
  return res;
}

export function identifyVerb(w: Word, form: string, lesson: number): VerbKey[] {
  const t = conjugate(w);
  if (!t) return [];
  const f = nfc(form);
  return unlockedVerbKeys(lesson).filter((k) => t[k] === f);
}
