import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Icon, type IconName } from './Icons';

function useScrolled(threshold = 44): boolean {
  const [s, set] = useState(false);
  useEffect(() => {
    const on = () => set(window.scrollY > threshold);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return s;
}

/**
 * Großer Titel wie in iOS. Beim Scrollen erscheint oben eine einheitliche Glasleiste
 * mit kleinem Titel (Scroll-Edge-Effekt), damit Text darunter lesbar bleibt.
 */
export function PageHeader({ title, subtitle, trailing, leading, titleClass }: {
  title: ComponentChildren; subtitle?: ComponentChildren; trailing?: ComponentChildren; leading?: ComponentChildren; titleClass?: string;
}) {
  const scrolled = useScrolled();
  return (
    <>
      <div class={'scroll-edge' + (scrolled ? ' show' : '')} aria-hidden={!scrolled}>
        <div class="se-side">{leading}</div>
        <div class="se-title">{title}</div>
        <div class="se-side end">{trailing}</div>
      </div>
      <header class="large-header">
        {leading && <div class="lh-leading">{leading}</div>}
        <div class="lh-row">
          <div>
            <h1 class={'large-title' + (titleClass ? ' ' + titleClass : '')}>{title}</h1>
            {subtitle && <div class="lh-sub">{subtitle}</div>}
          </div>
          {trailing && <div class="lh-trailing">{trailing}</div>}
        </div>
      </header>
    </>
  );
}

/** Kompakte Leiste für Übungen: runde Glasknöpfe links/rechts, Titel oder Fortschritt in der Mitte */
export function NavBar({ leading, center, trailing }: { leading?: ComponentChildren; center?: ComponentChildren; trailing?: ComponentChildren }) {
  const scrolled = useScrolled(4);
  return (
    <div class={'navbar' + (scrolled ? ' scrolled' : '')}>
      <div class="nb-side">{leading}</div>
      <div class="nb-center">{center}</div>
      <div class="nb-side end">{trailing}</div>
    </div>
  );
}

export function GlassButton({ icon, label, onClick, text }: { icon?: IconName; label: string; onClick: () => void; text?: string }) {
  return (
    <button type="button" class={'glass-btn' + (text ? ' with-text' : '')} aria-label={label} onClick={onClick}>
      {icon && <Icon name={icon} size={20} weight={2.2} />}
      {text && <span>{text}</span>}
    </button>
  );
}

/** Gruppierte Liste (Inset Grouped) */
export function Group({ header, footer, children, class: cls }: { header?: ComponentChildren; footer?: ComponentChildren; children: ComponentChildren; class?: string }) {
  return (
    <section class={'group' + (cls ? ' ' + cls : '')}>
      {header && <h2 class="group-header">{header}</h2>}
      <div class="group-body">{children}</div>
      {footer && <p class="group-footer">{footer}</p>}
    </section>
  );
}

export function Row({ icon, title, subtitle, detail, chevron, onClick, children, class: cls }: {
  icon?: ComponentChildren; title?: ComponentChildren; subtitle?: ComponentChildren; detail?: ComponentChildren;
  chevron?: boolean; onClick?: () => void; children?: ComponentChildren; class?: string;
}) {
  const body = (
    <>
      {icon && <span class="row-icon">{icon}</span>}
      <span class="row-main">
        {title && <span class="row-title">{title}</span>}
        {subtitle && <span class="row-sub">{subtitle}</span>}
        {children}
      </span>
      {detail !== undefined && <span class="row-detail">{detail}</span>}
      {chevron && <Icon name="chevronRight" size={16} weight={2.4} class="row-chev" />}
    </>
  );
  return onClick ? (
    <button type="button" class={'row tappable' + (cls ? ' ' + cls : '')} onClick={onClick}>{body}</button>
  ) : (
    <div class={'row' + (cls ? ' ' + cls : '')}>{body}</div>
  );
}

/** iOS-Schalter */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label class="toggle" aria-label={label}>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
      <span class="toggle-track"><span class="toggle-thumb" /></span>
    </label>
  );
}
