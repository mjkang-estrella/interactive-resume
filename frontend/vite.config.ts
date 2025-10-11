import { defineConfig } from 'vite';
import path from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, './src'),
  publicDir: path.resolve(__dirname, './public'),
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  plugins: [
    {
      name: 'copy-doc-pages',
      closeBundle() {
        // Copy doc-pages to dist after build
        const srcPagesDir = path.resolve(__dirname, 'src/pages/doc-pages');
        const distPagesDir = path.resolve(__dirname, 'dist/pages/doc-pages');

        mkdirSync(distPagesDir, { recursive: true });

        const files = readdirSync(srcPagesDir);
        files.forEach(file => {
          copyFileSync(
            path.join(srcPagesDir, file),
            path.join(distPagesDir, file)
          );
        });
        console.log(`✓ Copied ${files.length} doc-pages to dist`);
      },
    },
  ],
});
