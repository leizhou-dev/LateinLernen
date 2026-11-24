import { stressSegments } from '../lib/stress';
import { speakLatin, canSpeak } from '../lib/speech';
import { useApp } from '../lib/store';
import { Icon } from './Icons';

/** Sterne-Anzeige (Kapsel) */
export function StarPill({ n, title }: { n: number; title?: string }) {
  return (
    <span class="pill star-pill" title={title ?? 'Sterne'}>
      <Icon name="star" size={20} weight={2} class="star-ico" /> {n}
    </span>
  );
}

/** „+1 ★“ – kleines Abzeichen, wenn ein Stern dazukommt */
export function StarGain({ n }: { n: number }) {
  return <span class="star-gain">+{n} <Icon name="star" size={16} weight={2} class="star-ico" /></span>;
}

/** Lateinischer Text, betonter Vokal markiert (wenn eingeschaltet) */
export function LatinText({ text, stress }: { text: string; stress?: boolean }) {
  const { settings } = useApp();
  const show = stress ?? settings.showStress;
  if (!show) return <span class="la">{text}</span>;
  return (
    <span class="la">
      {stressSegments(text).map((s, i) => (s.stressed ? <span key={i} class="stress">{s.text}</span> : s.text))}
    </span>
  );
}

export function SpeakButton({ text }: { text: string }) {
  const { settings } = useApp();
  if (!settings.speech || !canSpeak()) return null;
  return (
    <button
      class="icon-btn speak"
      aria-label="Vorlesen"
      onClick={(e) => { e.stopPropagation(); speakLatin(text); }}
    >
      <Icon name="speaker" size={20} weight={2} />
    </button>
  );
}

export function LevelDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <span class="dots" aria-label={`Stufe ${level} von ${max}`}>
      {Array.from({ length: max }, (_, i) => <span key={i} class={i < level ? 'dot on' : 'dot'} />)}
    </span>
  );
}
