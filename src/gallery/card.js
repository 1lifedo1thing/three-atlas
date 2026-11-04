import { copy } from './copy.js';

const arrow = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function cover(work, lang, className, eager) {
  const image = element('img', className);
  image.src = work.cover;
  image.alt = work.coverAlt[lang];
  image.width = 1440; image.height = 900;
  image.decoding = 'async';
  image.loading = eager ? 'eager' : 'lazy';
  return image;
}

function glow(work) {
  const image = element('img', 'ambient');
  image.src = work.cover; image.alt = ''; image.setAttribute('aria-hidden', 'true');
  image.decoding = 'async'; image.loading = 'lazy';
  return image;
}

export function createWorkCard(work, lang, index) {
  const text = copy[lang];
  const article = element('article', 'work-card');
  article.dataset.workId = work.id;
  const link = element('a', 'work-link');
  link.href = work.entry;
  link.dataset.transition = `card:${work.id}`;
  link.setAttribute('aria-label', `${text.enter} — ${work.title} · ${work.subtitle[lang]}`);

  const media = element('div', 'work-media');
  const picture = element('div', 'work-picture');
  const image = cover(work, lang, 'work-cover world-image', index === 0);
  image.addEventListener('error', () => { image.hidden = true; picture.classList.add('cover-missing'); }, { once: true });
  const mode = element('span', 'work-mode');
  mode.append(element('i'), document.createTextNode(text.mode));
  const enter = element('span', 'work-enter');
  enter.setAttribute('aria-hidden', 'true');
  enter.innerHTML = `<span>${text.enter}</span>${arrow}`;
  picture.append(image, mode, enter);
  media.append(glow(work), picture);

  const info = element('div', 'work-info');
  const metadata = element('p', 'work-metadata');
  metadata.append(element('span', 'work-number', String(index + 1).padStart(2, '0')), element('span', '', work.category[lang]));
  const title = element('h3', 'work-title', work.title);
  const subtitle = element('p', 'work-subtitle', work.subtitle[lang]);
  const summary = element('p', 'work-summary', work.summary[lang]);
  const author = element('p', 'work-author', `${work.author.name} / @${work.author.handle}`);
  info.append(metadata, title, subtitle, summary, author);

  link.append(media, info);
  article.append(link);
  return article;
}

/** The opening window: the first work in the catalogue, presented full width. */
export function createFeature(work, lang) {
  const text = copy[lang];
  const stage = element('div', 'feature-stage');
  stage.append(glow(work));
  const link = element('a', 'feature-window');
  link.href = work.entry;
  link.dataset.transition = 'feature';
  link.setAttribute('aria-label', `${text.enter} — ${work.title} · ${work.subtitle[lang]}`);
  const image = cover(work, lang, 'feature-cover world-image', true);
  image.fetchPriority = 'high';
  const caption = element('div', 'feature-caption');
  const meta = element('p', 'feature-meta');
  meta.append(element('span', 'feature-latest', text.latest), element('span', '', `01 · ${work.category[lang]}`), element('span', '', text.mode));
  const title = element('h2', 'feature-title', work.title);
  title.id = 'feature-title';
  const subtitle = element('p', 'feature-subtitle', work.subtitle[lang]);
  const enter = element('span', 'feature-enter');
  enter.setAttribute('aria-hidden', 'true');
  enter.innerHTML = `<span>${text.enter}</span>${arrow}`;
  const words = element('div', 'feature-words');
  words.append(meta, title, subtitle);
  caption.append(words, enter);
  link.append(image, element('div', 'feature-shade'), caption);
  stage.append(link);
  return stage;
}
