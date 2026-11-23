import { useRef, useState } from 'preact/hooks';
import {
  useApp, setSettings, makeBackup, restoreBackup, resetProgress, streak, today, showUnlock, type Backup,
} from '../lib/store';
import { cardKey, isProblem, wordLevel, MAX_LEVEL, isSeen } from '../lib/srs';
import { latinDisplay, germanDisplay } from '../lib/check';
import { countDue } from '../lib/session';
import type { AnswerMode } from '../lib/types';
import { LatinText } from './Latin';
import { LevelBar } from './Vocab';
import { MODE_LABEL, DIR_LABEL, Segmented, type TrainerStart } from './Trainer';

export function ProgressView({ onStart }: { onStart: (s: TrainerStart) => void }) {
  const app = useApp();
  const { settings, stats } = app;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const words = app.words;
  const levels = words.map((w) => wordLevel(app.progress, w));
  const seen = words.filter((w) => isSeen(app.progress[cardKey(w.id, 'ld')]) || isSeen(app.progress[cardKey(w.id, 'dl')])).length;
  const mastered = levels.filter((l) => l >= MAX_LEVEL).length;
  const due = countDue(words, app.progress, Date.now());
  const problems = words
    .flatMap((w) => (['ld', 'dl'] as const).map((d) => ({ w, d, p: app.progress[cardKey(w.id, d)] })))
    .filter((x) => isProblem(x.p))
    .sort((a, b) => b.p!.wrong - a.p!.wrong);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return { key: today(d.getTime()), label: d.toLocaleDateString('de-DE', { weekday: 'narrow' }), n: stats.days[today(d.getTime())] ?? 0 };
  });
  const maxDay = Math.max(10, ...days.map((d) => d.n));

  async function exportBackup() {
    const b = makeBackup();
    const name = `latein-sicherung-${today()}.json`;
    const file = new File([JSON.stringify(b)], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Latein-Sicherung' });
        setMsg('✓ Sicherung erstellt.');
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('✓ Sicherung heruntergeladen.');
  }

  async function importBackup(f: File) {
    try {
      const b = JSON.parse(await f.text()) as Backup;
      if (!confirm(`Sicherung vom ${new Date(b.exported).toLocaleString('de-DE')} wiederherstellen? Der aktuelle Fortschritt wird ersetzt.`)) return;
      await restoreBackup(b);
      setMsg('✓ Sicherung wiederhergestellt.');
    } catch (e) {
      setMsg('✗ ' + (e as Error).message);
    }
  }

  return (
    <div class="screen">
      <header class="bar"><span /><h1>Fortschritt</h1><span /></header>
      <div class="panel">
        <div class="stat-grid">
          <div class="stat"><span class="stat-n">🔥 {streak(stats)}</span><span>Tage in Folge</span></div>
          <div class="stat"><span class="stat-n">{seen}/{words.length}</span><span>Wörter geübt</span></div>
          <div class="stat"><span class="stat-n">{mastered}</span><span>Wörter sicher</span></div>
          <div class="stat"><span class="stat-n">{due}</span><span>heute fällig</span></div>
        </div>

        <h3>Die letzten 14 Tage</h3>
        <div class="daychart">
          {days.map((d) => (
            <div class="day" key={d.key} title={`${d.key}: ${d.n}`}>
              <div class="day-bar" style={{ height: `${(d.n / maxDay) * 100}%` }} />
              <span class="small muted">{d.label}</span>
            </div>
          ))}
        </div>

        <h3>Lernstand pro Lektion</h3>
        {app.lessons.map((l) => (
          <div class="lesson-progress" key={l.number}>
            <span class="lp-num">L{l.number}</span>
            <LevelBar levels={l.words.map((w) => wordLevel(app.progress, w))} />
          </div>
        ))}
        <p class="muted small">Formen-Übungen: {stats.formsRight} richtig, {stats.formsWrong} falsch</p>

        {problems.length > 0 && (
          <>
            <h3>Problemwörter</h3>
            <div class="wordlist compact">
              {problems.slice(0, 15).map(({ w, d, p }) => (
                <div class="wrow" key={w.id + d}>
                  <div class="w-lat"><LatinText text={latinDisplay(w)} /></div>
                  <div class="w-de">{germanDisplay(w, 3)}</div>
                  <div class="muted small">{d === 'ld' ? 'La→De' : 'De→La'} · {p!.wrong}× falsch</div>
                </div>
              ))}
            </div>
            <button class="secondary" onClick={() => onStart({ kind: 'problem', lessons: app.lessons.map((l) => l.number) })}>Problemwörter üben</button>
          </>
        )}

        <h2 class="section">Einstellungen</h2>
        <div class="setting">
          <span>Bis zu welcher Lektion seid ihr in der Schule?</span>
          <select value={settings.currentLesson} onChange={(e) => setSettings({ currentLesson: Number((e.target as HTMLSelectElement).value) })}>
            {app.lessons.map((l) => <option key={l.number} value={l.number}>Lektion {l.number}</option>)}
          </select>
        </div>
        <div class="setting col">
          <span>Antworten mit</span>
          <Segmented<AnswerMode>
            value={settings.answerMode}
            options={(['choice', 'handwriting', 'keyboard', 'card'] as AnswerMode[]).map((m) => [m, MODE_LABEL[m]])}
            onChange={(m) => setSettings({ answerMode: m })}
          />
        </div>
        <div class="setting col">
          <span>Richtung</span>
          <Segmented value={settings.direction} options={[['ld', DIR_LABEL.ld], ['dl', DIR_LABEL.dl], ['mixed', DIR_LABEL.mixed]]} onChange={(d) => setSettings({ direction: d })} />
        </div>
        <label class="setting">
          <span>Betonung markieren</span>
          <input type="checkbox" class="switch" checked={settings.showStress} onChange={(e) => setSettings({ showStress: (e.target as HTMLInputElement).checked })} />
        </label>
        <label class="setting">
          <span>Vorlesen (italienische Stimme, ungefähr)</span>
          <input type="checkbox" class="switch" checked={settings.speech} onChange={(e) => setSettings({ speech: (e.target as HTMLInputElement).checked })} />
        </label>

        <h2 class="section">Sicherung</h2>
        <p class="muted small">Der Fortschritt ist nur auf diesem iPad gespeichert. Mach ab und zu eine Sicherung (z. B. in „Dateien“ / iCloud).</p>
        <div class="two">
          <button class="secondary" onClick={exportBackup}>⬆︎ Sicherung exportieren</button>
          <button class="secondary" onClick={() => fileRef.current?.click()}>⬇︎ Sicherung laden</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0]; if (f) importBackup(f); (e.target as HTMLInputElement).value = '';
        }} />
        {msg && <p class="small">{msg}</p>}

        <h2 class="section">Sonstiges</h2>
        <p class="muted small">Wortschatz: {app.vocab?.meta.title} · {words.length} Wörter{app.contentId ? ` · ${app.contentId.slice(0, 8)}` : ''}</p>
        <div class="two">
          <button class="secondary" onClick={() => showUnlock()}>🔑 Passwort neu eingeben</button>
          <button class="danger" onClick={async () => {
            if (confirm('Wirklich den gesamten Lernfortschritt löschen? Das kann nicht rückgängig gemacht werden.')) { await resetProgress(); setMsg('Fortschritt gelöscht.'); }
          }}>Fortschritt zurücksetzen</button>
        </div>
      </div>
    </div>
  );
}
