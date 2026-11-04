import { coordLabel, entries, type Entry } from './registry'
import { href } from './router'
import { l, t, type Key } from './i18n'

const icon = {
  glyph: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><ellipse cx="12" cy="12" rx="4.6" ry="10.5"/><path d="M1.5 12h21"/><circle cx="17.6" cy="6.9" r="1.5" fill="#ff5b37" stroke="none"/></svg>`,
  arrow: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>`,
  back: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M14 8H3M7 4L3 8l4 4"/></svg>`,
  gh: `<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`,
}

const T = (k: Key, tag = 'span', cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-t="${k}">${t(k)}</${tag}>`
const pad = (n: number) => String(n).padStart(2, '0')

export const INDEX_SLOTS = Math.max(4, Math.ceil((entries.length + 1) / 4) * 4)
export const ATLAS_SLOTS = Math.max(13, entries.length + 5)

function card(e: Entry | null, i: number) {
  const no = String(i + 1).padStart(3, '0')
  if (!e) return `
    <div class="plate is-uncharted" aria-hidden="true">
      <div class="plate__frame"></div>
      <div class="plate__meta">
        <span class="plate__no mono">PL. ${no}</span><span class="plate__year mono">—</span>
        ${T('terra', 'h3', 'plate__title')}
        ${T('notYet', 'span', 'plate__medium mono')}<span class="plate__coord mono">${coordLabel(i + 1)}</span>
      </div>
    </div>`
  const m = e.meta
  return `
    <a class="plate" href="${href({ mode: 'work', slug: m.slug })}" data-link data-slug="${m.slug}">
      <div class="plate__frame"></div>
      <div class="plate__meta">
        <span class="plate__no mono">PL. ${e.no}</span><span class="plate__year mono">${m.year}</span>
        <h3 class="plate__title" data-w="${m.slug}:title">${l(m.title)}</h3>
        <span class="plate__medium mono" data-w="${m.slug}:medium">${m.medium.map(l).join(' · ')}</span><span class="plate__coord mono">${coordLabel(m.plate)}</span>
      </div>
    </a>`
}

export function buildUI(root: HTMLElement) {
  const charted = entries.length
  const last = String(INDEX_SLOTS).padStart(3, '0')
  root.innerHTML = `
  <canvas class="stage" aria-hidden="true"></canvas>
  <header class="bar">
    <a class="brand" href="${href({ mode: 'index' })}" data-link aria-label="Three Atlas">${icon.glyph}<span>Three Atlas</span><small>${T('vol')}</small></a>
    <nav class="modes" aria-label="View">
      <a href="${href({ mode: 'index' })}" data-link data-mode="index">${T('index')}<span class="mono">${pad(charted)}</span></a>
      <a href="${href({ mode: 'atlas' })}" data-link data-mode="atlas">${T('atlas')}<span class="mono">3D</span></a>
      <span class="modes__thumb" aria-hidden="true"></span>
    </nav>
    <div class="bar__end">
      <button class="lang mono" type="button" aria-label="Language"><span data-l="en">EN</span>/<span data-l="zh">中</span></button>
      <a class="bar__gh" href="https://github.com/guanmo-ai/three-atlas" target="_blank" rel="noopener" aria-label="GitHub">${icon.gh}</a>
    </div>
  </header>

  <main class="index">
    <section class="hero">
      <p class="hero__kicker mono fade-up"><span>${T('vol')}</span>${T('kicker')}<span>PL. 001 — ${last}</span></p>
      <h1 class="hero__title"><span class="line"><span data-t="hero1">${t('hero1')}</span></span><span class="line"><em><span data-t="hero2">${t('hero2')}</span></em></span></h1>
      <div class="hero__foot">
        <div class="hero__copy fade-up">
          ${T('lede', 'p', 'hero__lede')}
          <div class="lost"><p class="mono">404 — ${T('lost')}</p><a class="cta" href="${href({ mode: 'index' })}" data-link>${T('lostCta')}${icon.arrow}</a></div>
        </div>
        <div class="hero__meta fade-up">
          <a class="cta" href="${href({ mode: 'atlas' })}" data-link>${T('cta')}${icon.arrow}</a>
          <span class="mono">${T('kicker2')}</span>
        </div>
      </div>
    </section>

    <section class="plates" aria-labelledby="plates-title">
      <header class="plates__head">
        <h2 id="plates-title" data-t="plates">${t('plates')}</h2>
        <span class="mono">${pad(charted)} ${T('charted')} · ${pad(INDEX_SLOTS - charted)} ${T('uncharted')}</span>
      </header>
      <div class="plates__grid">${Array.from({ length: INDEX_SLOTS }, (_, i) => card(entries[i] ?? null, i)).join('')}</div>
    </section>

    <footer class="foot">
      <p class="foot__big" data-t="footBig">${t('footBig')}</p>
      <div class="foot__row mono">
        <span>© ${new Date().getFullYear()} Guanmo 观默</span>
        ${T('footNote')}
        <span>${T('built')} · <a href="https://github.com/guanmo-ai/three-atlas" target="_blank" rel="noopener">GitHub ↗</a></span>
      </div>
    </footer>
  </main>

  <div class="labels" aria-hidden="true">${Array.from({ length: ATLAS_SLOTS }, (_, i) => {
    const e = entries[i]
    return `<div class="label${e ? '' : ' is-uncharted'}"><span class="mono">PL. ${String(i + 1).padStart(3, '0')}</span><b ${e ? `data-w="${e.meta.slug}:title"` : 'data-t="terra"'}>${e ? l(e.meta.title) : t('terra')}</b></div>`
  }).join('')}</div>
  <p class="atlas-hint mono"><i></i>${T('atlasHint')}</p>
  <p class="compass mono" aria-hidden="true"></p>

  <section class="hud" aria-live="polite">
    <a class="hud__back" href="${href({ mode: 'index' })}" data-link>${icon.back}<span class="hud__back-label"></span></a>
    <div class="hud__info">
      <span class="hud__no mono"></span>
      <h1 class="hud__title"></h1>
      <button class="hud__toggle mono" type="button" aria-expanded="false"><i>+</i>${T('about')}</button>
      <div class="hud__about"><div><p class="hud__summary"></p><ul class="hud__medium mono"></ul></div></div>
    </div>
    <p class="hud__hint mono"></p>
  </section>

  <div class="cursor" aria-hidden="true"><span class="mono"></span></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="curtain" aria-hidden="true"><div class="curtain__inner"><span class="mono">${T('loading')} · PL. 001 — ${String(charted).padStart(3, '0')}</span><div class="curtain__bar"><i></i></div></div></div>`

  const $ = <T extends Element>(s: string) => root.querySelector(s) as T
  return {
    canvas: $<HTMLCanvasElement>('.stage'),
    cards: [...root.querySelectorAll<HTMLElement>('.plates__grid > .plate')],
    labels: [...root.querySelectorAll<HTMLElement>('.labels .label')],
    modes: $<HTMLElement>('.modes'),
    lang: $<HTMLButtonElement>('.lang'),
    hud: $<HTMLElement>('.hud'),
    hudBack: $<HTMLAnchorElement>('.hud__back'),
    hudBackLabel: $<HTMLElement>('.hud__back-label'),
    hudNo: $<HTMLElement>('.hud__no'),
    hudTitle: $<HTMLElement>('.hud__title'),
    hudSummary: $<HTMLElement>('.hud__summary'),
    hudMedium: $<HTMLElement>('.hud__medium'),
    hudHint: $<HTMLElement>('.hud__hint'),
    hudToggle: $<HTMLButtonElement>('.hud__toggle'),
    compass: $<HTMLElement>('.compass'),
    cursor: $<HTMLElement>('.cursor'),
  }
}

export type UI = ReturnType<typeof buildUI>

/** Re-apply per-work localized strings after a language switch. */
export function refreshWorkText(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => {
    const [slug, field] = el.dataset.w!.split(':')
    const e = entries.find((x) => x.meta.slug === slug)
    if (!e) return
    el.textContent = field === 'medium' ? e.meta.medium.map(l).join(' · ') : l(e.meta.title)
  })
}
