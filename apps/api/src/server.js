import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  console.info(`API escuchando en http://localhost:${PORT}`);
});
