import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const BASE = '/three-atlas/'
const SITE = 'https://guanmo-ai.github.io' + BASE
const root = path.dirname(fileURLToPath(import.meta.url))

interface WorkJSON { slug: string; plate: number; title: { en: string; zh: string }; summary: { en: string; zh: string } }

const readWorks = (): { dir: string; json: WorkJSON }[] => {
  const worksDir = path.join(root, 'works')
  return fs.readdirSync(worksDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(worksDir, d.name, 'work.json')))
    .map((d) => ({ dir: path.join(worksDir, d.name), json: JSON.parse(fs.readFileSync(path.join(worksDir, d.name, 'work.json'), 'utf8')) }))
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Writes a static HTML entry for every route so deep links work on GitHub Pages and each plate has its own share card. */
function routePages(): Plugin {
  return {
    name: 'three-atlas:route-pages',
    apply: 'build',
    closeBundle() {
      const dist = path.join(root, 'dist')
      const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      const page = (rel: string, title: string, desc: string, image = SITE + 'og.png') => {
        const html = shell
          .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
          .replace(/(<meta property="og:image" content=")[^"]*/, `$1${image}`)
          .replace(/(<meta property="og:url" content=")[^"]*/, `$1${SITE}${rel}`)
          .replace(/(<link rel="canonical" href=")[^"]*/, `$1${SITE}${rel}`)
        const out = path.join(dist, rel, rel.endsWith('.html') ? '' : 'index.html')
        fs.mkdirSync(path.dirname(out), { recursive: true })
        fs.writeFileSync(out, html)
      }
      page('atlas/', 'The Atlas — Three Atlas', 'Every plate of Three Atlas, suspended in one celestial chart.')
      for (const { dir, json } of readWorks()) {
        const no = String(json.plate).padStart(3, '0')
        const poster = path.join(dir, 'poster.jpg')
        let image: string | undefined
        if (fs.existsSync(poster)) {
          fs.mkdirSync(path.join(dist, 'works', json.slug), { recursive: true })
          fs.copyFileSync(poster, path.join(dist, 'works', json.slug, 'poster.jpg'))
          image = `${SITE}works/${json.slug}/poster.jpg`
        }
        page(`works/${json.slug}/`, `${json.title.en} — PL. ${no} — Three Atlas`, json.summary.en, image)
      }
      page('404.html', 'Off the map — Three Atlas', 'This territory has not been charted yet.')
    },
  }
}

export default defineConfig({
  base: BASE,
  resolve: { alias: { '@engine': path.join(root, 'src/engine') } },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  plugins: [routePages()],
})
