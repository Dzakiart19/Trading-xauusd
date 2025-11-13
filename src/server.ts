import express from 'express';

export function createServer() {
  const app = express();
  app.get('/', (req, res) => res.send('XAU/USD Signal Bot is running'));
  return app;
}
