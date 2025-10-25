import { defineConfig } from 'vite';
import path from 'path';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const copyDirectory = (srcDir: string, destDir: string) => {
  mkdirSync(destDir, { recursive: true });
  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
};

const contentsDir = path.join(__dirname, '..', 'contents');

export default defineConfig({
  root: path.join(__dirname, 'src'),
  publicDir: false,
  envPrefix: ['VITE_', 'OPENAI_'],
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
      '/api/chatkit': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/waitlist': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      name: 'serve-and-copy-static-assets',
      configureServer(server) {
        server.middlewares.use('/contents', (req, res, next) => {
          const requestPath = decodeURIComponent(req.url?.split('?')[0] ?? '');
          const sanitized = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
          const relativePath = sanitized.replace(/^[/\\]+/, '');
          const absolutePath = path.join(contentsDir, relativePath);

          if (!absolutePath.startsWith(contentsDir)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }

          if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
            next();
            return;
          }

          const ext = path.extname(absolutePath).toLowerCase();
          const mimeType =
            ext === '.pdf'
              ? 'application/pdf'
              : ext === '.png'
                ? 'image/png'
                : ext === '.jpg' || ext === '.jpeg'
                  ? 'image/jpeg'
                  : 'application/octet-stream';

          res.setHeader('Content-Type', mimeType);

          const stream = createReadStream(absolutePath);
          stream.on('error', err => {
            console.error('Error streaming static asset:', err);
            res.statusCode = 500;
            res.end('Error loading asset');
          });
          stream.pipe(res);
        });
      },
      closeBundle() {
        // Copy doc-pages to dist after build
        const srcPagesDir = path.join(__dirname, 'src', 'pages', 'doc-pages');
        const distPagesDir = path.join(__dirname, 'dist', 'pages', 'doc-pages');
        const distContentsDir = path.join(__dirname, 'dist', 'contents');

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

        try {
          if (existsSync(contentsDir)) {
            copyDirectory(contentsDir, distContentsDir);
            console.log('✓ Copied contents assets to dist/contents');
          } else {
            console.warn('Warning: contents directory not found.');
          }
        } catch (err) {
          console.error('Error copying contents directory:', err);
        }
      },
    },
  ],
});
