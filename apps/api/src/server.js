import { env } from './config/env.config.js';
import { createApp } from './app.js';
import { registerJobs } from './jobs/index.js';

process.env.NODE_CRON_RUN = env.NODE_CRON_RUN;
registerJobs();
createApp().listen(env.PORT, () => {
  console.info(`API escuchando en http://localhost:${env.PORT}`);
});
