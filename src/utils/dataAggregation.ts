// src/utils/dataAggregation.ts
import type { CandleWithVolume } from './normalizerBars';
import { toUTCTimestamp } from './normalizerBars';

export interface AggregatedBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount?: number;
  vwap?: number;
}

export const timeframeToMilliseconds = (timeframe: string): number => {
  const timeframeMap: { [key: string]: number } = {
    '1s': 1000,
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000,
    '1W': 7 * 24 * 60 * 60 * 1000,
  };
  
  return timeframeMap[timeframe] || 60 * 1000;
};

export const getNextCandleCloseTime = (timeframe: string): number => {
  const now = Date.now();
  const timeframeMs = timeframeToMilliseconds(timeframe);
  const currentCandleStart = Math.floor(now / timeframeMs) * timeframeMs;
  return currentCandleStart + timeframeMs;
};

export const aggregateBars = (bars: CandleWithVolume[], timeframeMs: number): CandleWithVolume[] => {
  if (!bars.length) return [];
  
  const aggregated: CandleWithVolume[] = [];
  let currentGroup: CandleWithVolume[] = [];
  
  // Convert timeframeMs to seconds for comparison (Lightweight Charts uses seconds)
  const timeframeSeconds = timeframeMs / 1000;
  let groupStartTime = Math.floor(bars[0].time / timeframeSeconds) * timeframeSeconds;
  
  bars.forEach(bar => {
    const barTime = bar.time;
    
    if (barTime < groupStartTime + timeframeSeconds) {
      currentGroup.push(bar);
    } else {
      if (currentGroup.length > 0) {
        aggregated.push(aggregateBarGroup(currentGroup, groupStartTime));
      }
      
      currentGroup = [bar];
      groupStartTime = Math.floor(barTime / timeframeSeconds) * timeframeSeconds;
    }
  });
  
  if (currentGroup.length > 0) {
    aggregated.push(aggregateBarGroup(currentGroup, groupStartTime));
  }
  
  return aggregated;
};

const aggregateBarGroup = (bars: CandleWithVolume[], time: number): CandleWithVolume => {
  const open = bars[0].open;
  const high = Math.max(...bars.map(b => b.high));
  const low = Math.min(...bars.map(b => b.low));
  const close = bars[bars.length - 1].close;
  const volume = bars.reduce((sum, b) => sum + b.volume, 0);
  
  // Calculate VWAP if available
  let vwap: number | undefined;
  const barsWithVwap = bars.filter(b => b.vwap && b.volume > 0);
  if (barsWithVwap.length > 0) {
    const totalValue = barsWithVwap.reduce((sum, b) => sum + (b.vwap! * b.volume), 0);
    const totalVolume = barsWithVwap.reduce((sum, b) => sum + b.volume, 0);
    vwap = totalValue / totalVolume;
  }
  
  // Calculate total trade count
  const tradeCount = bars.reduce((sum, b) => sum + (b.tradeCount || 0), 0);
  
  return {
    time: toUTCTimestamp(time), // KEY FIX: Cast to UTCTimestamp
    open,
    high,
    low,
    close,
    volume,
    tradeCount: tradeCount || undefined,
    vwap: vwap || undefined,
  };
};

export function calculateDynamicLimit(timeframe: string, desiredBars: number = 1000): number {
  const barsPerUnit: Record<string, number> = {
    '1m': 24 * 60,      // Bars per day
    '5m': 24 * 12,      // Bars per day
    '15m': 24 * 4,      // Bars per day
    '1h': 24,           // Bars per day
    '4h': 6,            // Bars per day
    '1d': 1,            // Bars per day
    '1w': 1 / 7,        // Bars per day
  };

  const barsPerDay = barsPerUnit[timeframe] || barsPerUnit['1h'];
  const daysNeeded = Math.ceil(desiredBars / barsPerDay);
  
  return Math.min(daysNeeded, 365);
}

export function calculateDateRange(timeframe: string, limit: number = 1000): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  const timeframeMs = timeframeToMilliseconds(timeframe);
  const totalTimeMs = limit * timeframeMs;
  
  start.setTime(end.getTime() - totalTimeMs);
  
  return { start, end };
}

export function calculateStartDate(timeframe: string, limit: number, referenceDate: Date): Date {
  const startDate = new Date(referenceDate);

  switch (timeframe) {
    case "1m":
      startDate.setMinutes(startDate.getMinutes() - limit);
      break;
    case "5m":
      startDate.setMinutes(startDate.getMinutes() - (limit * 5));
      break;
    case "15m":
      startDate.setMinutes(startDate.getMinutes() - (limit * 15));
      break;
    case "1h":
      startDate.setHours(startDate.getHours() - limit);
      break;
    case "4h":
      startDate.setHours(startDate.getHours() - (limit * 4));
      break;
    case "1D":
      startDate.setDate(startDate.getDate() - limit);
      break;
    case "1W":
      startDate.setDate(startDate.getDate() - (limit * 7));
      break;
    default:
      startDate.setDate(startDate.getDate() - 1);
  }

  return startDate;
}

