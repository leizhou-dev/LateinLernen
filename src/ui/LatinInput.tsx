import { useEffect, useRef } from 'preact/hooks';
import { MACRON_VOWELS, isVowel, toggleMacron, nfc } from '../lib/text';

/**
 * Leiste mit ā ē ī ō ū. Fügt das Zeichen in das gerade aktive Eingabefeld ein
 * (pointerdown + preventDefault → das Feld behält den Fokus).
 */
export function MacronBar() {
  const insert = (ch: string) => {
    const el = document.activeElement as HTMLInputElement | null;
    if (!el || el.tagName !== 'INPUT') return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    const v = el.value.slice(0, s) + ch + el.value.slice(e);
    // Preact-kontrollierte Felder: Wert setzen und input-Ereignis auslösen
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.setSelectionRange(s + 1, s + 1);
  };
  return (
    <div class="macron-bar" role="toolbar" aria-label="Längenzeichen einfügen">
      {MACRON_VOWELS.map((c) => (
        <button
          key={c}
          type="button"
          class="macron-key la"
          onPointerDown={(ev) => { ev.preventDefault(); insert(c); }}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

/** Buchstabenkacheln: Antippen eines Vokals setzt/entfernt das Längenzeichen (für Handschrift) */
export function MacronTiles({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const chars = [...nfc(value)];
  if (!chars.length) return null;
  return (
    <div class="tiles" aria-label="Tippe auf einen Vokal, um das Längenzeichen zu setzen">
      {chars.map((c, i) =>
        c === ' ' ? (
          <span key={i} class="tile space" />
        ) : (
          <button
            key={i}
            type="button"
            class={'tile la' + (isVowel(c) ? ' vowel' : '')}
            disabled={!isVowel(c)}
            onClick={() => {
              const next = chars.slice();
              next[i] = toggleMacron(c);
              onChange(next.join(''));
            }}
          >
            {c}
          </button>
        ),
      )}
    </div>
  );
}

interface Props {
  value: string;
  onInput: (v: string) => void;
  label?: string;
  handwriting?: boolean;
  autoFocus?: boolean;
  onEnter?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function LatinInput({ value, onInput, label, handwriting, autoFocus, onEnter, disabled, placeholder }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && !handwriting) ref.current?.focus();
  }, [autoFocus, handwriting]);
  return (
    <div class={'latin-input' + (handwriting ? ' hw' : '')}>
      {label && <div class="field-label">{label}</div>}
      <input
        ref={ref}
        class="la"
        lang="la"
        type="text"
        value={value}
        disabled={disabled}
        autocapitalize="none"
        autocorrect="off"
        autocomplete="off"
        spellcheck={false}
        placeholder={placeholder ?? (handwriting ? '✎ Hier mit dem Stift schreiben' : 'Latein eingeben')}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); } }}
      />
      {!disabled && value && <MacronTiles value={value} onChange={onInput} />}
    </div>
  );
}
