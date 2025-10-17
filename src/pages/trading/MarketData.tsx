import React from 'react';
import { useTradingStore } from '@/store/tradingStore';

const MarketData: React.FC = () => {
  const { quotes, selectedSymbol } = useTradingStore();
  
  if (!selectedSymbol) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Market Data</h3>
        <p className="text-gray-500">Select a symbol to view market data</p>
      </div>
    );
  }
  
  const quote = quotes[selectedSymbol];
  
  if (!quote) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Market Data</h3>
        <p className="text-gray-500">Loading data for {selectedSymbol}...</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Market Data - {selectedSymbol}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Bid</div>
          <div className="text-lg font-semibold">{quote.bid_price.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Size: {quote.bid_size}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Ask</div>
          <div className="text-lg font-semibold">{quote.ask_price.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Size: {quote.ask_size}</div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Last updated: {new Date(quote.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default MarketData;