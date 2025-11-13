import { fetchCandles, Candle } from './polygon';
import { SMA, EMA, RSI } from 'technicalindicators';

const DEFAULT_SYMBOL = process.env.POLYGON_SYMBOL || 'OANDA:XAUUSD';

export type Signal = {
  side: 'BUY' | 'SELL';
  entry: number;
  sl: number;
  tp: number;
  rrr: string;
  reason: string[];
  candle: Candle;
  m5: Candle[];
  m15: Candle[];
};

function calcEMA(values: number[], period: number) {
  return EMA.calculate({ period, values });
}

function calcRSI(values: number[], period: number) {
  return RSI.calculate({ period, values });
}

function last<T>(arr: T[]) {
  return arr[arr.length - 1];
}

export async function checkForSignal(): Promise<Signal | null> {
  const symbol = DEFAULT_SYMBOL;

  // Fetch M15 and M5 candles (we request enough history)
  const m15 = await fetchCandles(symbol, 15, 'minute', 200).catch(() => []);
  const m5 = await fetchCandles(symbol, 5, 'minute', 200).catch(() => []);
  if (!m15.length || !m5.length) return null;

  // compute EMA50 on M15
  const m15Closes = m15.map((c) => c.c);
  const ema50_m15 = calcEMA(m15Closes, 50);
  const ema21_m15 = calcEMA(m15Closes, 21);
  const price_m15 = last(m15).c;
  const ema50_latest = last(ema50_m15);

  const reasons: string[] = [];

  const trendBullish = price_m15 > (ema50_latest ?? 0);
  if (trendBullish) reasons.push('Tren M15 Bullish');
  else reasons.push('Tren M15 Bearish');

  // On M5 compute EMA21 and EMA50 and RSI
  const m5Closes = m5.map((c) => c.c);
  const ema21_m5 = calcEMA(m5Closes, 21);
  const ema50_m5 = calcEMA(m5Closes, 50);
  const rsi_m5 = calcRSI(m5Closes, 14);

  const currentPrice = last(m5).c;

  // define zone between EMA21 and EMA50 on M5 (use latest values)
  const ema21_latest = last(ema21_m5);
  const ema50_latest_m5 = last(ema50_m5);

  // get last confirmation candle (previous closed candle)
  const confirmCandle = m5[m5.length - 2];
  if (!confirmCandle) return null;

  // BUY conditions
  if (trendBullish && ema21_latest && ema50_latest_m5) {
    // price must be between EMA21 and EMA50 (correction)
    const minZone = Math.min(ema21_latest, ema50_latest_m5);
    const maxZone = Math.max(ema21_latest, ema50_latest_m5);
    const rsiLatest = last(rsi_m5) ?? 0;
    if (confirmCandle.c > confirmCandle.o && rsiLatest > 40 && confirmCandle.c > ema21_latest && currentPrice >= minZone && currentPrice <= maxZone) {
      reasons.push('Koreksi ke zona EMA & Konfirmasi Bullish');

      // entry is close of confirm candle
      const entry = confirmCandle.c;
      // SL: low of confirm candle minus buffer
      const buffer = parseFloat(process.env.SL_BUFFER || '0.02');
      const sl = confirmCandle.l - buffer;
      const risk = Math.abs(entry - sl);
      const tp = entry + risk * 1.5;

      return {
        side: 'BUY',
        entry,
        sl,
        tp,
        rrr: '1:1.5',
        reason: reasons,
        candle: confirmCandle,
        m5,
        m15
      };
    }
  }

  // SELL conditions
  if (!trendBullish && ema21_latest && ema50_latest_m5) {
    const minZone = Math.min(ema21_latest, ema50_latest_m5);
    const maxZone = Math.max(ema21_latest, ema50_latest_m5);
    const rsiLatest = last(rsi_m5) ?? 100;
    if (confirmCandle.c < confirmCandle.o && rsiLatest < 60 && confirmCandle.c < ema21_latest && currentPrice >= minZone && currentPrice <= maxZone) {
      reasons.push('Koreksi ke zona EMA & Konfirmasi Bearish');
      const entry = confirmCandle.c;
      const buffer = parseFloat(process.env.SL_BUFFER || '0.02');
      const sl = confirmCandle.h + buffer;
      const risk = Math.abs(entry - sl);
      const tp = entry - risk * 1.5;

      return {
        side: 'SELL',
        entry,
        sl,
        tp,
        rrr: '1:1.5',
        reason: reasons,
        candle: confirmCandle,
        m5,
        m15
      };
    }
  }

  return null;
}
