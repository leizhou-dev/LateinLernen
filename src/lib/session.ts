import type { Direction, Word } from './types';
import { cardKey, isDue, isProblem, isSeen, type Progress } from './srs';
import { latinDisplay, germanDisplay, macronVariant } from './check';
import { shuffle } from './text';

export type SessionKind = 'due' | 'new' | 'lesson' | 'problem';

export interface Card { word: Word; dir: Direction }

export interface SessionOptions {
  kind: SessionKind;
  lessons: number[];
  direction: Direction | 'mixed';
  size: number;
  now: number;
}

function dirs(d: Direction | 'mixed'): Direction[] {
  return d === 'mixed' ? ['ld', 'dl'] : [d];
}

export function buildSession(words: Word[], progress: Progress, o: SessionOptions): Card[] {
  const pool = words.filter((w) => o.lessons.includes(w.lesson));
  const cards: Card[] = [];
  for (const w of pool) for (const dir of dirs(o.direction)) cards.push({ word: w, dir });
  const p = (c: Card) => progress[cardKey(c.word.id, c.dir)];

  switch (o.kind) {
    case 'due': {
      const due = cards.filter((c) => isDue(p(c), o.now)).sort((a, b) => p(a)!.due - p(b)!.due);
      return shuffle(due.slice(0, o.size));
    }
    case 'new': {
      // in Buchreihenfolge; Latein→Deutsch vor Deutsch→Latein
      const fresh = cards.filter((c) => !isSeen(p(c)));
      fresh.sort((a, b) => (a.word.id < b.word.id ? -1 : a.word.id > b.word.id ? 1 : a.dir === 'ld' ? -1 : 1));
      const picked: Card[] = [];
      for (const c of fresh) {
        if (picked.length >= o.size) break;
        picked.push(c);
      }
      // erst alle ld, dann dl derselben Wörter
      return [...picked.filter((c) => c.dir === 'ld'), ...shuffle(picked.filter((c) => c.dir === 'dl'))];
    }
    case 'problem':
      return shuffle(cards.filter((c) => isProblem(p(c)))).slice(0, o.size);
    case 'lesson':
    default:
      return shuffle(cards).slice(0, o.size);
  }
}

export function countDue(words: Word[], progress: Progress, now: number): number {
  let n = 0;
  for (const w of words) for (const d of ['ld', 'dl'] as Direction[]) if (isDue(progress[cardKey(w.id, d)], now)) n++;
  return n;
}

export function countNew(words: Word[], progress: Progress, lessons?: number[]): number {
  let n = 0;
  for (const w of words) {
    if (lessons && !lessons.includes(w.lesson)) continue;
    for (const d of ['ld', 'dl'] as Direction[]) if (!isSeen(progress[cardKey(w.id, d)])) n++;
  }
  return n;
}

export function countProblems(words: Word[], progress: Progress): number {
  let n = 0;
  for (const w of words) for (const d of ['ld', 'dl'] as Direction[]) if (isProblem(progress[cardKey(w.id, d)])) n++;
  return n;
}

/** Vier Auswahlmöglichkeiten; bei Deutsch→Latein ist immer eine Längenzeichen-Falle dabei. */
export function choicesFor(card: Card, all: Word[], rnd: () => number = Math.random): string[] {
  const w = card.word;
  const sameType = (x: Word) =>
    x.id !== w.id && (x.type === w.type || (w.type === 'properNoun' && x.type === 'noun'));
  const near = shuffle(all.filter((x) => sameType(x) && Math.abs(x.lesson - w.lesson) <= 2), rnd);
  const far = shuffle(all.filter((x) => sameType(x)), rnd);
  const others = [...near, ...far];

  if (card.dir === 'dl') {
    const right = latinDisplay(w);
    const opts = new Set<string>([right]);
    const trap = macronVariant(right, rnd);
    if (trap && trap !== right) opts.add(trap);
    for (const o of others) {
      if (opts.size >= 4) break;
      opts.add(latinDisplay(o));
    }
    return shuffle([...opts], rnd);
  }
  const right = germanDisplay(w, 3);
  const opts = new Set<string>([right]);
  for (const o of others) {
    if (opts.size >= 4) break;
    const g = germanDisplay(o, 3);
    if (!w.german.some((m) => o.german.includes(m))) opts.add(g);
  }
  return shuffle([...opts], rnd);
}
