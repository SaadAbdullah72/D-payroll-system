import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Ye line add karein

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Ye line add karein
  ],
})