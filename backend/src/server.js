import app from './app.js';
import { env } from './config/env.js';

// Local development only — Vercel uses the default export from app.js.
if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

export default app;
