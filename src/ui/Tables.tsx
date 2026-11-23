import type { Word } from '../lib/types';
import {
  declineNoun, nounStem, unlockedCases, CASE_LABEL, conjugate, verbEnding, VERB_LABEL, PRONOUN_DE,
  unlockedVerbKeys, type Case, type VerbKey,
} from '../lib/forms';

function Split({ stem, ending }: { stem: string; ending: string }) {
  return <span class="la">{stem}{ending && <span class="ending">-{ending}</span>}</span>;
}

/** Deklinationstabelle mit hervorgehobenen Endungen (wie im Buch: Stamm-Endung) */
export function NounTableView({ word, lesson, cases }: { word: Word; lesson: number; cases?: Case[] }) {
  const t = declineNoun(word);
  if (!t) return null;
  const stem = nounStem(word);
  const cs = cases ?? unlockedCases(lesson);
  const split = (form: string) => {
    // -ius Vokativ (fīlī) hat einen kürzeren Stamm
    if (form.startsWith(stem)) return <Split stem={stem} ending={form.slice(stem.length)} />;
    return <span class="la">{form}</span>;
  };
  return (
    <table class="ftable">
      <thead><tr><th /><th>Singular</th><th>Plural</th></tr></thead>
      <tbody>
        {cs.map((c) => (
          <tr key={c}>
            <th>{CASE_LABEL[c]}</th>
            <td>{split(t.Sg[c])}</td>
            <td>{split(t.Pl[c])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function VerbTableView({ word, lesson, keys }: { word: Word; lesson: number; keys?: VerbKey[] }) {
  const t = conjugate(word);
  if (!t || !word.conjugation) return null;
  const ks = keys ?? unlockedVerbKeys(lesson);
  const cell = (k: VerbKey) => {
    const [s, e] = verbEnding(k, t[k], word.conjugation!);
    return <><Split stem={s} ending={e} /> <span class="de-small">{PRONOUN_DE[k] && !k.startsWith('imp') ? PRONOUN_DE[k] : ''}</span></>;
  };
  const rows: [string, VerbKey | null, VerbKey | null][] = [];
  if (ks.includes('inf')) rows.push(['Infinitiv', 'inf', null]);
  for (const p of ['1', '2', '3']) {
    const sg = `${p}sg` as VerbKey, pl = `${p}pl` as VerbKey;
    if (ks.includes(sg) || ks.includes(pl)) rows.push([`${p}. Person`, ks.includes(sg) ? sg : null, ks.includes(pl) ? pl : null]);
  }
  if (ks.includes('impSg')) rows.push(['Imperativ', 'impSg', 'impPl']);
  return (
    <table class="ftable">
      <thead><tr><th /><th>Singular</th><th>Plural</th></tr></thead>
      <tbody>
        {rows.map(([label, a, b]) => (
          <tr key={label}>
            <th>{label}</th>
            <td colSpan={b === null && label === 'Infinitiv' ? 2 : 1}>{a ? cell(a) : ''}</td>
            {!(b === null && label === 'Infinitiv') && <td>{b ? cell(b) : ''}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { VERB_LABEL };
