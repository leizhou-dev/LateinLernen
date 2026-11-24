import { useState } from 'preact/hooks';
import { unlock, useApp, init } from '../lib/store';

export function Unlock() {
  const app = useApp();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const standalone = typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone);

  async function submit(e: Event) {
    e.preventDefault();
    if (!pw) return;
    setBusy(true); setErr('');
    try {
      const r = await unlock(pw);
      if (r === 'wrong') setErr('Das Passwort stimmt nicht.');
      if (r === 'offline') setErr('Keine Verbindung. Bitte mit Internet versuchen.');
    } catch (ex) {
      setErr(String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="unlock">
      <div class="unlock-bg" />
      <div class="unlock-card">
        <img src="icons/icon-192.png" width={96} height={96} alt="" />
        <h1>Latein lernen</h1>
        {app.status === 'error' ? (
          <>
            <p>{app.error}</p>
            <button class="primary big" onClick={() => init()}>Nochmal versuchen</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p>Bitte das Familien-Passwort eingeben. Das ist nur einmal nötig.</p>
            <input type="password" autocomplete="current-password" value={pw} placeholder="Passwort"
              onInput={(e) => setPw((e.target as HTMLInputElement).value)} autoFocus />
            {err && <p class="err">{err}</p>}
            <button class="primary big" disabled={busy || !pw}>{busy ? 'Entschlüssele …' : 'Öffnen'}</button>
            {app.vocab && <button type="button" class="link" onClick={() => init()}>Abbrechen</button>}
          </form>
        )}
        {!standalone && (
          <p class="muted small install-hint">
            Tipp: In Safari auf <b>Teilen</b> und dann <b>Zum Home-Bildschirm</b> tippen und die App von dort öffnen.
            Erst dann funktioniert sie offline und der Fortschritt bleibt sicher gespeichert.
          </p>
        )}
      </div>
    </div>
  );
}
