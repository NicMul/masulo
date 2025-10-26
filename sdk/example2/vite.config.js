import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.js',
      name: 'MesuloGameComponents',
      fileName: (format) => `game-components.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        // Single file output
        inlineDynamicImports: true,
        assetFileNames: 'game-components.css'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for SDK feedback
        drop_debugger: true
      }
    },
    cssMinify: true,
    // Target modern browsers
    target: 'es2015',
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': '/Users/develop/Code/mesolu/sdk/example2/src'
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
