import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // './' base lets the built index.html load assets via file:// in Electron
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
