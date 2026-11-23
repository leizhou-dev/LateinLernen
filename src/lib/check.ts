import type { Word } from './types';
import {
  normalizeLatin, macronDiff, normalizeGerman, foldUmlauts, levenshtein, stripMacrons,
} from './text';

export type Verdict = 'correct' | 'typo' | 'macron' | 'wrong';

export interface LatinCheck {
  verdict: Verdict;
  /** Zeichenpositionen mit falschem/fehlendem Längenzeichen (bei verdict = 'macron') */
  badMacrons?: number[];
}

/** Was im Feld „Latein“ als Antwort erwartet wird. Verben: Infinitiv + 1. Pers. Sg. */
export function latinTargets(w: Word): string[] {
  if (w.type === 'verb' && w.firstPerson) return [w.latin, w.firstPerson];
  return [w.latin];
}

export function latinDisplay(w: Word): string {
  if (w.type === 'verb' && w.firstPerson) return `${w.latin}, ${w.firstPerson}`;
  return w.latin;
}

export function germanDisplay(w: Word, max = 99): string {
  return (w.display ? [w.display] : w.german).slice(0, max).join(', ');
}

/** Strenge Prüfung: Buchstaben UND Längenzeichen müssen stimmen. */
export function checkLatin(expected: string, given: string): LatinCheck {
  const e = normalizeLatin(expected);
  const g = normalizeLatin(given);
  if (!g) return { verdict: 'wrong' };
  if (e === g) return { verdict: 'correct' };
  const d = macronDiff(e, g);
  if (d && d.length) return { verdict: 'macron', badMacrons: d };
  return { verdict: 'wrong' };
}

/** Prüft mehrere Felder (z. B. Infinitiv und 1. Pers. Sg.). Schlechtestes Ergebnis zählt. */
export function checkLatinParts(expected: string[], given: string[]): LatinCheck[] {
  return expected.map((e, i) => checkLatin(e, given[i] ?? ''));
}

export function worst(vs: Verdict[]): Verdict {
  const order: Verdict[] = ['wrong', 'macron', 'typo', 'correct'];
  for (const o of order) if (vs.includes(o)) return o;
  return 'correct';
}

const ARTICLES = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer)\s+/;

/** Alle akzeptierten Schreibweisen einer deutschen Bedeutung */
export function germanVariants(meaning: string): string[] {
  const out = new Set<string>();
  const add = (s: string) => {
    let t = normalizeGerman(s).replace(/\bm inf\b/g, '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    out.add(t);
    const noArt = t.replace(ARTICLES, '');
    out.add(noArt);
    if (noArt.startsWith('sich ')) out.add(noArt.slice(5));
  };
  // „(m. Inf.)“ und ähnliche Hinweise entfernen
  const base = meaning.replace(/\(m\. Inf\.\)/g, '').trim();
  // Klammern weglassen: „die (Schreib-)Tafel“ → „die Tafel“, „warten (auf)“ → „warten“
  add(base.replace(/\([^)]*\)/g, ' '));
  // Klammern auflösen: „(Schreib-)Tafel“ → „Schreibtafel“, „(vor)bereiten“ → „vorbereiten“
  add(base.replace(/\(([^)]*?)-\)/g, '$1').replace(/\(([^)]*)\)/g, '$1'));
  // Ausrufe wie „leb wohl! lebt wohl!“ einzeln
  for (const p of base.split('!')) if (p.trim()) add(p);
  return [...out];
}

export interface GermanCheck { verdict: Verdict; matched?: string }

/** Latein → Deutsch: Eine der Bedeutungen genügt; kleine Tippfehler werden toleriert. */
export function checkGerman(w: Word, given: string): GermanCheck {
  const pieces = given.split(/[,;/]| und /).map((p) => p.trim()).filter(Boolean);
  if (!pieces.length) return { verdict: 'wrong' };
  let typo: string | undefined;
  for (const m of w.german) {
    const vars = germanVariants(m).map(foldUmlauts);
    for (const piece of pieces) {
      const g = foldUmlauts(normalizeGerman(piece));
      const gNoArt = g.replace(ARTICLES, '');
      for (const v of vars) {
        if (v === g || v === gNoArt) return { verdict: 'correct', matched: m };
        const tol = v.length >= 9 ? 2 : v.length >= 5 ? 1 : 0;
        if (tol && (levenshtein(v, g) <= tol || levenshtein(v, gNoArt) <= tol)) typo = typo ?? m;
      }
    }
  }
  if (typo) return { verdict: 'typo', matched: typo };
  return { verdict: 'wrong' };
}

/** Falsche Längenzeichen-Variante als Ablenker für Auswahlfragen */
export function macronVariant(s: string, rnd: () => number = Math.random): string | null {
  const plain = stripMacrons(s);
  if (plain !== s) {
    // entweder alle Längen weglassen oder eine Länge verschieben
    if (rnd() < 0.5) return plain;
    const chars = [...s];
    const marked = chars.map((c, i) => (c !== stripMacrons(c) ? i : -1)).filter((i) => i >= 0);
    const vowels = chars.map((c, i) => (/[aeiou]/.test(c) ? i : -1)).filter((i) => i >= 0);
    if (!vowels.length) return plain;
    const out = [...chars];
    const rm = marked[Math.floor(rnd() * marked.length)];
    out[rm] = stripMacrons(out[rm]);
    const add = vowels[Math.floor(rnd() * vowels.length)];
    out[add] = ({ a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' } as Record<string, string>)[out[add]] ?? out[add];
    const v = out.join('');
    return v !== s ? v : plain;
  }
  const chars = [...s];
  const vowels = chars.map((c, i) => (/[aeiou]/.test(c) ? i : -1)).filter((i) => i >= 0);
  if (!vowels.length) return null;
  const k = vowels[Math.floor(rnd() * vowels.length)];
  chars[k] = ({ a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū' } as Record<string, string>)[chars[k]];
  return chars.join('');
}
