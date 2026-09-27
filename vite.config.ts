import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

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
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})
