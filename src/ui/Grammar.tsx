import { useState } from 'preact/hooks';
import { useApp } from '../lib/store';
import { GRAMMAR } from '../lib/grammarContent';
import { NounTableView, VerbTableView } from './Tables';
import { CASE_FROM } from '../lib/forms';
import { PageHeader } from './Chrome';
import { Icon } from './Icons';

const ROLE_CLASS: Record<string, string> = {
  Subjekt: 'r-subj', Prädikat: 'r-pred', Objekt: 'r-obj', Akkusativobjekt: 'r-obj', Dativobjekt: 'r-dat',
  Attribut: 'r-attr', Prädikatsnomen: 'r-pn', Adverbiale: 'r-adv',
};

export function Grammar() {
  const app = useApp();
  const [open, setOpen] = useState<number>(Math.min(app.settings.currentLesson, 11));
  const L = GRAMMAR.find((g) => g.lesson === open)!;
  const lessonData = app.lessons.find((l) => l.number === open);
  const W = (lat: string) => app.words.find((w) => w.latin === lat);

  return (
    <div class="screen">
      <PageHeader title="Grammatik" subtitle={`Lektion ${open}`} />
      <div class="lesson-tabs" role="tablist">
        {GRAMMAR.map((g) => (
          <button key={g.lesson} role="tab" aria-selected={g.lesson === open} class={g.lesson === open ? 'on' : ''} onClick={() => setOpen(g.lesson)}>{g.lesson}</button>
        ))}
      </div>
      <div class="panel">
        {L.blocks.map((b) => (
          <section class="gblock" key={b.title}>
            <h3>{b.title}</h3>
            {b.text.map((t, i) => <p key={i}>{t}</p>)}
            <div class="gtables">
              {b.nouns?.map((n) => {
                const w = W(n);
                return w ? (
                  <div key={n}>
                    <div class="tcap"><span class="la">{w.latin}</span> – {w.german[0]}</div>
                    <NounTableView word={w} lesson={open} />
                  </div>
                ) : null;
              })}
              {b.verbs?.map((v) => {
                const w = W(v);
                return w ? (
                  <div key={v}>
                    <div class="tcap"><span class="la">{w.latin}</span> – {w.german[0]}</div>
                    <VerbTableView word={w} lesson={open} keys={b.verbKeys} />
                  </div>
                ) : null;
              })}
            </div>
          </section>
        ))}
        {lessonData && lessonData.sentences.length > 0 && (
          <section class="gblock">
            <h3>Beispielsätze</h3>
            {lessonData.sentences.map((s) => (
              <div class="sentence" key={s.latin}>
                <div class="la big">
                  {s.parts
                    ? s.parts.map((p, i) => <span key={i} class={'role ' + (ROLE_CLASS[p.role] ?? '')} title={p.role}>{p.text}<small>{p.role}</small></span>)
                    : s.latin}
                </div>
                <div class="muted">{s.german}</div>
              </div>
            ))}
          </section>
        )}
        {L.tip && <div class="tip"><Icon name="bulb" /> <span>{L.tip}</span></div>}
        {open === 1 && <p class="group-footer">Kasus kommen nacheinander dazu: Akkusativ (L{CASE_FROM.Akk}), Dativ (L{CASE_FROM.Dat}), Genitiv (L{CASE_FROM.Gen}), Ablativ (L{CASE_FROM.Abl}).</p>}
      </div>
    </div>
  );
}
