import { h } from '../dom.js';
import { Button } from './button.js';
/** Minimal independent work chrome; the artwork supplies its canvas and readiness. */
export function ExperienceShell({ title, subtitle, canvasLabel, home, backLabel }) {
  const canvas = h('canvas.ui-experience__canvas', { tabindex: '0', 'aria-label': canvasLabel });
  const status = h('p.ui-experience__status', { role: 'status', hidden: true });
  const el = h('main.ui-experience', null, canvas,
    h('header.ui-experience__nav.ui-container', null, Button({ label: backLabel, href: home, icon: 'back', variant: 'secondary', size: 'sm' })),
    h('div.ui-experience__caption.ui-container', null, h('h1.ui-h2', null, title), h('p.ui-small', null, subtitle), status));
  return Object.assign(el, { canvas, showError(message) { status.textContent = message; status.hidden = false; } });
}
