import { useRef, useState } from 'preact/hooks';
import {
  useApp, setSettings, makeBackup, restoreBackup, resetProgress, streak, today, showUnlock, type Backup,
} from '../lib/store';
import { cardKey, isProblem, wordLevel, MAX_LEVEL, isSeen } from '../lib/srs';
import { latinDisplay, germanDisplay } from '../lib/check';
import type { AnswerMode } from '../lib/types';
import { LatinText } from './Latin';
import { LevelBar } from './Vocab';
import { MODE_LABEL, DIR_LABEL, Segmented, type TrainerStart } from './Trainer';
import { PageHeader, Group, Row, Toggle } from './Chrome';
import { Icon, IconTile } from './Icons';

export function ProgressView({ onStart }: { onStart: (s: TrainerStart) => void }) {
  const app = useApp();
  const { settings, stats } = app;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const words = app.words;
  const levels = words.map((w) => wordLevel(app.progress, w));
  const seen = words.filter((w) => isSeen(app.progress[cardKey(w.id, 'ld')]) || isSeen(app.progress[cardKey(w.id, 'dl')])).length;
  const mastered = levels.filter((l) => l >= MAX_LEVEL).length;
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
        setMsg('Sicherung erstellt.');
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('Sicherung heruntergeladen.');
  }

  async function importBackup(f: File) {
    try {
      const b = JSON.parse(await f.text()) as Backup;
      if (!confirm(`Sicherung vom ${new Date(b.exported).toLocaleString('de-DE')} wiederherstellen? Der aktuelle Fortschritt wird ersetzt.`)) return;
      await restoreBackup(b);
      setMsg('Sicherung wiederhergestellt.');
    } catch (e) {
      setMsg('Fehler: ' + (e as Error).message);
    }
  }

  return (
    <div class="screen">
      <PageHeader title="Fortschritt" />

      <div class="stat-grid">
        <div class="stat"><span class="stat-n"><Icon name="flame" size={24} weight={2} />{streak(stats)}</span><span>Tage in Folge</span></div>
        <div class="stat"><span class="stat-n">{seen}<span class="muted" style={{ fontSize: '17px' }}>/{words.length}</span></span><span>Wörter geübt</span></div>
        <div class="stat"><span class="stat-n">{mastered}</span><span>Wörter sicher</span></div>
        <div class="stat"><span class="stat-n"><Icon name="star" size={24} weight={2} class="star-ico" />{stats.stars ?? 0}</span><span>Sterne</span></div>
      </div>

      <Group header="Die letzten 14 Tage">
        <div class="daychart">
          {days.map((d) => (
            <div class="day" key={d.key} title={`${d.key}: ${d.n}`}>
              <div class={'day-bar' + (d.n ? '' : ' zero')} style={{ height: `${Math.max(3, (d.n / maxDay) * 100)}%` }} />
              <span class="small muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Group>

      <Group header="Lernstand pro Lektion" footer={`Formen-Übungen: ${stats.formsRight} richtig, ${stats.formsWrong} falsch`}>
        {app.lessons.map((l) => {
          const lv = l.words.map((w) => wordLevel(app.progress, w));
          return (
            <div class="lesson-progress" key={l.number}>
              <span class="lp-num">L{l.number}</span>
              <LevelBar levels={lv} />
              <span class="lp-n">{lv.filter((x) => x >= MAX_LEVEL).length}/{lv.length}</span>
            </div>
          );
        })}
      </Group>

      {problems.length > 0 && (
        <Group header="Problemwörter">
          {problems.slice(0, 12).map(({ w, d, p }) => (
            <Row key={w.id + d} title={<LatinText text={latinDisplay(w)} />} subtitle={germanDisplay(w, 3)}
              detail={<span class="small">{d === 'ld' ? 'LA→DE' : 'DE→LA'} · {p!.wrong}× falsch</span>} />
          ))}
          <Row class="row-accent" icon={<IconTile name="target" color="var(--red)" size={30} />} title="Problemwörter üben" chevron
            onClick={() => onStart({ kind: 'problem', lessons: app.lessons.map((l) => l.number) })} />
        </Group>
      )}

      <Group header="Einstellungen">
        <Row icon={<IconTile name="graduation" color="var(--blue)" size={30} />} title="Stand in der Schule">
        </Row>
        <div class="seg-row" style={{ paddingTop: 0 }}>
          <Segmented
            value={String(settings.currentLesson)}
            options={app.lessons.map((l) => [String(l.number), String(l.number)] as [string, string])}
            onChange={(v) => setSettings({ currentLesson: Number(v) })}
          />
        </div>
        <Row icon={<IconTile name="pencil" color="var(--orange)" size={30} />} title="Antworten mit" />
        <div class="seg-row" style={{ paddingTop: 0 }}>
          <Segmented<AnswerMode>
            value={settings.answerMode}
            options={(['choice', 'handwriting', 'keyboard', 'card'] as AnswerMode[]).map((m) => [m, MODE_LABEL[m]])}
            onChange={(m) => setSettings({ answerMode: m })}
          />
        </div>
        <Row icon={<IconTile name="arrows" color="var(--indigo)" size={30} />} title="Richtung" />
        <div class="seg-row" style={{ paddingTop: 0 }}>
          <Segmented value={settings.direction} options={[['ld', DIR_LABEL.ld], ['dl', DIR_LABEL.dl], ['mixed', DIR_LABEL.mixed]]} onChange={(d) => setSettings({ direction: d })} />
        </div>
        <Row icon={<IconTile name="sparkles" color="var(--accent)" size={30} />} title="Betonung markieren"
          detail={<Toggle label="Betonung markieren" checked={settings.showStress} onChange={(v) => setSettings({ showStress: v })} />} />
        <Row icon={<IconTile name="speaker" color="var(--green)" size={30} />} title="Vorlesen" subtitle="italienische Stimme, ungefähre Aussprache"
          detail={<Toggle label="Vorlesen" checked={settings.speech} onChange={(v) => setSettings({ speech: v })} />} />
      </Group>

      <Group header="Sicherung" footer="Der Fortschritt ist nur auf diesem iPad gespeichert. Mach ab und zu eine Sicherung, z. B. in „Dateien“ oder iCloud.">
        <Row icon={<IconTile name="share" color="var(--blue)" size={30} />} title="Sicherung exportieren" chevron onClick={exportBackup} />
        <Row icon={<IconTile name="download" color="var(--teal)" size={30} />} title="Sicherung laden" chevron onClick={() => fileRef.current?.click()} />
      </Group>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => {
        const f = (e.target as HTMLInputElement).files?.[0]; if (f) importBackup(f); (e.target as HTMLInputElement).value = '';
      }} />
      {msg && <p class="group-footer">{msg}</p>}

      <Group header="Sonstiges" footer={`${app.vocab?.meta.title ?? ''} · ${words.length} Wörter${app.contentId ? ` · ${app.contentId.slice(0, 8)}` : ''}`}>
        <Row icon={<IconTile name="key" color="var(--gray)" size={30} />} title="Passwort neu eingeben" chevron onClick={() => showUnlock()} />
        <Row class="row-destructive" icon={<IconTile name="trash" color="var(--red)" size={30} />} title="Fortschritt zurücksetzen" onClick={async () => {
          if (confirm('Wirklich den gesamten Lernfortschritt löschen? Das kann nicht rückgängig gemacht werden.')) { await resetProgress(); setMsg('Fortschritt gelöscht.'); }
        }} />
      </Group>
    </div>
  );
}
