const MACRON: Record<string, string> = {
  a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū', y: 'ȳ',
  A: 'Ā', E: 'Ē', I: 'Ī', O: 'Ō', U: 'Ū', Y: 'Ȳ',
};
const PLAIN: Record<string, string> = Object.fromEntries(
  Object.entries(MACRON).map(([k, v]) => [v, k]),
);

export const MACRON_VOWELS = ['ā', 'ē', 'ī', 'ō', 'ū'];

export function nfc(s: string): string {
  return s.normalize('NFC');
}

export function stripMacrons(s: string): string {
  return [...nfc(s)].map((c) => PLAIN[c] ?? c).join('');
}

export function isVowel(c: string): boolean {
  return /[aeiouyāēīōūȳ]/i.test(c);
}

export function hasMacron(c: string): boolean {
  return c in PLAIN;
}

/** ā ⇄ a usw. Nicht-Vokale bleiben unverändert. */
export function toggleMacron(c: string): string {
  if (PLAIN[c]) return PLAIN[c];
  if (MACRON[c]) return MACRON[c];
  return c;
}

/** Vergleichsform für lateinische Antworten: Längenzeichen bleiben erhalten. */
export function normalizeLatin(s: string): string {
  return nfc(s)
    .toLowerCase()
    .replace(/…|\.\.\./g, ' ')
    .replace(/[.,!?;:„“"'»«()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prüft, ob sich zwei lateinische Antworten nur in den Längenzeichen unterscheiden.
 * Gibt die Indizes (in `given`) der Buchstaben zurück, deren Längenzeichen falsch ist,
 * oder null, wenn sich die Wörter auch in den Buchstaben unterscheiden.
 */
export function macronDiff(expected: string, given: string): number[] | null {
  const e = [...normalizeLatin(expected)];
  const g = [...normalizeLatin(given)];
  if (e.length !== g.length) return null;
  const bad: number[] = [];
  for (let i = 0; i < e.length; i++) {
    if (e[i] === g[i]) continue;
    if (stripMacrons(e[i]) === stripMacrons(g[i])) bad.push(i);
    else return null;
  }
  return bad;
}

export function normalizeGerman(s: string): string {
  return nfc(s)
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[.,!?;:„“"'»«]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ä→ae usw., damit „Graeber“ und „Gräber“ als gleich gelten */
export function foldUmlauts(s: string): string {
  return s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
}

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function shuffle<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
