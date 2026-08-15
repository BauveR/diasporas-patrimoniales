import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  // svgr: lets `import Foo from './x.svg?react'` bring an SVG in as a real
  // React component (individual <path>/<text> elements reachable via ref),
  // instead of the opaque `<img src>` embed used for static logos elsewhere.
  plugins: [react(), tailwindcss(), svgr()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
  },
})
