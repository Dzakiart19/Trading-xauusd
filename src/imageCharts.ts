import qs from 'qs';

export function buildImageChartsUrl(params: {
  closes: number[];
  ema21: (number | null)[];
  ema50: (number | null)[];
  entry: number;
  sl: number;
  tp: number;
  title?: string;
  base?: string;
}) {
  const base = params.base || process.env.IMAGE_CHARTS_BASE || 'https://image-charts.com/chart';

  // Prepare series: close, ema21, ema50 (pad nulls as empty)
  const closeSeries = params.closes.join(',');
  const ema21Series = params.ema21.map((v) => (v == null ? '' : v)).join(',');
  const ema50Series = params.ema50.map((v) => (v == null ? '' : v)).join(',');

  // Data param: chd=t:series1|series2|series3
  const chd = `t:${closeSeries}|${ema21Series}|${ema50Series}`;

  const labels = ['Close', 'EMA21', 'EMA50'];

  // Horizontal lines via chm: text at y position. Basic markers for Entry/SL/TP
  const entry = params.entry;
  const sl = params.sl;
  const tp = params.tp;

  // Use simple marker shapes: horizontal lines with labels
  const chm = [
    `H,FF0000,0,0,1,1|${entry}`,
    `H,0000FF,0,0,1,1|${sl}`,
    `H,00AA00,0,0,1,1|${tp}`
  ].join('|');

  const query = {
    cht: 'lc',
    chd,
    chdl: labels.join('|'),
    chm,
    chs: '1200x600',
    chtt: params.title || 'XAU/USD Signal'
  };

  return `${base}?${qs.stringify(query, { encode: true, arrayFormat: 'repeat' })}`;
}
