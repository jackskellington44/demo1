import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/demo1/snapshots/initial-post-system/',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main/index.html'),
      },
    },
  },
});
