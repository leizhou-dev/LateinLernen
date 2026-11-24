import { useMemo, useState } from 'preact/hooks';
import type { AnswerMode, Direction } from '../lib/types';
import { useApp, recordAnswer, setSettings } from '../lib/store';
import { buildSession, choicesFor, type Card, type SessionKind } from '../lib/session';
import {
  checkGerman, checkLatinParts, germanDisplay, latinDisplay, latinTargets, worst, type Verdict,
} from '../lib/check';
import { stripMacrons, nfc } from '../lib/text';
import { speakLatin } from '../lib/speech';
import { LatinInput, MacronBar } from './LatinInput';
import { LatinText, SpeakButton } from './Latin';
import { NavBar, GlassButton, Group, PageHeader } from './Chrome';
import { Icon, type IconName } from './Icons';

export interface TrainerStart { kind: SessionKind; lessons: number[] }

const KIND_TITLE: Record<SessionKind, string> = {
  due: 'Wiederholen',
  new: 'Neue Wörter lernen',
  lesson: 'Lektion üben',
  problem: 'Problemwörter üben',
};

export const MODE_LABEL: Record<AnswerMode, string> = {
  choice: 'Auswahl',
  handwriting: 'Handschrift',
  keyboard: 'Tastatur',
  card: 'Karteikarte',
};
export const MODE_ICON: Record<AnswerMode, IconName> = { choice: 'checklist', handwriting: 'pencil', keyboard: 'keyboard', card: 'cards' };
export const DIR_LABEL: Record<Direction | 'mixed', string> = {
  ld: 'Latein → Deutsch',
  dl: 'Deutsch → Latein',
  mixed: 'Gemischt',
};

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <div class="segmented" role="radiogroup">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} class={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Trainer({ start, onClose }: { start: TrainerStart; onClose: () => void }) {
  const app = useApp();
  const { settings } = app;
  const [running, setRunning] = useState<Card[] | null>(null);
  const lessonsText = start.lessons.length === 1 ? `Lektion ${start.lessons[0]}` : `Lektionen ${start.lessons[0]}–${start.lessons[start.lessons.length - 1]}`;

  if (running) {
    return <Quiz cards={running} title={KIND_TITLE[start.kind]} mode={settings.answerMode} onClose={onClose} />;
  }

  const preview = buildSession(app.words, app.progress, {
    kind: start.kind, lessons: start.lessons, direction: settings.direction, size: settings.sessionSize, now: Date.now(),
  });

  return (
    <div class="screen setup">
      <PageHeader
        leading={<GlassButton icon="chevronLeft" label="Zurück" text="Zurück" onClick={onClose} />}
        title={KIND_TITLE[start.kind]}
        subtitle={lessonsText}
      />
      <Group header="Wie möchtest du antworten?">
        <div class="mode-grid">
          {(['choice', 'handwriting', 'keyboard', 'card'] as AnswerMode[]).map((m) => (
            <button key={m} class={'mode' + (settings.answerMode === m ? ' on' : '')} onClick={() => setSettings({ answerMode: m })}>
              <Icon name={MODE_ICON[m]} />
              <span>{MODE_LABEL[m]}</span>
            </button>
          ))}
        </div>
      </Group>
      <Group header="Richtung">
        <div class="seg-row">
          <Segmented
            value={settings.direction}
            options={[['ld', DIR_LABEL.ld], ['dl', DIR_LABEL.dl], ['mixed', DIR_LABEL.mixed]]}
            onChange={(d) => setSettings({ direction: d })}
          />
        </div>
      </Group>
      <Group header="Wie viele Karten?">
        <div class="seg-row">
          <Segmented
            value={String(settings.sessionSize)}
            options={[['7', '7'], ['10', '10'], ['15', '15'], ['20', '20'], ['999', 'Alle']]}
            onChange={(n) => setSettings({ sessionSize: Number(n) })}
          />
        </div>
      </Group>
      <div class="tip"><Icon name="bulb" /> <span>Tipp aus dem Buch: Lerne höchstens sieben neue Wörter auf einmal und mache dann eine kurze Pause.</span></div>
      <div class="start-bar">
        <button class="primary big" disabled={!preview.length} onClick={() => { setRunning(preview); window.scrollTo({ top: 0 }); }}>
          {preview.length ? `Los geht's – ${preview.length} Karten` : 'Keine Karten in dieser Auswahl'}
        </button>
      </div>
    </div>
  );
}

interface Result { verdict: Verdict; given?: string[]; badMacrons?: number[][]; override?: boolean }

function Quiz({ cards, title, mode, onClose }: { cards: Card[]; title: string; mode: AnswerMode; onClose: () => void }) {
  const app = useApp();
  const [queue, setQueue] = useState<Card[]>(cards);
  const [idx, setIdx] = useState(0);
  const [inputs, setInputs] = useState<string[]>(['', '']);
  const [result, setResult] = useState<Result | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [firstTry] = useState(() => new Map<string, boolean>());
  const [repeats] = useState(() => new Map<string, number>());

  const card = queue[idx];
  const key = card ? `${card.word.id}:${card.dir}` : '';
  const choices = useMemo(() => (card && mode === 'choice' ? choicesFor(card, app.words) : []), [key, idx, mode]);

  if (!card) {
    const total = firstTry.size;
    const right = [...firstTry.values()].filter(Boolean).length;
    const wrongCards = cards.filter((c) => firstTry.get(`${c.word.id}:${c.dir}`) === false);
    return (
      <div class="screen">
        <NavBar center={title} />
        <div class="result">
          <div class="big-emoji">{right === total ? '🏆' : right >= total * 0.7 ? '🌟' : '💪'}</div>
          <h2>{right === total ? 'Optimē! Alles richtig!' : right >= total * 0.7 ? 'Bene! Gut gemacht!' : 'Weiter so – Übung macht den Meister!'}</h2>
          <p class="score">{right} von {total} beim ersten Versuch richtig</p>
          {wrongCards.length > 0 && (
            <Group header="Diese Wörter kommen bald wieder">
              {wrongCards.map((c) => (
                <div class="row" key={c.word.id + c.dir}>
                  <span class="row-main"><span class="row-title"><LatinText text={latinDisplay(c.word)} /></span></span>
                  <span class="row-detail">{germanDisplay(c.word, 3)}</span>
                </div>
              ))}
            </Group>
          )}
          <button class="primary big" onClick={onClose}>Fertig</button>
        </div>
      </div>
    );
  }

  const w = card.word;
  const isVerbDL = card.dir === 'dl' && w.type === 'verb' && !!w.firstPerson;
  const targets = latinTargets(w);

  function finish(verdict: Verdict, extra: Partial<Result> = {}) {
    setResult({ verdict, ...extra });
    if (card.dir === 'dl' && (verdict === 'correct' || verdict === 'typo') && app.settings.speech) speakLatin(latinDisplay(w));
  }

  function submitText() {
    if (result) return next();
    if (card.dir === 'dl') {
      const given = isVerbDL ? inputs.slice(0, 2) : [inputs[0]];
      if (!given.some((g) => g.trim())) return;
      const checks = checkLatinParts(targets, given);
      finish(worst(checks.map((c) => c.verdict)), { given, badMacrons: checks.map((c) => c.badMacrons ?? []) });
    } else {
      if (!inputs[0].trim()) return;
      finish(checkGerman(w, inputs[0]).verdict, { given: [inputs[0]] });
    }
  }

  function choose(opt: string) {
    if (result) return;
    const right = card.dir === 'dl' ? latinDisplay(w) : germanDisplay(w, 3);
    if (opt === right) finish('correct', { given: [opt] });
    else if (card.dir === 'dl' && stripMacrons(opt) === stripMacrons(right)) finish('macron', { given: [opt] });
    else finish('wrong', { given: [opt] });
  }

  function next() {
    if (!result) return;
    const ok = result.override || result.verdict === 'correct' || result.verdict === 'typo';
    if (!firstTry.has(key)) {
      firstTry.set(key, ok);
      recordAnswer(w.id, card.dir, ok);
    }
    let q = queue;
    if (!ok) {
      // aussortieren: am Ende der Runde noch einmal (höchstens zweimal)
      const n = repeats.get(key) ?? 0;
      if (n < 2) { repeats.set(key, n + 1); q = [...queue, card]; setQueue(q); }
    }
    setIdx(idx + 1);
    setInputs(['', '']);
    setResult(null);
    setFlipped(false);
  }

  const done = Math.min(idx, queue.length);
  const ok = result && (result.override || result.verdict === 'correct' || result.verdict === 'typo');

  return (
    <div class="screen quiz">
      <NavBar
        leading={<GlassButton icon="xmark" label="Beenden" onClick={onClose} />}
        center={<div class="progress-track"><div class="progress-fill" style={{ width: `${(done / queue.length) * 100}%` }} /></div>}
        trailing={<span class="counter">{done + 1} / {queue.length}</span>}
      />

      <div class="panel quiz-panel">
        <div class="question">
          <div class="q-meta">
            <span class="chip">L{w.lesson}</span>
            <span class="chip">{card.dir === 'ld' ? 'Latein → Deutsch' : 'Deutsch → Latein'}</span>
            {(repeats.get(key) ?? 0) > 0 && !result && <span class="chip warn">Wiederholung</span>}
          </div>
          {card.dir === 'ld' ? (
            <div class="q-main">
              <div class="q-latin">
                <LatinText text={latinDisplay(w)} /> <SpeakButton text={latinDisplay(w)} />
              </div>
              {(w.markedAdv || w.info) && <div class="q-sub">{[w.markedAdv && 'Adv.', w.info].filter(Boolean).join(' · ')}</div>}
            </div>
          ) : (
            <div class="q-main">
              <div class="q-german">{germanDisplay(w)}</div>
              <div class="q-sub">
                {w.type === 'verb' && w.firstPerson ? 'Verb – Infinitiv und 1. Person Singular' : typeHint(w.type)}
                {w.info ? ` · ${w.info}` : ''}
              </div>
            </div>
          )}
        </div>

        {/* ---------- Antwortbereich ---------- */}
        {mode === 'card' ? (
          !flipped ? (
            <button class="primary big" onClick={() => setFlipped(true)}>Karte umdrehen</button>
          ) : !result ? (
            <div class="answer-card">
              <Solution card={card} />
              <div class="two">
                <button class="bad big" onClick={() => finish('wrong')}><Icon name="xmark" size={20} weight={2.4} /> Nicht gewusst</button>
                <button class="good big" onClick={() => finish('correct')}><Icon name="check" size={20} weight={2.4} /> Gewusst</button>
              </div>
            </div>
          ) : null
        ) : mode === 'choice' ? (
          <div class={'choices' + (card.dir === 'dl' ? ' la-choices' : '')}>
            {choices.map((c) => {
              const right = card.dir === 'dl' ? latinDisplay(w) : germanDisplay(w, 3);
              const cls = result ? (c === right ? ' right' : result.given?.[0] === c ? ' chosen-wrong' : ' dim') : '';
              return (
                <button key={c} class={'choice' + cls + (card.dir === 'dl' ? ' la' : '')} onClick={() => choose(c)}>
                  {c}
                </button>
              );
            })}
          </div>
        ) : (
          <form class="answer-form" onSubmit={(e) => { e.preventDefault(); submitText(); }}>
            {card.dir === 'dl' ? (
              <>
                <LatinInput
                  label={isVerbDL ? 'Infinitiv' : undefined}
                  value={inputs[0]}
                  onInput={(v) => setInputs([v, inputs[1]])}
                  handwriting={mode === 'handwriting'}
                  autoFocus
                  disabled={!!result}
                  onEnter={submitText}
                />
                {isVerbDL && (
                  <LatinInput
                    label="1. Person Singular"
                    value={inputs[1]}
                    onInput={(v) => setInputs([inputs[0], v])}
                    handwriting={mode === 'handwriting'}
                    disabled={!!result}
                    onEnter={submitText}
                    placeholder={mode === 'handwriting' ? '✎ ich …' : 'ich …'}
                  />
                )}
                {!result && <MacronBar />}
              </>
            ) : (
              <div class={'latin-input' + (mode === 'handwriting' ? ' hw' : '')}>
                <input
                  type="text"
                  lang="de"
                  value={inputs[0]}
                  disabled={!!result}
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck={false}
                  placeholder={mode === 'handwriting' ? '✎ Deutsche Bedeutung schreiben' : 'Deutsche Bedeutung'}
                  onInput={(e) => setInputs([(e.target as HTMLInputElement).value, ''])}
                  ref={(el) => { if (el && mode === 'keyboard' && !result && document.activeElement !== el && !inputs[0]) el.focus(); }}
                />
              </div>
            )}
            {!result && <button class="primary big" type="submit">Prüfen</button>}
          </form>
        )}

        {/* ---------- Rückmeldung ---------- */}
        {result && (
          <div class={'feedback ' + (ok ? 'ok' : result.verdict === 'macron' ? 'almost' : 'no')}>
            <div class="fb-title">
              <Icon name={ok ? 'checkCircle' : result.verdict === 'macron' ? 'triangle' : 'xmark'} size={24} weight={2.2} />
              {result.override ? 'Als richtig gewertet'
                : result.verdict === 'correct' ? 'Richtig!'
                : result.verdict === 'typo' ? 'Richtig – kleiner Tippfehler'
                : result.verdict === 'macron' ? 'Fast! Achte auf die Längenzeichen.'
                : 'Leider falsch'}
            </div>
            {result.verdict === 'macron' && mode !== 'choice' && result.given && (
              <div class="macron-diff">
                {result.given.map((g, gi) => (
                  <div key={gi}>
                    Deine Antwort: <span class="la">{[...nfc(g)].map((c, i) => (
                      result.badMacrons?.[gi]?.includes(i) ? <mark key={i}>{c}</mark> : c
                    ))}</span>
                  </div>
                ))}
              </div>
            )}
            <Solution card={card} />
            <div class="fb-actions">
              {!ok && card.dir === 'ld' && (mode === 'handwriting' || mode === 'keyboard') && (
                <button class="link" onClick={() => setResult({ ...result, override: true })}>Doch richtig – ich hatte es gemeint</button>
              )}
              <button class="primary big" autoFocus onClick={next}>Weiter <Icon name="chevronRight" size={18} weight={2.4} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function typeHint(t: string): string {
  return ({
    noun: 'Substantiv', properNoun: 'Name', adverb: 'Adverb', conjunction: 'Konjunktion',
    interrogative: 'Fragewort', phrase: 'Wendung', verbForm: 'Verbform', pronoun: 'Pronomen', verb: 'Verb',
  } as Record<string, string>)[t] ?? '';
}

function Solution({ card }: { card: Card }) {
  const w = card.word;
  return (
    <div class="solution">
      <div class="sol-latin">
        <LatinText text={latinDisplay(w)} /> <SpeakButton text={latinDisplay(w)} />
      </div>
      <div class="sol-german">{germanDisplay(w)}</div>
      {w.hint && <div class="hint"><Icon name="link" size={16} /> {w.hint}</div>}
    </div>
  );
}
