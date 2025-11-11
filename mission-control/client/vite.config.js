import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig ({

	plugins: [react(),jsconfigPaths()],
	build: {
		outDir: 'build'
	},
	server: {
		port: 5002,
		open: '/'
	},
	preview: {
		port: 5002
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "src/components/global.scss";`
			}
		}
	}
});