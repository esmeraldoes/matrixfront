export type BrokerConfig = {
  apiKey: string;
  secretKey: string;
};

export type TradeUpdate = {
  symbol: string;
  price: number;
  size: number;
  timestamp: Date;
};

export type QuoteUpdate = {
  symbol: string;
  bidPrice: number;
  askPrice: number;
  bidSize: number;
  askSize: number;
  timestamp: Date;
};

export interface BrokerApi {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAccountBalance(): Promise<number>;
  placeMarketOrder(
    symbol: string,
    quantity: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<string>;
  closePosition(positionId: string): Promise<boolean>;
}

export interface AlpacaApi extends BrokerApi {
  subscribeToTrades(symbol: string, callback: (trade: TradeUpdate) => void): Promise<void>;
  subscribeToQuotes(symbol: string, callback: (quote: QuoteUpdate) => void): Promise<void>;
}

export type BrokerType = 'PAPER' | 'ALPACA' | 'INTERACTIVE';