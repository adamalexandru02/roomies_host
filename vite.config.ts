import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // expose server on LAN
    port: 8000,        // choose your desired port
    strictPort: true,  // fail if port is already in use
    open: false        // optional: open browser automatically
  }
})
