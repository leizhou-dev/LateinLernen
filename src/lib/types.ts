export type WordType =
  | 'noun' | 'verb' | 'adverb' | 'properNoun' | 'phrase'
  | 'conjunction' | 'interrogative' | 'verbForm' | 'pronoun';

export type Gender = 'm' | 'f' | 'n';
export type Declension = 'a' | 'o';
export type Conjugation = 'a' | 'e' | 'i' | 'esse';

export interface Word {
  id: string;
  lesson: number;
  type: WordType;
  latin: string;
  german: string[];
  hint?: string;
  info?: string;
  display?: string;
  gender?: Gender;
  declension?: Declension;
  conjugation?: Conjugation;
  firstPerson?: string;
  firstPersonInBook?: boolean;
  markedAdv?: boolean;
  irregular?: boolean;
  macronCheck?: string;
}

export interface SentencePart { text: string; role: string }
export interface Sentence { latin: string; german: string; parts?: SentencePart[] }

export interface Lesson {
  number: number;
  pages: string;
  grammar: string[];
  syntax: string[];
  methods: string[];
  review: string[];
  words: Word[];
  sentences: Sentence[];
}

export interface VocabData {
  meta: { title: string; version: number; [k: string]: unknown };
  lessons: Lesson[];
}

/** Abfragerichtung: Latein→Deutsch oder Deutsch→Latein */
export type Direction = 'ld' | 'dl';
export type AnswerMode = 'choice' | 'handwriting' | 'keyboard' | 'card';

export interface CardProgress {
  /** 0 = neu / aussortiert, 1–5 = Anzahl bestandener Wiederholungen */
  level: number;
  /** fällig ab (ms seit Epoch); 0 = nie gelernt */
  due: number;
  wrong: number;
  right: number;
  last: number;
}

export interface Settings {
  answerMode: AnswerMode;
  direction: Direction | 'mixed';
  sessionSize: number;
  currentLesson: number;
  speech: boolean;
  showStress: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  answerMode: 'choice',
  direction: 'mixed',
  sessionSize: 10,
  currentLesson: 11,
  speech: true,
  showStress: true,
};
