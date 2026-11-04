import type { Lang, Localized } from '@engine'

const dict = {
  index: { en: 'Index', zh: '目录' },
  atlas: { en: 'Atlas', zh: '星图' },
  vol: { en: 'Vol. I', zh: '第一卷' },
  kicker: { en: 'Interactive 3D worlds', zh: '可交互的三维世界' },
  kicker2: { en: 'Charted in the browser', zh: '在浏览器中测绘' },
  hero1: { en: 'A world', zh: '一册图鉴，' },
  hero2: { en: 'of worlds.', zh: '万千世界。' },
  lede: {
    en: 'An atlas of interactive 3D worlds, models, simulations and experiments. Each is charted as a plate — step inside, and it becomes the whole screen.',
    zh: '一部收录交互式三维世界、模型、仿真与实验的图鉴。每件作品都是一幅图版——走进去，它便成为整个屏幕。',
  },
  cta: { en: 'Enter the Atlas', zh: '进入星图' },
  plates: { en: 'Index of Plates', zh: '图版索引' },
  charted: { en: 'charted', zh: '已测绘' },
  uncharted: { en: 'uncharted', zh: '待测绘' },
  terra: { en: 'Terra incognita', zh: '未知之地' },
  notYet: { en: 'Not yet charted', zh: '尚未测绘' },
  enter: { en: 'Enter', zh: '进入' },
  atlasHint: { en: 'Drag to look around · Select a plate to enter', zh: '拖动环顾 · 点选图版进入' },
  about: { en: 'About this plate', zh: '关于这幅图版' },
  footBig: { en: 'The atlas is <em>never finished.</em>', zh: '这部图鉴，<em>永无终章。</em>' },
  footNote: { en: 'New worlds are charted here as they are made.', zh: '新的世界，完成一件，收录一件。' },
  built: { en: 'Built with three.js', zh: '以 three.js 构建' },
  lost: { en: 'This territory has not been charted yet.', zh: '这片疆域，还没有被测绘。' },
  lostCta: { en: 'Return to the index', zh: '返回目录' },
  loading: { en: 'Charting', zh: '测绘中' },
} satisfies Record<string, Localized>

export type Key = keyof typeof dict

const pick = (): Lang => {
  const q = new URLSearchParams(location.search).get('lang')
  if (q === 'en' || q === 'zh') return q
  try { const s = localStorage.getItem('atlas.lang'); if (s === 'en' || s === 'zh') return s } catch { /* storage blocked */ }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export let lang: Lang = pick()
export const t = (k: Key) => dict[k][lang]
export const l = (v: Localized) => v[lang] ?? v.en

const listeners = new Set<() => void>()
export const onLang = (fn: () => void) => listeners.add(fn)
export function setLang(next: Lang) {
  lang = next
  try { localStorage.setItem('atlas.lang', next) } catch { /* storage blocked */ }
  document.documentElement.lang = next
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => { el.innerHTML = t(el.dataset.t as Key) })
  listeners.forEach((fn) => fn())
}
