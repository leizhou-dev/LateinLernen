import type { CardProgress, Direction, Word } from './types';

/**
 * Fünf Wiederholungen in wachsenden Abständen (Buch, Lektion 8, S. 163):
 *  1. WH am Abend des ersten Lernens → einige Stunden später
 *  2. WH am nächsten Tag
 *  3. WH nach weiteren zwei Tagen
 *  4. WH am Wochenende → nach etwa drei bis vier Tagen
 *  5. WH vor der Prüfungsarbeit → nach etwa einer Woche
 * Danach gilt ein Wort als „im Gedächtnis verankert“ und wird nur noch monatlich aufgefrischt.
 * Falsch beantwortet → aussortieren: zurück auf Stufe 0, muss die fünf WH erneut „überstehen“.
 */
export const MAX_LEVEL = 5;
const HOUR = 3600_000;
const DAY = 24 * HOUR;

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function nextDue(level: number, now: number): number {
  switch (level) {
    case 1: return now + 3 * HOUR;
    case 2: return startOfDay(now) + 1 * DAY;
    case 3: return startOfDay(now) + 2 * DAY;
    case 4: return startOfDay(now) + 4 * DAY;
    case 5: return startOfDay(now) + 7 * DAY;
    default: return startOfDay(now) + 30 * DAY; // aufgefrischt nach Stufe 5
  }
}

export function cardKey(wordId: string, dir: Direction): string {
  return `${wordId}:${dir}`;
}

export function newCard(): CardProgress {
  return { level: 0, due: 0, wrong: 0, right: 0, last: 0 };
}

export function review(p: CardProgress | undefined, correct: boolean, now: number): CardProgress {
  const c = { ...(p ?? newCard()) };
  c.last = now;
  if (correct) {
    const wasMax = c.level >= MAX_LEVEL;
    c.right += 1;
    c.level = Math.min(MAX_LEVEL, c.level + 1);
    c.due = nextDue(wasMax ? 6 : c.level, now);
  } else {
    c.wrong += 1;
    c.level = 0;
    c.due = now; // sofort wieder fällig
  }
  return c;
}

export function isSeen(p: CardProgress | undefined): boolean {
  return !!p && p.last > 0;
}

export function isDue(p: CardProgress | undefined, now: number): boolean {
  return isSeen(p) && p!.due <= now;
}

/** Problemwort: mindestens zweimal falsch und noch nicht wieder gefestigt */
export function isProblem(p: CardProgress | undefined): boolean {
  return !!p && p.wrong >= 2 && p.level < 3;
}

export type Progress = Record<string, CardProgress>;

export function wordLevel(progress: Progress, w: Word): number {
  const a = progress[cardKey(w.id, 'ld')]?.level ?? 0;
  const b = progress[cardKey(w.id, 'dl')]?.level ?? 0;
  return Math.min(a, b);
}
