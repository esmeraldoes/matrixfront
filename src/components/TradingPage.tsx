import React from 'react';
import { AITradingAssistant } from './ai/AITradingAssistant';
import { MarketIndices } from './trading/MarketIndices';
import { TradingPositions } from './trading/TradingPositions';

const TradingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Indices */}
        <MarketIndices />

        {/* AI Trading Assistant */}
        <AITradingAssistant />
      </div>

      {/* Trading Positions */}
      <TradingPositions />
    </div>
  );
};

export default TradingPage;