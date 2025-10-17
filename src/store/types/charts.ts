// types/chart.ts
export type Timeframe = 
  | '1m' | '5m' | '15m' | '30m' 
  | '1h' | '4h' | '1d' | '1w' | '1M';

export type ChartType = 
  | 'candlestick' 
  | 'hollow_candlestick' 
  | 'heikin_ashi' 
  | 'bar' 
  | 'line' 
  | 'area';

export interface OHLCV {
  time: number; 
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HeikinAshi extends OHLCV {
  ha_open: number;
  ha_high: number;
  ha_low: number;
  ha_close: number;
}

export interface ChartConfig {
  type: ChartType;
  timeframe: Timeframe;
  theme: 'light' | 'dark';
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
}