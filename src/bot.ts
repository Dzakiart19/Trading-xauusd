import { Telegraf } from 'telegraf';
import { saveChat, getChats } from './storage';
import { checkForSignal, Signal } from './trader';
import { buildImageChartsUrl } from './imageCharts';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');

export const bot = new Telegraf(token);

bot.start((ctx) => {
  const id = ctx.chat?.id;
  if (id) {
    saveChat(id);
    ctx.reply('Terima kasih! Kamu akan menerima sinyal XAU/USD.');
  }
});

export async function checkAndBroadcast() {
  try {
    const signal = await checkForSignal();
    if (!signal) return;

    const chats = getChats();
    if (!chats.length) return;

    // build chart image url
    const closes = signal.m5.slice(-30).map((c) => c.c);
    // compute EMAs on those closes to plot
    // For simplicity, compute simple moving approximations using technicalindicators in image URL precomputed arrays
    // We will recreate EMA arrays here quickly
    const { EMA } = require('technicalindicators');
    function calcEMA(values: number[], period: number) {
      try {
        return EMA.calculate({ period, values });
      } catch (e) {
        return Array(values.length).fill(null);
      }
    }
    const ema21 = calcEMA(closes, 21);
    const ema50 = calcEMA(closes, 50);

    // pad EMA arrays to length of closes
    const pad = (arr: (number | null)[], len: number) => {
      const res: (number | null)[] = [];
      const padCount = len - arr.length;
      for (let i = 0; i < padCount; i++) res.push(null);
      for (const v of arr) res.push(v ?? null);
      return res;
    };

    const ema21_p = pad(ema21, closes.length);
    const ema50_p = pad(ema50, closes.length);

    const imgUrl = buildImageChartsUrl({
      closes,
      ema21: ema21_p,
      ema50: ema50_p,
      entry: signal.entry,
      sl: signal.sl,
      tp: signal.tp,
      title: `XAU/USD ${signal.side} Signal`
    });

    const caption = buildCaption(signal);

    for (const chatId of chats) {
      try {
        await bot.telegram.sendPhoto(chatId, imgUrl, { caption });
      } catch (e) {
        console.error('Failed to send to', chatId, e?.message ?? e);
      }
    }
  } catch (e) {
    console.error('checkAndBroadcast error', e?.message ?? e);
  }
}

function buildCaption(s: Signal) {
  return `🚨 SINYAL ${s.side === 'BUY' ? 'BELI' : 'JUAL'} - XAU/USD (M5) 🚨\n\nHarga Entry: $${s.entry.toFixed(2)}\n\n🎯 Take Profit: $${s.tp.toFixed(2)}\n🛡️ Stop Loss: $${s.sl.toFixed(2)}\n(RRR ≈ ${s.rrr})\n\nAnalisis:\n${s.reason.map((r) => `✅ ${r}`).join('\n')}\n\n⚠️ DYOR! Ini bukan nasihat keuangan.`;
}

export function launchBot() {
  bot.launch().then(() => console.log('Bot launched'));
}
