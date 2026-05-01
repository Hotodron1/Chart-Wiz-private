import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // './' base lets the built index.html load assets via file:// in Electron
  base: './',
  server: {
    port: 5200,
    strictPort: true, // fail if 5200 is taken rather than picking a random port
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
