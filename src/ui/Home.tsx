import { useApp, streak, today, showUnlock } from '../lib/store';
import { countDue, countNew, countProblems } from '../lib/session';
import type { TrainerStart } from './Trainer';

export function Home({ onStart, onTab }: { onStart: (s: TrainerStart) => void; onTab: (t: string) => void }) {
  const app = useApp();
  const now = Date.now();
  const lessons = app.lessons.filter((l) => l.number <= app.settings.currentLesson).map((l) => l.number);
  const words = app.words.filter((w) => lessons.includes(w.lesson));
  const due = countDue(words, app.progress, now);
  const fresh = countNew(words, app.progress);
  const problems = countProblems(words, app.progress);
  const st = streak(app.stats);
  const todayCount = app.stats.days[today()] ?? 0;
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Salvē! Guten Morgen' : hour < 18 ? 'Salvē!' : 'Salvē! Guten Abend';

  return (
    <div class="screen">
      <header class="hero">
        <div>
          <h1 class="la">{greet}</h1>
          <p class="muted">{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div class="streak" title="Tage in Folge geübt">
          <span class="flame">🔥</span>
          <span class="streak-n">{st}</span>
          <span class="small">{st === 1 ? 'Tag' : 'Tage'}</span>
        </div>
      </header>

      {app.newVocabNeedsPassword && (
        <div class="banner" onClick={() => showUnlock()}>🔑 Es gibt neue Vokabeln. Tippe hier und gib das Familien-Passwort ein.</div>
      )}

      <div class="panel">
        <button class={'action-card due' + (due ? '' : ' done')} disabled={!due} onClick={() => onStart({ kind: 'due', lessons })}>
          <span class="ac-icon">🔁</span>
          <span class="ac-text">
            <span class="ac-title">Wiederholen</span>
            <span class="ac-sub">{due ? due === 1 ? '1 Karte ist heute fällig' : `${due} Karten sind heute fällig` : 'Alles wiederholt – optimē! 🎉'}</span>
          </span>
          {due > 0 && <span class="ac-badge">{due}</span>}
        </button>

        <button class="action-card new" disabled={!fresh} onClick={() => onStart({ kind: 'new', lessons })}>
          <span class="ac-icon">✨</span>
          <span class="ac-text">
            <span class="ac-title">Neue Wörter lernen</span>
            <span class="ac-sub">{fresh ? `noch ${fresh} ${fresh === 1 ? 'Karte' : 'Karten'} nie geübt` : 'Du hast alle Wörter schon einmal geübt.'}</span>
          </span>
        </button>

        {problems > 0 && (
          <button class="action-card problem" onClick={() => onStart({ kind: 'problem', lessons })}>
            <span class="ac-icon">🎯</span>
            <span class="ac-text">
              <span class="ac-title">Problemwörter</span>
              <span class="ac-sub">{problems} Karten, die öfter falsch waren</span>
            </span>
          </button>
        )}

        <div class="two">
          <button class="action-card small" onClick={() => onTab('vocab')}>
            <span class="ac-icon">📚</span><span class="ac-text"><span class="ac-title">Lektion wählen</span></span>
          </button>
          <button class="action-card small" onClick={() => onTab('forms')}>
            <span class="ac-icon">🛠️</span><span class="ac-text"><span class="ac-title">Formen üben</span></span>
          </button>
        </div>

        <p class="muted center small">Heute geübt: {todayCount} Aufgaben · Tipp: etwa 15 Minuten am Tag reichen!</p>
      </div>
    </div>
  );
}
