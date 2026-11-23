import { useState } from 'preact/hooks';
import { useApp } from '../lib/store';
import { cardKey, wordLevel, MAX_LEVEL } from '../lib/srs';
import { latinDisplay, germanDisplay } from '../lib/check';
import { LatinText, SpeakButton, LevelDots } from './Latin';
import type { TrainerStart } from './Trainer';

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
        <header class="bar">
          <button class="link" onClick={() => setOpen(null)}>‹ Lektionen</button>
          <h1>Lektion {open}</h1>
          <button class="primary" onClick={() => onStart({ kind: 'lesson', lessons: [open] })}>Üben</button>
        </header>
        <div class="panel">
          <p class="muted small">Buch S. {L.pages} · {L.words.length} Lernwörter · Betonter Vokal ist <span class="stress">markiert</span></p>
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
                  {w.hint && <div class="hint">🔗 {w.hint}</div>}
                </div>
                <div class="w-lv" title="Latein→Deutsch / Deutsch→Latein">
                  <LevelDots level={app.progress[cardKey(w.id, 'ld')]?.level ?? 0} />
                  <LevelDots level={app.progress[cardKey(w.id, 'dl')]?.level ?? 0} />
                </div>
              </div>
            ))}
          </div>
          {reviewWords.length > 0 && (
            <>
              <h3>Wiederholungswörter</h3>
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
      <header class="bar"><span /><h1>Vokabeln</h1><span /></header>
      <div class="panel">
        <p class="muted small">Tippe auf eine Lektion, um die Wörter zu sehen. Mit ☐ kannst du mehrere Lektionen zusammen üben.</p>
        <div class="lesson-grid">
          {app.lessons.map((l) => {
            const levels = l.words.map((w) => wordLevel(app.progress, w));
            const mastered = levels.filter((x) => x >= MAX_LEVEL).length;
            const locked = l.number > app.settings.currentLesson;
            return (
              <div class={'lesson-card' + (locked ? ' locked' : '')} key={l.number}>
                <button class="lc-main" onClick={() => setOpen(l.number)}>
                  <span class="lc-num">{l.number}</span>
                  <span class="lc-info">
                    <span>{l.words.length} Wörter</span>
                    <span class="muted small">{mastered} sicher</span>
                  </span>
                </button>
                <LevelBar levels={levels} />
                <button class={'lc-check' + (sel.includes(l.number) ? ' on' : '')} aria-label="Auswählen" onClick={() => toggle(l.number)}>
                  {sel.includes(l.number) ? '☑' : '☐'}
                </button>
              </div>
            );
          })}
        </div>
        <div class="legend small">
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
