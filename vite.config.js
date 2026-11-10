import { defineConfig } from 'vite';
export default defineConfig({ base: '/sample-data-explorer/', build: { outDir: 'docs', emptyOutDir: false, chunkSizeWarningLimit: 2200 } });
