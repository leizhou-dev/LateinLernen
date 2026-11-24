import { createStore, get, set, del } from 'idb-keyval';
import { useEffect, useState } from 'preact/hooks';
import type { CardProgress, Direction, Settings, VocabData, Word, Lesson } from './types';
import { DEFAULT_SETTINGS } from './types';
import { decryptVocab, deriveRawKey, type EncryptedVocab, WrongPasswordError } from './crypto';
import { cardKey, review, type Progress } from './srs';

// Eigene Datenbank, damit sich andere Seiten auf <name>.github.io nicht in die Quere kommen
const db = createStore('latein-lernen', 'kv');

export interface Stats {
  /** 'YYYY-MM-DD' → Anzahl beantworteter Aufgaben */
  days: Record<string, number>;
  formsRight: number;
  formsWrong: number;
  /** Sterne: +1 pro richtiger Antwort, +3 Bonus für eine fehlerfreie Runde (wie in „Artikel lernen“) */
  stars?: number;
}

interface KeyInfo { raw: number[]; salt: string; iter: number }

export interface AppState {
  status: 'loading' | 'locked' | 'ready' | 'error';
  error?: string;
  vocab?: VocabData;
  lessons: Lesson[];
  words: Word[];
  progress: Progress;
  settings: Settings;
  stats: Stats;
  /** neuer Wortschatz liegt vor, konnte aber nicht automatisch entschlüsselt werden */
  newVocabNeedsPassword: boolean;
  contentId?: string;
}

let state: AppState = {
  status: 'loading',
  lessons: [],
  words: [],
  progress: {},
  settings: DEFAULT_SETTINGS,
  stats: { days: {}, formsRight: 0, formsWrong: 0 },
  newVocabNeedsPassword: false,
};

const listeners = new Set<() => void>();
function emit() { for (const l of listeners) l(); }
function update(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
}
export function getState() { return state; }

export function useApp(): AppState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return state;
}

function applyVocab(v: VocabData, contentId?: string) {
  update({
    vocab: v,
    lessons: v.lessons,
    words: v.lessons.flatMap((l) => l.words),
    contentId,
  });
}

let pendingEnc: EncryptedVocab | undefined;

async function fetchEnc(): Promise<EncryptedVocab | undefined> {
  try {
    const r = await fetch('vocab.enc.json', { cache: 'no-cache' });
    if (!r.ok) return undefined;
    return (await r.json()) as EncryptedVocab;
  } catch {
    return undefined; // offline – gespeicherter Wortschatz wird verwendet
  }
}

export async function init() {
  try {
    const [settings, progress, stats, vocab, key, contentId] = await Promise.all([
      get<Settings>('settings', db), get<Progress>('progress', db), get<Stats>('stats', db),
      get<VocabData>('vocab', db), get<KeyInfo>('key', db), get<string>('contentId', db),
    ]);
    update({
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
      progress: progress ?? {},
      stats: stats ?? state.stats,
    });
    if (vocab) applyVocab(vocab, contentId);

    const enc = await fetchEnc();
    if (enc && enc.contentId !== contentId) {
      pendingEnc = enc;
      if (key && key.salt === enc.salt && key.iter === enc.iter) {
        try {
          const v = await decryptVocab(enc, new Uint8Array(key.raw));
          await set('vocab', v, db);
          await set('contentId', enc.contentId, db);
          applyVocab(v, enc.contentId);
          pendingEnc = undefined;
        } catch {
          update({ newVocabNeedsPassword: !!vocab });
        }
      } else if (vocab) {
        update({ newVocabNeedsPassword: true });
      }
    }
    if (state.vocab) update({ status: 'ready' });
    else if (pendingEnc) update({ status: 'locked' });
    else update({ status: 'error', error: 'Der Wortschatz konnte nicht geladen werden. Bitte einmal mit Internetverbindung öffnen.' });
    requestPersistence();
  } catch (e) {
    update({ status: 'error', error: String(e) });
  }
}

