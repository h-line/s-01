import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ViteFonts from 'vite-plugin-fonts'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/s-01/',
  build: {
    outDir: 'docs'
  },
  plugins: [
    vue(),
    ViteFonts({
      custom: {
        families: [{
          name: 'Inter',
          local: 'Inter',
          src: './src/assets/fonts/*',
        }],
      }
    }),
  ],
});
