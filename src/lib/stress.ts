import { nfc, hasMacron, stripMacrons } from './text';

/**
 * Betonung nach den Regeln im Buch (Lektion 1, S. 146):
 *  - zweisilbige Wörter: erste Silbe
 *  - mehrsilbige: vorletzte Silbe, wenn sie lang ist, sonst drittletzte
 *  - lang: Längenzeichen, Diphthong (ae, au, oe, eu) oder zwei+ Konsonanten danach
 * Gibt für ein einzelnes Wort den Zeichenbereich [start, end) des betonten Vokals zurück,
 * oder null bei einsilbigen Wörtern.
 */
export function stressRange(word: string): [number, number] | null {
  const ch = [...nfc(word)];
  const lo = ch.map((c) => stripMacrons(c).toLowerCase());
  const isV = (i: number) => /[aeiouy]/.test(lo[i] ?? '');

  interface Nucleus { start: number; end: number; long: boolean }
  const nuclei: Nucleus[] = [];
  for (let i = 0; i < ch.length; i++) {
    if (!isV(i)) continue;
    const c = lo[i];
    // u nach q, und gu vor Vokal nach n (lingua) ist konsonantisch
    if (c === 'u' && lo[i - 1] === 'q') continue;
    if (c === 'u' && lo[i - 1] === 'g' && lo[i - 2] === 'n' && isV(i + 1)) continue;
    // i am Wortanfang vor Vokal ist konsonantisch (iam, Iulia)
    if (c === 'i' && i === 0 && isV(1) && !hasMacron(ch[0])) continue;
    // i zwischen Vokalen ist konsonantisch
    if (c === 'i' && i > 0 && isV(i - 1) && isV(i + 1) && !hasMacron(ch[i])) {
      const prev = nuclei[nuclei.length - 1];
      if (prev && prev.end === i) continue;
    }
    const pair = c + (lo[i + 1] ?? '');
    if (['ae', 'au', 'oe', 'eu'].includes(pair) && !hasMacron(ch[i + 1] ?? '') && !hasMacron(ch[i])) {
      nuclei.push({ start: i, end: i + 2, long: true });
      i++;
      continue;
    }
    nuclei.push({ start: i, end: i + 1, long: hasMacron(ch[i]) });
  }
  if (nuclei.length < 2) return null;
  if (nuclei.length === 2) return [nuclei[0].start, nuclei[0].end];

  const pen = nuclei[nuclei.length - 2];
  const next = nuclei[nuclei.length - 1];
  let cons = 0;
  for (let j = pen.end; j < next.start; j++) {
    const c = lo[j];
    if (c === 'h') continue;
    if (c === 'x') cons += 2;
    else if (c === 'u') continue; // qu / ngu
    else if ((c === 'c' || c === 'p' || c === 't') && lo[j + 1] === 'h') { cons += 1; j++; }
    else cons += 1;
  }
  const long = pen.long || cons >= 2;
  const n = long ? pen : nuclei[nuclei.length - 3];
  return [n.start, n.end];
}

export interface StressSegment { text: string; stressed: boolean }

/** Zerlegt einen (auch mehrwortigen) lateinischen Ausdruck in Segmente mit Betonungsmarkierung. */
export function stressSegments(text: string): StressSegment[] {
  const out: StressSegment[] = [];
  const parts = nfc(text).split(/([^A-Za-zĀ-ȳ]+)/u);
  for (const p of parts) {
    if (!p) continue;
    if (!/[A-Za-zĀ-ȳ]/u.test(p)) { out.push({ text: p, stressed: false }); continue; }
    const r = stressRange(p);
    const chars = [...p];
    if (!r) { out.push({ text: p, stressed: false }); continue; }
    if (r[0] > 0) out.push({ text: chars.slice(0, r[0]).join(''), stressed: false });
    out.push({ text: chars.slice(r[0], r[1]).join(''), stressed: true });
    if (r[1] < chars.length) out.push({ text: chars.slice(r[1]).join(''), stressed: false });
  }
  return out;
}
