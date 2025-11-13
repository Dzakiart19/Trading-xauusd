import axios from 'axios';
import dayjs from 'dayjs';

const BASE = 'https://api.polygon.io';

export interface Candle {
  t: number; // Unix ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export async function fetchCandles(symbol: string, multiplier: number, timespan: string, limit = 500): Promise<Candle[]> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) throw new Error('POLYGON_API_KEY not set');

  // compute from/to range
  const to = dayjs().utc();
  const minutesPer = multiplier * (timespan === 'minute' ? 1 : parseInt(timespan));
  // get enough minutes
  const from = to.subtract(limit * (multiplier), 'minute');

  const fromStr = from.format('YYYY-MM-DD');
  const toStr = to.format('YYYY-MM-DD');

  // Polygon Aggregates endpoint: /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
  // NOTE: symbol should be set in env (default OANDA:XAUUSD)
  const url = `${BASE}/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/${multiplier}/${timespan}/${fromStr}/${toStr}`;
  const resp = await axios.get(url, { params: { apiKey, limit } });
  const results = resp.data?.results || [];
  return results.map((r: any) => ({ t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v }));
}
