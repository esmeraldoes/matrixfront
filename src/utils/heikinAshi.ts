// src/utils/heikinAshi.ts
import type { CandlestickData } from "lightweight-charts";

/**
 * Convert normal candles -> Heikin-Ashi candles
 * Input: sorted oldest -> newest
 */
export function computeHeikinAshi(bars: CandlestickData[]): CandlestickData[] {
  if (!bars || bars.length === 0) return [];

  const out: CandlestickData[] = [];
  let prevHAOpen = (bars[0].open + bars[0].close) / 2;
  let prevHAClose = (bars[0].open + bars[0].high + bars[0].low + bars[0].close) / 4;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const haClose = (b.open + b.high + b.low + b.close) / 4;
    const haOpen = i === 0 ? (b.open + b.close) / 2 : (prevHAOpen + prevHAClose) / 2;
    const haHigh = Math.max(b.high, haOpen, haClose);
    const haLow = Math.min(b.low, haOpen, haClose);

    const ha: CandlestickData = {
      time: b.time,
      open: Number(haOpen),
      high: Number(haHigh),
      low: Number(haLow),
      close: Number(haClose),
    };

    out.push(ha);
    prevHAOpen = haOpen;
    prevHAClose = haClose;
  }

  return out;
}
