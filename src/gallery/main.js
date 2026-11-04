import works from '../../content/works.json';
import { selectWorks } from './model.js';
import { createFeature, createWorkCard } from './card.js';
import { copy } from './copy.js';
import { bindTransitions } from './transitions.js';
import './gallery.css';

const search = document.querySelector('#search');
const grid = document.querySelector('#works');
const feature = document.querySelector('#feature');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'zh';
try { if (localStorage.getItem('three-atlas.language') === 'en') language = 'en'; } catch { /* Optional preference. */ }

function renderWorks() {
  const selected = selectWorks(works, search.value);
  grid.replaceChildren(...selected.map(work => createWorkCard(work, language, works.indexOf(work))));
  grid.dataset.count = String(selected.length);
  document.querySelector('#result-count').textContent = copy[language].count(selected.length);
  document.querySelector('#empty').hidden = selected.length !== 0;
}

function renderLanguage() {
  const text = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = text.pageTitle;
  document.querySelectorAll('[data-copy]').forEach(node => { node.textContent = text[node.dataset.copy]; });
  search.placeholder = text.placeholder;
  document.querySelector('#language').setAttribute('aria-label', text.languageLabel);
  document.querySelector('#nav-count').textContent = String(works.length).padStart(2, '0');
  if (works[0]) feature.replaceChildren(createFeature(works[0], language));
  feature.hidden = !works[0];
  renderWorks();
  frame();
}

// ── The opening window ────────────────────────────────────
// As the visitor scrolls, the first work's window widens until it fills the screen.
const hero = document.querySelector('.hero');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
function frame() {
  const vh = innerHeight, vw = document.documentElement.clientWidth;
  const still = reduced.matches;
  const rect = feature.getBoundingClientRect();
  const span = Math.max(1, rect.height - vh);
  const p = still ? 0 : ease(clamp(-rect.top / (span * 0.82)));
  const narrow = vw < 700;
  const gutter = narrow ? 16 : Math.min(72, vw * 0.044);
  const w0 = Math.min(vw - gutter * 2, 1240);
  const h0 = Math.min(narrow ? w0 * 1.22 : w0 * 0.625, vh * (narrow ? 0.7 : 0.74));
  feature.style.setProperty('--ix', `${((vw - w0) / 2) * (1 - p)}px`);
  feature.style.setProperty('--iy', `${((vh - h0) / 2) * (1 - p)}px`);
  feature.style.setProperty('--p', p.toFixed(4));
  const caption = still ? 1 : clamp((p - 0.45) / 0.4);
  feature.style.setProperty('--caption', caption.toFixed(3));
  if (!still) {
    const fade = clamp(scrollY / (vh * 0.55));
    hero.style.setProperty('--fade', fade.toFixed(3));
  }
  document.documentElement.classList.toggle('is-scrolled', scrollY > 8);
}
let queued = false;
const request = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);
reduced.addEventListener('change', request);

// ── Controls ──────────────────────────────────────────────
search.addEventListener('input', renderWorks);
document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; renderWorks(); search.focus(); });
document.querySelector('#language').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem('three-atlas.language', language); } catch { /* Optional preference. */ }
  renderLanguage();
});
addEventListener('keydown', event => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]')) return;
  event.preventDefault();
  search.focus({ preventScroll: true });
  search.scrollIntoView({ block: 'center', behavior: reduced.matches ? 'auto' : 'smooth' });
});

renderLanguage();
bindTransitions();
requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
