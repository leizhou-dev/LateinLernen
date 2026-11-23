import { useMemo, useState } from 'preact/hooks';
import type { Word } from '../lib/types';
import { useApp, recordForm } from '../lib/store';
import {
  canDecline, canConjugate, declineNoun, conjugate, unlockedCases, unlockedVerbKeys, identifyNoun, identifyVerb,
  CASE_LABEL, NUM_LABEL, VERB_LABEL, VERB_SHORT, CASE_FROM, type Case, type Num, type VerbKey,
} from '../lib/forms';
import { checkLatin, macronVariant } from '../lib/check';
import { shuffle, nfc } from '../lib/text';
import { LatinInput, MacronBar } from './LatinInput';
import { LatinText } from './Latin';
import { latinDisplay } from '../lib/check';

type Exercise = 'build' | 'identify' | 'table-noun' | 'table-verb';
const ROUNDS = 10;

const EX_INFO: Record<Exercise, { title: string; desc: string; icon: string }> = {
  build: { title: 'Form bilden', desc: 'z. B. „Bilde den Dativ Plural von amīcus“', icon: '🛠️' },
  identify: { title: 'Form bestimmen', desc: 'Welcher Kasus / welche Person ist das? Oft gibt es mehrere Lösungen!', icon: '🔍' },
  'table-noun': { title: 'Deklinationstabelle', desc: 'Alle Kasus eines Substantivs ausfüllen', icon: '📋' },
  'table-verb': { title: 'Konjugationstabelle', desc: 'Alle Personen eines Verbs ausfüllen', icon: '📋' },
};

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export function Forms() {
  const [ex, setEx] = useState<Exercise | null>(null);
  const { settings } = useApp();
  if (ex) return <FormSession ex={ex} onClose={() => setEx(null)} />;
  const lesson = settings.currentLesson;
  return (
    <div class="screen">
      <header class="bar"><span /><h1>Formen üben</h1><span /></header>
      <div class="panel">
        <p class="muted">Geübt wird alles bis Lektion {lesson}: Kasus {unlockedCases(lesson).map((c) => CASE_LABEL[c]).join(', ')}
          {lesson >= 2 ? ` · Verbformen: ${unlockedVerbKeys(lesson).map((k) => VERB_SHORT[k]).join(', ')}` : ''}.</p>
        <div class="tiles-grid">
          {(Object.keys(EX_INFO) as Exercise[]).map((e) => (
            <button key={e} class="big-tile" onClick={() => setEx(e)} disabled={e === 'table-verb' && lesson < 2}>
              <span class="bt-icon">{EX_INFO[e].icon}</span>
              <span class="bt-title">{EX_INFO[e].title}</span>
              <span class="bt-desc">{EX_INFO[e].desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface BuildTask { kind: 'build'; word: Word; label: string; answer: string; options?: string[] }
interface IdentifyTask { kind: 'identify'; word: Word; form: string; isNoun: boolean; answers: string[]; options: [string, string][] }
interface TableTask { kind: 'table'; word: Word; isNoun: boolean; cells: { key: string; label: string; answer: string; given?: boolean }[] }
type Task = BuildTask | IdentifyTask | TableTask;

function makeTask(ex: Exercise, words: Word[], lesson: number, choiceMode: boolean): Task | null {
  const nouns = words.filter((w) => canDecline(w, lesson));
  const verbs = words.filter((w) => canConjugate(w, lesson));
  const useVerb = ex === 'table-verb' || ((ex === 'build' || ex === 'identify') && verbs.length > 0 && Math.random() < 0.5);
  if (ex === 'table-noun' || ex === 'table-verb') {
    if (ex === 'table-noun') {
      const w = pick(nouns); const t = declineNoun(w)!;
      // Zeile = Kasus, links Singular, rechts Plural (wie im Buch)
      const cells = unlockedCases(lesson).flatMap((c) => (['Sg', 'Pl'] as Num[]).map((n) => ({
        key: c + n, label: `${CASE_LABEL[c]} ${NUM_LABEL[n]}`, answer: t[n][c], given: c === 'Nom' && n === 'Sg',
      })));
      return { kind: 'table', word: w, isNoun: true, cells };
    }
    const w = pick(verbs); const t = conjugate(w)!;
    const order: VerbKey[] = ['inf', '1sg', '1pl', '2sg', '2pl', '3sg', '3pl', 'impSg', 'impPl'];
    const ks = unlockedVerbKeys(lesson);
    const cells = order.filter((k) => ks.includes(k)).map((k) => ({ key: k, label: VERB_LABEL[k], answer: t[k], given: k === 'inf' }));
    return { kind: 'table', word: w, isNoun: false, cells };
  }
  if (ex === 'build') {
    if (useVerb) {
      const w = pick(verbs); const t = conjugate(w)!;
      const k = pick(unlockedVerbKeys(lesson).filter((x) => x !== 'inf'));
      const others = shuffle([...new Set(Object.values(t))].filter((f) => f !== t[k])).slice(0, 2);
      const trap = macronVariant(t[k]);
      const options = choiceMode ? shuffle([...new Set([t[k], ...(trap ? [trap] : []), ...others])].slice(0, 4)) : undefined;
      return { kind: 'build', word: w, label: VERB_LABEL[k], answer: t[k], options };
    }
    const w = pick(nouns); const t = declineNoun(w)!;
    const cases = unlockedCases(lesson, lesson >= CASE_FROM.Vok);
    const c = pick(cases.length > 1 ? cases.filter((x) => x !== 'Nom') : cases);
    const n = pick(['Sg', 'Pl'] as Num[]);
    const answer = t[n][c];
    const all = [...new Set([...Object.values(t.Sg), ...Object.values(t.Pl)])].filter((f) => f !== answer);
    const trap = macronVariant(answer);
    const options = choiceMode ? shuffle([...new Set([answer, ...(trap ? [trap] : []), ...shuffle(all).slice(0, 2)])].slice(0, 4)) : undefined;
    return { kind: 'build', word: w, label: `${CASE_LABEL[c]} ${NUM_LABEL[n]}`, answer, options };
  }
  // identify
  if (useVerb) {
    const w = pick(verbs); const t = conjugate(w)!;
    const keys = unlockedVerbKeys(lesson).filter((k) => k !== 'inf');
    const form = t[pick(keys)];
    return {
      kind: 'identify', word: w, form, isNoun: false,
      answers: identifyVerb(w, form, lesson),
      options: keys.map((k) => [k, VERB_SHORT[k]] as [string, string]),
    };
  }
  const w = pick(nouns); const t = declineNoun(w)!;
  const cases = unlockedCases(lesson);
  const form = t[pick(['Sg', 'Pl'] as Num[])][pick(cases)];
  return {
    kind: 'identify', word: w, form, isNoun: true,
    answers: identifyNoun(w, form, lesson).map((r) => r.cas + r.num),
    options: (['Sg', 'Pl'] as Num[]).flatMap((n) => cases.map((c) => [c + n, `${CASE_LABEL[c as Case].slice(0, 3)}. ${n}.`] as [string, string])),
  };
}

function FormSession({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const app = useApp();
  const lesson = app.settings.currentLesson;
  const choiceMode = app.settings.answerMode === 'choice' || app.settings.answerMode === 'card';
  const hw = app.settings.answerMode === 'handwriting';
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const task = useMemo(() => makeTask(ex, app.words, lesson, choiceMode), [seed]);
  const [input, setInput] = useState('');
  const [cellInputs, setCellInputs] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | { ok: boolean; macron?: boolean; cellOk?: Record<string, boolean> }>(null);

  if (!task) return <div class="panel">Keine passenden Wörter.</div>;

  if (round >= ROUNDS) {
    return (
      <div class="screen">
        <header class="bar"><span /><h1>{EX_INFO[ex].title}</h1><span /></header>
        <div class="panel center">
          <div class="big-emoji">{score === ROUNDS ? '🏆' : score >= 7 ? '🌟' : '💪'}</div>
          <h2>{score} von {ROUNDS} richtig</h2>
          <div class="two">
            <button class="secondary big" onClick={onClose}>Fertig</button>
            <button class="primary big" onClick={() => { setRound(0); setScore(0); setSeed(seed + 1); }}>Noch eine Runde</button>
          </div>
        </div>
      </div>
    );
  }

  function check() {
    if (!task || checked) return;
    let ok = false; let macron = false; let cellOk: Record<string, boolean> | undefined;
    if (task.kind === 'build') {
      const r = checkLatin(task.answer, input);
      ok = r.verdict === 'correct'; macron = r.verdict === 'macron';
      if (!input.trim()) return;
    } else if (task.kind === 'identify') {
      if (!selected.length) return;
      ok = selected.length === task.answers.length && selected.every((s) => task.answers.includes(s));
    } else {
      cellOk = {};
      for (const c of task.cells) if (!c.given) cellOk[c.key] = checkLatin(c.answer, cellInputs[c.key] ?? '').verdict === 'correct';
      ok = Object.values(cellOk).every(Boolean);
    }
    recordForm(ok);
    if (ok) setScore(score + 1);
    setChecked({ ok, macron, cellOk });
  }

  function next() {
    setRound(round + 1); setSeed(seed + 1); setInput(''); setCellInputs({}); setSelected([]); setChecked(null);
  }

  const w = task.word;
  return (
    <div class="screen quiz">
      <header class="bar">
        <button class="link" onClick={onClose}>✕ Beenden</button>
        <div class="progress-track"><div class="progress-fill" style={{ width: `${(round / ROUNDS) * 100}%` }} /></div>
        <span class="muted small">{round + 1} / {ROUNDS}</span>
      </header>
      <div class="panel quiz-panel">
        {task.kind === 'build' && (
          <>
            <div class="question">
              <div class="q-prompt">Bilde: <b>{task.label}</b></div>
              <div class="q-latin"><LatinText text={latinDisplay(w)} /></div>
              <div class="muted">{w.german.slice(0, 2).join(', ')}</div>
            </div>
            {task.options ? (
              <div class="choices la-choices">
                {task.options.map((o) => (
                  <button key={o} class={'choice la' + (checked ? (o === task.answer ? ' right' : o === input ? ' chosen-wrong' : ' dim') : '')}
                    onClick={() => { if (!checked) { setInput(o); const r = checkLatin(task.answer, o); recordForm(r.verdict === 'correct'); if (r.verdict === 'correct') setScore(score + 1); setChecked({ ok: r.verdict === 'correct', macron: r.verdict === 'macron' }); } }}>
                    {o}
                  </button>
                ))}
              </div>
            ) : (
              <form class="answer-form" onSubmit={(e) => { e.preventDefault(); checked ? next() : check(); }}>
                <LatinInput value={input} onInput={setInput} handwriting={hw} autoFocus disabled={!!checked} onEnter={() => (checked ? next() : check())} />
                {!checked && <><MacronBar /><button class="primary big" type="submit">Prüfen</button></>}
              </form>
            )}
          </>
        )}

        {task.kind === 'identify' && (
          <>
            <div class="question">
              <div class="q-prompt">Bestimme die Form – <b>alle</b> passenden Möglichkeiten antippen:</div>
              <div class="q-latin"><span class="la">{task.form}</span></div>
              <div class="muted">von <span class="la">{latinDisplay(w)}</span> ({w.german[0]})</div>
            </div>
            <div class={'id-grid' + (task.isNoun ? ' noun' : '')}>
              {task.options.map(([k, l]) => {
                const on = selected.includes(k);
                const cls = checked ? (task.answers.includes(k) ? (on ? ' right' : ' missed') : on ? ' chosen-wrong' : ' dim') : on ? ' on' : '';
                return (
                  <button key={k} class={'id-opt' + cls} onClick={() => !checked && setSelected(on ? selected.filter((x) => x !== k) : [...selected, k])}>
                    {l}
                  </button>
                );
              })}
            </div>
            {!checked && <button class="primary big" onClick={check} disabled={!selected.length}>Prüfen</button>}
          </>
        )}

        {task.kind === 'table' && (
          <>
            <div class="question">
              <div class="q-prompt">Fülle die Tabelle aus:</div>
              <div class="q-latin"><LatinText text={latinDisplay(w)} /></div>
              <div class="muted">{w.german.slice(0, 2).join(', ')}</div>
            </div>
            <form class="table-form" onSubmit={(e) => { e.preventDefault(); checked ? next() : check(); }}>
              {task.cells.map((c) => (
                <label key={c.key} class={'cell' + (c.key === 'inf' ? ' full' : '') + (checked && !c.given ? (checked.cellOk?.[c.key] ? ' right' : ' wrong') : '')}>
                  <span class="cell-label">{c.label}</span>
                  {c.given ? (
                    <span class="la cell-given">{c.answer}</span>
                  ) : (
                    <input
                      class="la" lang="la" type="text" autocapitalize="none" autocorrect="off" autocomplete="off" spellcheck={false}
                      value={cellInputs[c.key] ?? ''} disabled={!!checked}
                      onInput={(e) => setCellInputs({ ...cellInputs, [c.key]: nfc((e.target as HTMLInputElement).value) })}
                    />
                  )}
                  {checked && !c.given && !checked.cellOk?.[c.key] && <span class="la cell-solution">{c.answer}</span>}
                </label>
              ))}
              {!checked && <><MacronBar /><button class="primary big" type="submit">Prüfen</button></>}
            </form>
          </>
        )}

        {checked && (
          <div class={'feedback ' + (checked.ok ? 'ok' : checked.macron ? 'almost' : 'no')}>
            <div class="fb-title">
              {checked.ok ? '✓ Richtig!' : checked.macron ? '△ Fast! Achte auf die Längenzeichen.' : '✗ Nicht ganz'}
            </div>
            {task.kind === 'build' && !checked.ok && <div class="solution"><div class="sol-latin"><LatinText text={task.answer} /></div></div>}
            {task.kind === 'identify' && (
              <div class="solution">
                Richtig: {task.answers.map((a) => labelFor(a, task.isNoun)).join(' · ')}
                {task.answers.length > 1 && <div class="muted small">Diese Form ist mehrdeutig – im Satz entscheidet der Zusammenhang.</div>}
              </div>
            )}
            <div class="fb-actions"><button class="primary big" autoFocus onClick={next}>Weiter →</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function labelFor(k: string, isNoun: boolean): string {
  if (!isNoun) return VERB_LABEL[k as VerbKey];
  const c = k.slice(0, 3) as Case; const n = k.slice(3) as Num;
  return `${CASE_LABEL[c]} ${NUM_LABEL[n]}`;
}
