import works from '../../content/works.json';
import { selectWorks } from './model.js';
import { createWorkCard } from './card.js';
import { copy } from './copy.js';
import './gallery.css';

const search = document.querySelector('#search');
const grid = document.querySelector('#works');
let language = 'zh';
try { if (localStorage.getItem('three-atlas.language') === 'en') language = 'en'; } catch { /* Optional preference. */ }

function renderWorks() {
  const selected = selectWorks(works, search.value);
  grid.replaceChildren(...selected.map((work, index) => createWorkCard(work, language, index)));
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
  renderWorks();
}

search.addEventListener('input', renderWorks);
document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; renderWorks(); search.focus(); });
document.querySelector('#language').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem('three-atlas.language', language); } catch { /* Optional preference. */ }
  renderLanguage();
});

renderLanguage();
