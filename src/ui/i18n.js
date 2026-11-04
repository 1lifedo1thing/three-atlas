// Atlas UI · language. Chinese by default; the visitor's choice is remembered across pages.
const KEY = 'three-atlas.language';
let lang = 'zh';
try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch { /* Optional preference. */ }
const listeners = new Set();

export const getLang = () => lang;
export const htmlLang = () => (lang === 'zh' ? 'zh-CN' : 'en');
export const pick = value => (value && typeof value === 'object' ? value[lang] ?? value.zh ?? value.en : value);
export const onLang = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export function setLang(next) {
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch { /* Optional preference. */ }
  document.documentElement.lang = htmlLang();
  listeners.forEach(fn => fn(lang));
}
document.documentElement.lang = htmlLang();
