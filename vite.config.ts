import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project sites under /<repo-name>/, not the domain
  // root — only apply that base path in CI builds so local dev/preview
  // still run at "/".
  base: process.env.GITHUB_ACTIONS ? '/My-Factory/' : '/',
})
