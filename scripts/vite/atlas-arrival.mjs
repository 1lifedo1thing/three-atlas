// Injects the Three Atlas arrival layer into every registered work page at build/dev time,
// so work pages stay exactly as their authors wrote them.
// Pairs with src/gallery/transitions.js and the .atlas-arrival styles in src/shared/experience-nav.css.

const snippet = `<script data-atlas-arrival>
(() => {
  const root = new URL('../../', location.href).href;
  const atlas = url => { if (!url) return false; const u = new URL(url); u.hash = u.search = ''; return u.href === root || u.href === root + 'index.html'; };
  addEventListener('pagereveal', event => {
    if (!event.viewTransition || !atlas(navigation?.activation?.from?.url)) return;
    const still = document.querySelector('.atlas-arrival');
    if (!still) return;
    still.src = new URL(still.dataset.src, root).href;
    document.documentElement.classList.add('atlas-arrived');
  });
  addEventListener('pageswap', event => {
    if (!event.viewTransition || !atlas(event.activation?.entry?.url)) return;
    document.documentElement.classList.remove('atlas-arrived');
    const scene = document.querySelector('canvas');
    if (scene) scene.style.viewTransitionName = 'atlas-world';
  });
})();
</script>`;

export function atlasArrival(works) {
  const byEntry = new Map(works.map(work => [`/${work.entry}`, work]));
  return {
    name: 'three-atlas:arrival',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const work = byEntry.get(ctx.path.replace(/\/$/, '/index.html'));
        if (!work) return html;
        return html
          .replace('</head>', `${snippet}\n</head>`)
          .replace(/<body([^>]*)>/, `<body$1>\n<img class="atlas-arrival" data-src="${work.cover}" alt="" aria-hidden="true" decoding="async" />`);
      },
    },
  };
}
