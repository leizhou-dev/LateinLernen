import { useState } from 'preact/hooks';
import { useApp } from '../lib/store';
import { cardKey, wordLevel, MAX_LEVEL } from '../lib/srs';
import { latinDisplay, germanDisplay } from '../lib/check';
import { LatinText, SpeakButton, LevelDots } from './Latin';
import type { TrainerStart } from './Trainer';
import { PageHeader, GlassButton } from './Chrome';
import { Icon } from './Icons';

export function LevelBar({ levels }: { levels: number[] }) {
  const n = levels.length || 1;
  const counts = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => levels.filter((l) => l === i).length);
  return (
    <div class="level-bar" aria-label="Lernstand">
      {counts.map((c, i) => c > 0 && <span key={i} class={`lv lv${i}`} style={{ width: `${(c / n) * 100}%` }} />)}
    </div>
  );
}

export function Vocab({ onStart }: { onStart: (s: TrainerStart) => void }) {
  const app = useApp();
  const [open, setOpen] = useState<number | null>(null);
  const [sel, setSel] = useState<number[]>([]);

  if (open !== null) {
    const L = app.lessons.find((l) => l.number === open)!;
    const reviewWords = L.review.map((id) => app.words.find((w) => w.id === id)!).filter(Boolean);
    return (
      <div class="screen">
        <PageHeader
          leading={<GlassButton icon="chevronLeft" label="Lektionen" text="Lektionen" onClick={() => { setOpen(null); window.scrollTo({ top: 0 }); }} />}
          title={`Lektion ${open}`}
          subtitle={<>Buch S. {L.pages} · {L.words.length} Lernwörter · betonter Vokal <span class="stress">markiert</span></>}
          trailing={<button class="primary" onClick={() => onStart({ kind: 'lesson', lessons: [open] })}>Üben</button>}
        />
        <div class="panel">
          <div class="wordlist">
            {L.words.map((w) => (
              <div class="wrow" key={w.id}>
                <div class="w-lat">
                  <LatinText text={latinDisplay(w)} />
                  {w.markedAdv && <span class="tag">Adv.</span>}
                  {w.gender && w.type === 'noun' && <span class="tag">{w.gender}</span>}
                  <SpeakButton text={latinDisplay(w)} />
                </div>
                <div class="w-de">
                  {germanDisplay(w)}
                  {w.info && <span class="muted"> ({w.info})</span>}
                  {w.hint && <div class="hint"><Icon name="link" size={15} /> {w.hint}</div>}
                </div>
                <div class="w-lv" title="Latein→Deutsch / Deutsch→Latein">
                  <span><span class="dir-label">LA→DE</span><LevelDots level={app.progress[cardKey(w.id, 'ld')]?.level ?? 0} /></span>
                  <span><span class="dir-label">DE→LA</span><LevelDots level={app.progress[cardKey(w.id, 'dl')]?.level ?? 0} /></span>
                </div>
              </div>
            ))}
          </div>
          {reviewWords.length > 0 && (
            <>
              <h2 class="group-header" style={{ marginTop: '26px' }}>Wiederholungswörter</h2>
              <div class="wordlist compact">
                {reviewWords.map((w) => (
                  <div class="wrow" key={w.id}>
                    <div class="w-lat"><LatinText text={latinDisplay(w)} /></div>
                    <div class="w-de">{germanDisplay(w)} <span class="muted small">(L{w.lesson})</span></div>
                    <div />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const toggle = (n: number) => setSel(sel.includes(n) ? sel.filter((x) => x !== n) : [...sel, n].sort((a, b) => a - b));
  return (
    <div class="screen">
      <PageHeader title="Vokabeln" subtitle="Tippe auf eine Lektion, um die Wörter zu sehen. Mit ○ wählst du mehrere Lektionen zum gemeinsamen Üben." />
      <div class="panel">
        <div class="lesson-grid">
          {app.lessons.map((l) => {
            const levels = l.words.map((w) => wordLevel(app.progress, w));
            const mastered = levels.filter((x) => x >= MAX_LEVEL).length;
            const locked = l.number > app.settings.currentLesson;
            return (
              <div class={'lesson-card' + (locked ? ' locked' : '') + (sel.includes(l.number) ? ' selected' : '')} key={l.number}>
                <button class="lc-main" onClick={() => { setOpen(l.number); window.scrollTo({ top: 0 }); }}>
                  <span class="lc-num">{l.number}</span>
                  <span class="lc-info">
                    <span>{l.words.length} Wörter</span>
                    <span class="muted small">{mastered} sicher</span>
                  </span>
                </button>
                <LevelBar levels={levels} />
                <button class={'lc-check' + (sel.includes(l.number) ? ' on' : '')} aria-label="Auswählen" onClick={() => toggle(l.number)}>
                  <span class="check-circle">{sel.includes(l.number) && <Icon name="check" size={16} weight={3} />}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div class="legend">
          <span><i class="lv lv0" /> neu/aussortiert</span><span><i class="lv lv1" /> 1</span><span><i class="lv lv2" /> 2</span>
          <span><i class="lv lv3" /> 3</span><span><i class="lv lv4" /> 4</span><span><i class="lv lv5" /> sicher (5 Wiederholungen)</span>
        </div>
        {sel.length > 0 && (
          <div class="sticky-action">
            <button class="primary big" onClick={() => onStart({ kind: 'lesson', lessons: sel })}>
              {sel.length === 1 ? `Lektion ${sel[0]} üben` : `${sel.length} Lektionen üben (${sel.join(', ')})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
