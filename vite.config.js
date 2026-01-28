// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vitejs.dev/config/
// export default defineConfig({
//   base: '/RSVP/',
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/RSVP/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Ensure public files are included in build
  publicDir: 'public',
  build: {
    // Copy public files to dist
    copyPublicDir: true,
    // Optional: Configure rollup to ensure all assets are included
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
