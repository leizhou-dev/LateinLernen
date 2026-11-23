import { render } from 'preact';
import { useState } from 'preact/hooks';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/App';
import './style.css';

let setReady: ((v: boolean) => void) | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;

if ('serviceWorker' in navigator) {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { setReady?.(true); },
    onRegisteredSW(_url, reg) {
      // beim Öffnen und stündlich nach Updates schauen
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
}

function Root() {
  const [ready, set] = useState(false);
  setReady = set;
  return <App updateReady={ready} applyUpdate={() => updateSW?.(true)} />;
}

render(<Root />, document.getElementById('app')!);
