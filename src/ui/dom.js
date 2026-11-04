// Atlas UI · tiny DOM toolkit. h('a.ui-btn', { href }, 'Label') → <a class="ui-btn" href>Label</a>

export function h(tag, props, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.classList.add(...String(value).split(/\s+/).filter(Boolean));
    else if (key === 'style') for (const [k, v] of Object.entries(value)) el.style.setProperty(k, v);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  el.append(...children.flat(Infinity).filter(child => child != null && child !== false));
  return el;
}

const paths = {
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  back: '<path d="M13 8H3M7 4 3 8l4 4"/>',
  down: '<path d="M8 3v10M4 9l4 4 4-4"/>',
  prev: '<path d="M10 3.5 5.5 8l4.5 4.5"/>',
  next: '<path d="m6 3.5 4.5 4.5L6 12.5"/>',
  search: '<circle cx="7" cy="7" r="4.6"/><path d="m10.5 10.5 3.5 3.5"/>',
  external: '<path d="M5 3h8v8M13 3 3 13"/>',
};

export function icon(name, size = 16) {
  const span = document.createElement('span');
  span.className = 'ui-icon';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  return span;
}

export const brandMark = () => h('span.ui-mark', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10.2" stroke="currentColor" stroke-width="1.4"/><circle cx="15.1" cy="8.9" r="2.1" fill="currentColor"/></svg>' });

export const pad = n => String(n).padStart(2, '0');
