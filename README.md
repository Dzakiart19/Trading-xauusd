# XAU/USD Telegram Signal Bot (TypeScript + Telegraf)

Bot that monitors XAU/USD and sends scalping signals with automatic SL/TP and a chart image. Built with Node.js + TypeScript and ready to deploy to Koyeb.

Quick start

- Copy `.env.example` to `.env` and fill `TELEGRAM_BOT_TOKEN` and `POLYGON_API_KEY`.
- Install deps: `npm install`
- Build: `npm run build`
- Start: `npm start`

Notes

- Default `POLYGON_SYMBOL` is `OANDA:XAUUSD`. If Polygon uses different symbol in your account change it in `.env`.
- The project fetches M5 and M15 candles, computes EMA21, EMA50 and RSI14 and applies the Triple EMA + RSI scalping rules.
- Image charts are generated via Image-Charts and sent via `sendPhoto` with a detailed caption.

Deployment (Koyeb)

- Ensure `dist/index.js` exists (run build) and set environment variables in Koyeb.
- Use the provided `Procfile` and `web: node dist/index.js` command.

Disclaimer

This bot is for educational/demo purposes only. Not financial advice. DYOR.
# Trading-xauusd