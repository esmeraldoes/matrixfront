// src/utils/normalizerBars.ts
import type { UTCTimestamp } from 'lightweight-charts';

export interface CandleWithVolume {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount?: number;
  vwap?: number;
}

// Type assertion helper - this is the key fix
export const toUTCTimestamp = (timestamp: number): UTCTimestamp => {
  return timestamp as UTCTimestamp;
};

// Helper function to convert Date to UTCTimestamp
export const dateToUTCTimestamp = (date: Date): UTCTimestamp => {
  return Math.floor(date.getTime() / 1000) as UTCTimestamp;
};

export function normalizeBar(bar: any): CandleWithVolume | null {
  try {
    if (!bar) return null;

    let timestamp: number;
    let open: number;
    let high: number;
    let low: number;
    let close: number;
    let volume: number;
    let tradeCount: number = 0;
    let vwap: number = 0;

    // Handle different bar formats
    if (bar.timestamp) {
      // ISO string timestamp
      if (typeof bar.timestamp === 'string') {
        timestamp = Math.floor(new Date(bar.timestamp).getTime() / 1000);
      } 
      // Unix timestamp in milliseconds
      else if (bar.timestamp > 1000000000000) {
        timestamp = Math.floor(bar.timestamp / 1000);
      }
      // Unix timestamp in seconds
      else {
        timestamp = bar.timestamp;
      }
    } else if (bar.t) {
      // Alternative timestamp field
      timestamp = Math.floor(bar.t / 1000);
    } else if (bar.time) {
      // Already in seconds - ensure it's a number
      timestamp = typeof bar.time === 'number' ? bar.time : parseInt(bar.time);
    } else {
      console.warn('No valid timestamp found in bar:', bar);
      return null;
    }

    // Extract price data with multiple fallbacks
    open = parseFloat(bar.open || bar.o || bar.Open || 0);
    high = parseFloat(bar.high || bar.h || bar.High || 0);
    low = parseFloat(bar.low || bar.l || bar.Low || 0);
    close = parseFloat(bar.close || bar.c || bar.Close || 0);
    volume = parseFloat(bar.volume || bar.v || bar.Volume || bar.volume || 0);
    
    // Extract additional data if available
    tradeCount = parseInt(bar.tradeCount || bar.n || bar.trade_count || bar.count || '0');
    vwap = parseFloat(bar.vwap || bar.vw || bar.VWAP || bar.vwap || 0);

    // Validate required fields
    if (!timestamp || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      console.warn('Invalid bar data:', bar);
      return null;
    }

    // Ensure prices are valid
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
      console.warn('Invalid price values in bar:', bar);
      return null;
    }

    // Ensure high is the highest and low is the lowest
    const validatedHigh = Math.max(open, high, low, close);
    const validatedLow = Math.min(open, high, low, close);

    // THE KEY FIX: Cast to UTCTimestamp using our helper
    return {
      time: toUTCTimestamp(timestamp), // Use the helper function
      open,
      high: validatedHigh,
      low: validatedLow,
      close,
      volume,
      tradeCount: tradeCount || undefined,
      vwap: vwap || undefined,
    };
  } catch (error) {
    console.error('Error normalizing bar:', error, bar);
    return null;
  }
}

export function normalizeBars(bars: any[]): CandleWithVolume[] {
  return bars
    .map(bar => normalizeBar(bar))
    .filter((bar): bar is CandleWithVolume => bar !== null);
}

export function validateBars(bars: CandleWithVolume[]): boolean {
  if (!Array.isArray(bars)) return false;
  
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (!bar || typeof bar.time !== 'number' || bar.time <= 0) {
      return false;
    }
    if (isNaN(bar.open) || isNaN(bar.high) || isNaN(bar.low) || isNaN(bar.close)) {
      return false;
    }
    if (bar.high < bar.low || bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
      return false;
    }
    
    // Check chronological order (skip first bar)
    if (i > 0 && bar.time <= bars[i - 1].time) {
      return false;
    }
  }
  
  return true;
}