import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.jsx',
      name: 'MesuloPreactSDK',
      fileName: (format) => 'mesulo-ai-sdk.js',
      formats: ['umd']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        globals: {}
      }
    },
    minify: 'terser',
    target: 'es2015',
    sourcemap: false
  },
  server: {
    port: 3030,
    open: true
  },
  preview: {
    port: 3030
  }
});

