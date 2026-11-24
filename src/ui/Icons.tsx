/** Schlichte Linien-Icons im Stil der SF Symbols (eigene Zeichnungen, 24×24) */
import type { JSX } from 'preact';

const P: Record<string, JSX.Element> = {
  house: <><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" /></>,
  books: <><rect x="3.5" y="4" width="4.5" height="16" rx="1" /><rect x="8" y="4" width="4.5" height="16" rx="1" /><path d="m13.6 5.2 4.3-1.1 3.6 14.6-4.3 1.1z" /></>,
  hammer: <><path d="m13 7 4 4" /><path d="M4.5 19.5 13.8 10.2" /><path d="m11 5 3-2 7 7-2 3-3-1-3-3z" /></>,
  scroll: <><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7" /><path d="M6 4a2 2 0 0 0-2 2v1h4V6a2 2 0 0 0-2-2Z" /><path d="M7 20a2 2 0 0 1-2-2V7" /><path d="M10 9h6M10 12.5h6M10 16h4" /></>,
  chart: <><path d="M4 20h16" /><rect x="5.5" y="12" width="3" height="6" rx=".8" /><rect x="10.5" y="7" width="3" height="11" rx=".8" /><rect x="15.5" y="4" width="3" height="14" rx=".8" /></>,
  speaker: <><path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" /><path d="M15 9a4 4 0 0 1 0 6" /><path d="M17.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  xmark: <><path d="m6.5 6.5 11 11" /><path d="m17.5 6.5-11 11" /></>,
  chevronLeft: <path d="m14.5 5-7 7 7 7" />,
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  repeat: <><path d="M4.5 11a7.5 7.5 0 0 1 13-4.5L19.5 9" /><path d="M19.5 4v5h-5" /><path d="M19.5 13a7.5 7.5 0 0 1-13 4.5L4.5 15" /><path d="M4.5 20v-5h5" /></>,
  sparkles: <><path d="M10 3.5 11.6 8.4 16.5 10l-4.9 1.6L10 16.5 8.4 11.6 3.5 10l4.9-1.6Z" /><path d="M17.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  flame: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.4 2.4-5.4 3.6-7.8.4 1.6 1.2 2.6 2.2 3.1C11.5 7.3 13 5 15 3c.2 3.1 3.5 5.6 3.5 11.9 0 3.5-2.6 6.1-6.5 6.1Z" />,
  key: <><circle cx="8" cy="15" r="4.5" /><path d="m11.2 11.8 8.3-8.3" /><path d="m16.5 6.5 2.5 2.5" /><path d="m14.5 8.5 2 2" /></>,
  share: <><path d="M12 3.5v11" /><path d="m8 7.5 4-4 4 4" /><path d="M8.5 10H6.5a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-2" /></>,
  download: <><path d="M12 3.5v11" /><path d="m8 10.5 4 4 4-4" /><path d="M8.5 10H6.5a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1h-2" /></>,
  pencil: <><path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" /><path d="m13.5 6.5 4 4" /></>,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6.5 12.5h.01M9.5 12.5h.01M12.5 12.5h.01M15.5 12.5h.01M8 15h8" /></>,
  checklist: <><path d="m3.5 6.5 1.5 1.5 3-3" /><path d="m3.5 13.5 1.5 1.5 3-3" /><path d="M11 7h9.5M11 14h9.5" /><path d="M4 19.5h4M11 19.5h9.5" /></>,
  cards: <><rect x="3" y="6.5" width="13" height="14" rx="2.2" /><path d="M7 6.5V5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" /></>,
  trash: <><path d="M4.5 6.5h15" /><path d="M9.5 6.5V4.5h5v2" /><path d="M6.5 6.5l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13" /></>,
  magnifier: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  table: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M3.5 14.5h17M12 4.5v15" /></>,
  wrench: <><path d="M14.5 4a4.5 4.5 0 0 0-4.2 6.1L4 16.4V20h3.6l6.3-6.3A4.5 4.5 0 0 0 20 9.5l-3 1-2.5-2.5 1-3Z" /></>,
  arrows: <><path d="M4 12h16" /><path d="m15 7 5 5-5 5" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  graduation: <><path d="m2.5 9 9.5-5 9.5 5-9.5 5z" /><path d="M6.5 11v5c1.5 1.6 3.4 2.5 5.5 2.5s4-.9 5.5-2.5v-5" /><path d="M21.5 9v6" /></>,
  bulb: <><path d="M9 17.5h6" /><path d="M10 20.5h4" /><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2V17h5v-.7c0-.8.5-1.5 1.1-2A6 6 0 0 0 12 3.5Z" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1-1" /></>,
  circle: <circle cx="12" cy="12" r="8.5" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12.3 2.8 2.7L16 9.5" /></>,
  triangle: <><path d="M12 4 21 19.5H3Z" /><path d="M12 10v4M12 16.8h.01" /></>,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 24, class: cls, weight = 1.8 }: { name: IconName; size?: number; class?: string; weight?: number }) {
  return (
    <svg
      class={'ico' + (cls ? ' ' + cls : '')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={weight}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}

/** Farbiges, abgerundetes Quadrat mit Icon – wie in den iOS-Einstellungen */
export function IconTile({ name, color, size = 34 }: { name: IconName; color: string; size?: number }) {
  return (
    <span class="icon-tile" style={{ background: color, width: `${size}px`, height: `${size}px` }}>
      <Icon name={name} size={Math.round(size * 0.62)} weight={2} />
    </span>
  );
}