/** Passwort eingeben → Wortschatz entschlüsseln und lokal speichern */
export async function unlock(password: string): Promise<'ok' | 'wrong' | 'offline'> {
  const enc = pendingEnc ?? (await fetchEnc());
  if (!enc) return 'offline';
  const raw = await deriveRawKey(password, enc.salt, enc.iter);
  try {
    const v = await decryptVocab(enc, raw);
    await set('vocab', v, db);
    await set('contentId', enc.contentId, db);
    await set('key', { raw: [...raw], salt: enc.salt, iter: enc.iter } satisfies KeyInfo, db);
    pendingEnc = undefined;
    applyVocab(v, enc.contentId);
    update({ status: 'ready', newVocabNeedsPassword: false });
    requestPersistence();
    return 'ok';
  } catch (e) {
    if (e instanceof WrongPasswordError) return 'wrong';
    throw e;
  }
}

export async function showUnlock() {
  if (!pendingEnc) pendingEnc = await fetchEnc();
  update({ status: 'locked' });
}

async function requestPersistence() {
  try { await navigator.storage?.persist?.(); } catch { /* egal */ }
}

let saveTimer: number | undefined;
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    set('progress', state.progress, db);
    set('stats', state.stats, db);
  }, 300);
}

export function today(t = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bumpDay(s: Stats): Stats {
  const k = today();
  return { ...s, days: { ...s.days, [k]: (s.days[k] ?? 0) + 1 } };
}

export const STAR_PER_ANSWER = 1;
export const STAR_BONUS_ROUND = 3;

function withStars(s: Stats, n: number): Stats {
  return n ? { ...s, stars: (s.stars ?? 0) + n } : s;
}

export function recordAnswer(wordId: string, dir: Direction, correct: boolean) {
  const k = cardKey(wordId, dir);
  const progress = { ...state.progress, [k]: review(state.progress[k], correct, Date.now()) };
  update({ progress, stats: withStars(bumpDay(state.stats), correct ? STAR_PER_ANSWER : 0) });
  saveSoon();
}

export function recordForm(correct: boolean) {
  const s = withStars(bumpDay(state.stats), correct ? STAR_PER_ANSWER : 0);
  update({ stats: { ...s, formsRight: s.formsRight + (correct ? 1 : 0), formsWrong: s.formsWrong + (correct ? 0 : 1) } });
  saveSoon();
}

/** Bonus für eine fehlerfreie Runde */
export function addStars(n: number) {
  update({ stats: withStars(state.stats, n) });
  saveSoon();
}

export function setSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  update({ settings });
  set('settings', settings, db);
}

export function streak(stats: Stats, now = Date.now()): number {
  let n = 0;
  const d = new Date(now);
  if (!stats.days[today(d.getTime())]) d.setDate(d.getDate() - 1); // heute noch nicht geübt → ab gestern zählen
  while (stats.days[today(d.getTime())]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// ---------- Sicherung ----------
export interface Backup {
  app: 'latein-lernen';
  version: 1;
  exported: string;
  progress: Progress;
  settings: Settings;
  stats: Stats;
}

export function makeBackup(): Backup {
  return {
    app: 'latein-lernen', version: 1, exported: new Date().toISOString(),
    progress: state.progress, settings: state.settings, stats: state.stats,
  };
}

export async function restoreBackup(b: Backup) {
  if (b?.app !== 'latein-lernen' || typeof b.progress !== 'object') throw new Error('Keine gültige Sicherungsdatei.');
  const progress: Progress = {};
  for (const [k, v] of Object.entries(b.progress)) {
    const p = v as CardProgress;
    if (typeof p?.level === 'number') progress[k] = p;
  }
  update({ progress, settings: { ...DEFAULT_SETTINGS, ...b.settings }, stats: b.stats ?? state.stats });
  await Promise.all([set('progress', progress, db), set('settings', state.settings, db), set('stats', state.stats, db)]);
}

export async function resetProgress() {
  update({ progress: {}, stats: { days: {}, formsRight: 0, formsWrong: 0 } });
  await Promise.all([del('progress', db), del('stats', db)]);
}
