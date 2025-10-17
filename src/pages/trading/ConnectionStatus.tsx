

// ConnectionStatus.tsx
import React from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { isTradingConnected, isMarketDataConnected } = useTradingStore();
  
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        {isTradingConnected ? (
          <Wifi size={16} className="text-green-500 mr-1" />
        ) : (
          <WifiOff size={16} className="text-red-500 mr-1" />
        )}
        <span className="text-sm">Trading: {isTradingConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="flex items-center">
        {isMarketDataConnected ? (
          <Wifi size={16} className="text-green-500 mr-1" />
        ) : (
          <WifiOff size={16} className="text-red-500 mr-1" />
        )}
        <span className="text-sm">Market Data: {isMarketDataConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
};

