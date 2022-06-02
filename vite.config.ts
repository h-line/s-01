import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ViteFonts from 'vite-plugin-fonts'

// https://vitejs.dev/config/
export default defineConfig({
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
