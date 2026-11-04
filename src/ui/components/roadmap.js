import { h } from '../dom.js';
import { SectionHead } from './section-head.js';
import { Badge } from './button.js';

/** Roadmap · a centered next-step statement with an optional caller-supplied status. */
export function Roadmap({ id, eyebrow, title, lede, badge }) {
  return h('section.ui-roadmap.ui-section.ui-container', { id, 'aria-labelledby': `${id}-title` },
    badge ? h('div.ui-roadmap__badge', null, Badge({ label: badge })) : null,
    SectionHead({ id: `${id}-title`, size: 'h1', align: 'center', eyebrow, title, lede }));
}
