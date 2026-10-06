import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { PRERENDER_LOCALES, buildLocalizedHtml, buildLlmsTxt } from './src/seo/prerender'

// Al terminar la build: index.html por idioma con el contenido real dentro
// (dist/index.html en español, dist/{en,fr,pt}/index.html) y dist/llms.txt,
// para buscadores y bots de IA que no ejecutan JavaScript. Ver
// src/seo/prerender.ts. Vercel sirve estos archivos antes de aplicar el
// rewrite a /index.html de vercel.json.
function seoPrerender(): Plugin {
  let outDir = 'dist'
  return {
    name: 'seo-prerender',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      for (const locale of PRERENDER_LOCALES) {
        const dir = locale === 'es' ? outDir : path.join(outDir, locale)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), buildLocalizedHtml(template, locale))
      }
      fs.writeFileSync(path.join(outDir, 'llms.txt'), buildLlmsTxt())
    },
  }
}

export default defineConfig({
  // svgr: lets `import Foo from './x.svg?react'` bring an SVG in as a real
  // React component (individual <path>/<text> elements reachable via ref),
  // instead of the opaque `<img src>` embed used for static logos elsewhere.
  plugins: [
    react(),
    tailwindcss(),
    // `cleanupIds: false`: SVGR's default SVGO pass strips/renames any id that
    // isn't referenced inside the file (via `url(#…)`). HeroWordmark selects
    // the per-language layer groups of the transition wordmark by id
    // (`#frances`, `#espanol`, `#portugues`, `#ingles`), so those have to
    // survive the build. Passing an explicit `plugins` list also means
    // `prefixIds` (which SVGR would otherwise add) doesn't run and rename
    // them. `removeViewBox: false` keeps the default SVGR carries for scaling.
    svgr({
      svgrOptions: {
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: { overrides: { removeViewBox: false, cleanupIds: false } },
            },
          ],
        },
      },
    }),
    seoPrerender(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})
