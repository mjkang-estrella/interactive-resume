import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { llmsTxt } from './plugins/llms-txt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const src = path.join(__dirname, 'src');

export default defineConfig({
  root: src,
  // Served as-is at the site root: /contents/* (PDF, favicon) and /media/* (images, icons).
  publicDir: path.join(__dirname, 'public'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(src, 'index.html'),
    },
  },
  resolve: {
    alias: {
      '@': src,
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  plugins: [
    llmsTxt({
      site: 'https://resume-os.com',
      indexHtml: path.join(src, 'index.html'),
      docPagesDir: path.join(src, 'pages', 'doc-pages'),
      aboutMarkdown: path.join(__dirname, 'content', 'tell-me-about-yourself.md'),
    }),
  ],
});
