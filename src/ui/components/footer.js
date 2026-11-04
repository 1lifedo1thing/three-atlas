import { h, brandMark } from '../dom.js';

const link = item => h('li', null, h('a', { href: item.href, target: item.external ? '_blank' : null, rel: item.external ? 'noopener noreferrer' : null }, item.label, item.external ? ' ↗' : ''));
const column = col => h('nav.ui-footer__col', { 'aria-label': col.title }, h('p.ui-footer__heading', null, col.title), h('ul', null, col.links.map(link)));

/** Footer · closing line, link columns, legal row and the wordmark. columns: [{ title, links: [{ label, href, external }] }] */
export function Footer({ closing, columns = [], legal = [], extra }) {
  return h('footer.ui-footer', null,
    h('div.ui-container', null,
      closing ? h('p.ui-footer__closing.ui-h1', { 'data-reveal': '' }, closing) : null,
      h('div.ui-footer__grid', null,
        h('a.ui-footer__brand', { href: './', 'aria-label': 'Three Atlas' }, brandMark(), h('span', null, 'Three Atlas')),
        columns.map(column)),
      h('div.ui-footer__legal', null, legal.map(item => h('span', null, item)), extra)),
    h('p.ui-footer__mark', { 'aria-hidden': 'true' }, 'Three Atlas'));
}
