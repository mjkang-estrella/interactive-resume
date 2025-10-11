import { defineConfig } from 'vite';
import path from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.join(__dirname, 'src'),
  publicDir: false,
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(__dirname, 'src', 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: false,
    proxy: {
      "/api/chatkit": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      name: 'copy-doc-pages',
      closeBundle() {
        // Copy doc-pages to dist after build
        const srcPagesDir = path.join(__dirname, 'src', 'pages', 'doc-pages');
        const distPagesDir = path.join(__dirname, 'dist', 'pages', 'doc-pages');

        try {
          mkdirSync(distPagesDir, { recursive: true });
          const files = readdirSync(srcPagesDir);
          files.forEach(file => {
            copyFileSync(
              path.join(srcPagesDir, file),
              path.join(distPagesDir, file)
            );
          });
          console.log(`✓ Copied ${files.length} doc-pages to dist`);
        } catch (err) {
          console.error('Error copying doc-pages:', err);
        }
      },
    },
  ],
});
