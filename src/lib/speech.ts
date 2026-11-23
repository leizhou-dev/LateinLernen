import { stripMacrons } from './text';

let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (voice !== undefined && voice !== null) return voice;
  const vs = typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices() : [];
  // Es gibt keine lateinische Stimme – Italienisch kommt der Schulaussprache am nächsten
  voice = vs.find((v) => v.lang === 'it-IT') ?? vs.find((v) => v.lang.startsWith('it')) ?? null;
  return voice;
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function speakLatin(text: string) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripMacrons(text).replace(/…/g, ', '));
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang ?? 'it-IT';
  u.rate = 0.8;
  speechSynthesis.speak(u);
}
