import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// The SQLite API server (npm run server) listens on :3001; proxy /api to it in dev.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Required for SSE (devices/stream, events) and MJPEG (camera/stream)
        ws: true,
      },
    },
  },
});
