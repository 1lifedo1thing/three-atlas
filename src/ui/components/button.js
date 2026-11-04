import { h, icon } from '../dom.js';

/**
 * Button · <a> when `href` is given, otherwise <button>.
 * variant: 'primary' | 'secondary' | 'ghost' · size: 'sm' | 'md' | 'lg' · icon: name from dom.js or null
 */
export function Button({ label, href, variant = 'primary', size = 'md', icon: iconName = 'arrow', attrs = {}, onClick } = {}) {
  const tag = href ? 'a' : 'button';
  return h(`${tag}.ui-btn.ui-btn--${variant}.ui-btn--${size}`, { href, type: href ? null : 'button', onClick, ...attrs },
    h('span.ui-btn__label', null, label),
    iconName ? icon(iconName, size === 'sm' ? 14 : 16) : null);
}

/** Badge · small status pill. `live` adds the breathing dot used for real-time works. */
export const Badge = ({ label, live = false }) => h('span.ui-badge', null, live ? h('i.ui-badge__dot') : null, label);
