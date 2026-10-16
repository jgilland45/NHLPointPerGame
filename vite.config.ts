import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api-web-nhl': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-web-nhl/, ''),
      },
      '/api-e-nhl': {
        target: 'https://api.nhle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-e-nhl/, ''),
      },
    },
  },
})
