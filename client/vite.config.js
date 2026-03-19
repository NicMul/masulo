import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig ({

	plugins: [react(),jsconfigPaths()],
	server: {
		port: 3000,
		open: '/' // set to false before deloying
	},
	preview: {
		port: 3000
	},
	optimizeDeps: {
		include: ['three', 'three/webgpu', 'three-spritetext', 'react-force-graph-3d'],
	},
});