// Atlas UI · motion. GSAP (ScrollTrigger, SplitText) + Lenis, with one set of rules:
// entrances use `expo.out`, scroll-linked motion is scrubbed, and reduced motion turns all of it off.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

export const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => motionQuery.matches;
export const EASE = { out: 'expo.out', inout: 'power3.inOut', std: 'power2.out' };
export const DUR = { s: 0.4, m: 0.7, l: 1.1, xl: 1.4 };

let lenis = null;

/** Smooth scrolling, synced with ScrollTrigger. Off under reduced motion. */
export function startScroll() {
  if (lenis || reduced()) return lenis;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(target, { onComplete } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis && !reduced()) lenis.scrollTo(el, { offset: 0, duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4), onComplete });
  else { el.scrollIntoView({ behavior: 'instant' }); onComplete?.(); }
}

/** Fade-and-rise every [data-reveal] in `root` as it enters; children of [data-reveal="group"] stagger. */
export function reveal(root = document) {
  if (reduced()) return;
  root.querySelectorAll('[data-reveal]').forEach(el => {
    const targets = el.dataset.reveal === 'group' ? el.children : el;
    gsap.from(targets, { y: 32, autoAlpha: 0, duration: DUR.l, ease: EASE.out, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

/** Lines of a headline rise out of a mask. */
export function riseLines(el, { delay = 0 } = {}) {
  if (reduced() || !el) return;
  const split = SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: self => gsap.from(self.lines, { yPercent: 105, duration: DUR.xl, ease: EASE.out, stagger: 0.09, delay }) });
  return split;
}

/** Wrap each word of `el` in a span (Intl.Segmenter keeps Chinese words such as 环绕 whole). */
export function splitWords(el) {
  const lang = el.closest('[lang]')?.lang || document.documentElement.lang || 'en';
  const segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
  const words = [];
  const opening = /^[「『（《“‘(\[【〔]+$/;
  let carry = '';
  const walk = node => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const { segment, isWordLike } of segmenter.segment(child.textContent)) {
          if (!segment.trim()) { frag.append(segment); continue; }
          if (opening.test(segment)) { carry += segment; continue; }
          const span = document.createElement('span');
          span.className = 'ui-word';
          span.textContent = carry + segment;
          carry = '';
          if (isWordLike || words.length === 0) { frag.append(span); words.push(span); }
          else words[words.length - 1].append(span.textContent);
        }
        child.replaceWith(frag);
      } else walk(child);
    }
  };
  walk(el);
  return words;
}

/** A paragraph that lights up word by word as it scrolls through the viewport. */
export function lightUp(el, { opacity = 0.4 } = {}) {
  if (reduced() || !el) return;
  gsap.fromTo(splitWords(el), { opacity }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true } });
}

/** Run `build` inside a GSAP context so every tween, trigger and split it creates can be reverted at once. */
export const scope = (root, build) => gsap.context(build, root);
