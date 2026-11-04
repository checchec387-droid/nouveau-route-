import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api';
import { validateSecurityEnv } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Validate critical security environment variables at startup
  // Server refuses to start if ADMIN_INITIAL_PASSWORD (< 12 chars) or ADMIN_RECOVERY_KEY (< 24 chars) are absent or weak
  try {
    validateSecurityEnv();
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }

  const app = express();
  // In AI Studio dev environment, DEFAULT_APP_PORT is 3000 and NGINX proxies to 3000, while PORT may be 8080 (for Cloud Run / Nginx).
  // Therefore, prefer 3000 if DEFAULT_APP_PORT is 3000, or check for port argument/env var properly.
  const PORT = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : (process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000));
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(cookieParser());

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARP ENGINE] Server successfully started on http://0.0.0.0:${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[SERVER ERROR] Failed to start server:', err);
  process.exit(1);
});
