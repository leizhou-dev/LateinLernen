import { useApp, streak, today, showUnlock } from '../lib/store';
import { countDue, countNew, countProblems } from '../lib/session';
import type { TrainerStart } from './Trainer';
import { PageHeader } from './Chrome';
import { Icon, IconTile } from './Icons';
import { StarPill } from './Latin';

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
  const date = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div class="screen">
      <PageHeader
        title={greet}
        titleClass="la"
        subtitle={date}
        trailing={
          <span class="pills">
            <StarPill n={app.stats.stars ?? 0} />
            <span class="streak-pill" title="Tage in Folge geübt">
              <Icon name="flame" size={20} weight={2} /> {st} {st === 1 ? 'Tag' : 'Tage'}
            </span>
          </span>
        }
      />

      {app.newVocabNeedsPassword && (
        <button class="banner" onClick={() => showUnlock()}>
          <Icon name="key" />
          <span>Es gibt neue Vokabeln. Tippe hier und gib das Familien-Passwort ein.</span>
        </button>
      )}

      <div class="widget-grid">
        <button class={'widget hero-w' + (due ? '' : ' done')} disabled={!due} onClick={() => onStart({ kind: 'due', lessons })}>
          <div class="widget-top">
            <IconTile name={due ? 'repeat' : 'checkCircle'} color="transparent" size={44} />
            {due > 0 && <span class="widget-count">{due}</span>}
          </div>
          <div>
            <div class="widget-title">Wiederholen</div>
            <div class="widget-sub">{due ? (due === 1 ? '1 Karte ist heute fällig' : `${due} Karten sind heute fällig`) : 'Alles wiederholt – optimē!'}</div>
          </div>
          {due > 0 && <span class="widget-cta">Jetzt starten <Icon name="chevronRight" size={16} weight={2.4} /></span>}
        </button>

        <button class="widget" disabled={!fresh} onClick={() => onStart({ kind: 'new', lessons })}>
          <div class="widget-top"><IconTile name="sparkles" color="var(--indigo)" /></div>
          <div>
            <div class="widget-title">Neue Wörter</div>
            <div class="widget-sub">{fresh ? `noch ${fresh} ${fresh === 1 ? 'Karte' : 'Karten'} nie geübt` : 'Alle Wörter schon einmal geübt.'}</div>
          </div>
        </button>

        <button class="widget" disabled={!problems} onClick={() => onStart({ kind: 'problem', lessons })}>
          <div class="widget-top"><IconTile name="target" color="var(--red)" />{problems > 0 && <span class="widget-count" style={{ fontSize: '30px' }}>{problems}</span>}</div>
          <div>
            <div class="widget-title">Problemwörter</div>
            <div class="widget-sub">{problems ? 'Karten, die öfter falsch waren' : 'Zurzeit keine – super!'}</div>
          </div>
        </button>

        <button class="widget" onClick={() => onTab('vocab')}>
          <div class="widget-top"><IconTile name="books" color="var(--blue)" /></div>
          <div>
            <div class="widget-title">Lektion wählen</div>
            <div class="widget-sub">Wörter ansehen und gezielt üben</div>
          </div>
        </button>

        <button class="widget" onClick={() => onTab('forms')}>
          <div class="widget-top"><IconTile name="table" color="var(--teal)" /></div>
          <div>
            <div class="widget-title">Formen üben</div>
            <div class="widget-sub">Deklinieren, konjugieren, bestimmen</div>
          </div>
        </button>
      </div>

      <p class="home-note">Heute geübt: {todayCount} Aufgaben · Etwa 15 Minuten am Tag reichen!</p>
    </div>
  );
}
