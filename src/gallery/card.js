import { copy } from './copy.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createWorkCard(work, lang, index) {
  const text = copy[lang];
  const article = element('article', 'work-card');
  article.dataset.workId = work.id;
  const link = element('a', 'work-link');
  link.href = work.entry;
  link.setAttribute('aria-label', `${text.enter} — ${work.title}`);
  const picture = element('div', 'work-picture');
  const image = element('img', 'work-cover');
  image.src = work.cover;
  image.alt = work.coverAlt[lang];
  image.width = 1440; image.height = 900;
  image.decoding = 'async'; image.loading = index === 0 ? 'eager' : 'lazy';
  if (index === 0) image.fetchPriority = 'high';
  image.addEventListener('error', () => { image.hidden = true; picture.classList.add('cover-missing'); }, { once: true });
  const badge = element('span', 'work-mode', text.mode);
  const enter = element('span', 'work-enter', `${text.enter} ↗`);
  enter.setAttribute('aria-hidden', 'true');
  picture.append(image, badge, enter);
  const info = element('div', 'work-info');
  const metadata = element('div', 'work-metadata');
  metadata.append(element('span', 'work-number', String(index + 1).padStart(2, '0')), element('span', '', work.category[lang]));
  const title = element('h3', 'work-title', work.title);
  const subtitle = element('p', 'work-subtitle', work.subtitle[lang]);
  const summary = element('p', 'work-summary', work.summary[lang]);
  info.append(metadata, title, subtitle, summary);
  link.append(picture, info);
  article.append(link);
  return article;
}
