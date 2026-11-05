export const DEFAULT_SITE_URL = 'https://guanmo-ai.github.io/three-atlas/';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Static metadata is available to share crawlers before any page JavaScript runs. */
export function atlasMeta(works, { siteURL = DEFAULT_SITE_URL } = {}) {
  let site;
  try { site = new URL(siteURL); } catch { throw new Error('SITE_URL 必须为有效的 HTTP(S) 站点地址'); }
  if (!['https:', 'http:'].includes(site.protocol) || site.username || site.password || site.search || site.hash) throw new Error('SITE_URL 不得包含凭据、查询串或锚点，且必须使用 HTTP(S)');
  if (!site.pathname.endsWith('/')) site.pathname += '/';
  const byEntry = new Map(works.map(work => [`/${work.entry}`, work]));
  const featured = works.find(work => work.featured) ?? works[0];
  return {
    name: 'three-atlas:meta',
    transformIndexHtml: {
      order: 'post',
      handler(html, { path }) {
        const home = path === '/' || path === '/index.html';
        const work = byEntry.get(path.replace(/\/$/, '/index.html'));
        if (!home && !work) return html;
        const source = home ? featured : work;
        if (!source) return html;
        const url = new URL(home ? '' : work.entry, site).href;
        const image = new URL(source.cover, site).href;
        const title = home ? html.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'Three Atlas' : `${work.title} · Three Atlas`;
        const description = home ? html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '' : work.summary.zh;
        const alt = source.coverAlt.zh;
        const property = (name, value) => `<meta property="${name}" content="${escape(value)}" />`;
        const named = (name, value) => `<meta name="${name}" content="${escape(value)}" />`;
        const tags = [
          `<link rel="canonical" href="${escape(url)}" />`,
          property('og:type', 'website'), property('og:site_name', 'Three Atlas'), property('og:locale', 'zh_CN'),
          property('og:title', title), property('og:description', description), property('og:url', url), property('og:image', image), property('og:image:alt', alt),
          ...(source.images ? [property('og:image:width', source.images.width), property('og:image:height', source.images.height)] : []),
          named('twitter:card', 'summary_large_image'), named('twitter:creator', '@guanmo_ai'),
          named('twitter:title', title), named('twitter:description', description), named('twitter:image', image), named('twitter:image:alt', alt),
        ];
        return html.replace('</head>', `${tags.join('\n    ')}\n  </head>`);
      },
    },
  };
}
