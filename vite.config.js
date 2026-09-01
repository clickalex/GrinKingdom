import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base path: '/GrinKingdom/' for GitHub Pages project sites (clickalex.github.io/GrinKingdom).
// For a custom domain later, set BASE_PATH=/ in the deploy workflow or run: BASE_PATH=/ npm run build
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? (mode === 'production' ? '/GrinKingdom/' : '/'),
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Allow the sandboxed preview host (and any host) to reach the dev server.
    allowedHosts: true,
  },
}))
