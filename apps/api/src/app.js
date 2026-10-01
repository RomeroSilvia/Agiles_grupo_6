import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
