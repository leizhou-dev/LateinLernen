import { useEffect, useState } from 'preact/hooks';
import { useApp, init } from '../lib/store';
import { countDue } from '../lib/session';
import { Unlock } from './Unlock';
import { Home } from './Home';
import { Vocab } from './Vocab';
import { Forms } from './Forms';
import { Grammar } from './Grammar';
import { ProgressView } from './ProgressView';
import { Trainer, type TrainerStart } from './Trainer';
import { Icon, type IconName } from './Icons';

type Tab = 'home' | 'vocab' | 'forms' | 'grammar' | 'progress';
const TABS: [Tab, IconName, string][] = [
  ['home', 'house', 'Heute'],
  ['vocab', 'books', 'Vokabeln'],
  ['forms', 'table', 'Formen'],
  ['grammar', 'scroll', 'Grammatik'],
  ['progress', 'chart', 'Fortschritt'],
];

export function App({ updateReady, applyUpdate }: { updateReady: boolean; applyUpdate: () => void }) {
  const app = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [trainer, setTrainer] = useState<TrainerStart | null>(null);

  useEffect(() => { init(); }, []);

  // Fällige Karten als Zahl am App-Symbol (wo unterstützt)
  useEffect(() => {
    if (app.status !== 'ready') return;
    const n = countDue(app.words.filter((w) => w.lesson <= app.settings.currentLesson), app.progress, Date.now());
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    (n ? nav.setAppBadge?.(n) : nav.clearAppBadge?.())?.catch(() => {});
  }, [app.progress, app.status]);

  // Update nur einspielen, wenn gerade nicht geübt wird
  useEffect(() => {
    if (updateReady && !trainer && tab === 'home') applyUpdate();
  }, [updateReady, trainer, tab]);

  if (app.status === 'loading') return <div class="loading"><span class="la">Salvē …</span></div>;
  if (app.status === 'locked' || app.status === 'error') return <Unlock />;

  if (trainer) return <Trainer start={trainer} onClose={() => { setTrainer(null); window.scrollTo({ top: 0 }); }} />;

  return (
    <div class="shell">
      <main>
        {tab === 'home' && <Home onStart={(s) => { setTrainer(s); window.scrollTo({ top: 0 }); }} onTab={(t) => setTab(t as Tab)} />}
        {tab === 'vocab' && <Vocab onStart={(s) => { setTrainer(s); window.scrollTo({ top: 0 }); }} />}
        {tab === 'forms' && <Forms />}
        {tab === 'grammar' && <Grammar />}
        {tab === 'progress' && <ProgressView onStart={(s) => { setTrainer(s); window.scrollTo({ top: 0 }); }} />}
      </main>
      <nav class="tabbar" aria-label="Bereiche">
        {TABS.map(([t, icon, label]) => (
          <button key={t} class={'tab' + (t === tab ? ' on' : '')} aria-current={t === tab ? 'page' : undefined}
            onClick={() => { setTab(t); window.scrollTo({ top: 0 }); }}>
            <Icon name={icon} weight={t === tab ? 2.1 : 1.7} />
            <span class="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
