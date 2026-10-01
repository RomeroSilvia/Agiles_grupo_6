import { env } from './config/env.config.js';
import { createApp } from './app.js';

createApp().listen(env.PORT, () => {
  console.info(`API escuchando en http://localhost:${env.PORT}`);
});
