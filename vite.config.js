import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.1.43',  
    port: 2001,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '192.168.1.43',
    }
  }  
})