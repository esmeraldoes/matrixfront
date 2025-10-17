// src/components/trading/MarketClock.tsx
import React, { useState } from 'react';
import { useMarketClock } from '@/hooks/useMarketInfo';
import { Clock, AlertCircle } from 'lucide-react';

interface MarketClockProps {
  accountId: string;
  compact?: boolean;
}

export const MarketClock: React.FC<MarketClockProps> = ({ accountId, compact = false }) => {
  const { data: clock, isLoading, error } = useMarketClock(accountId);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div className={`flex items-center ${compact ? 'px-1 py-0.5' : 'px-2 py-1'} text-gray-600 dark:text-gray-400`}>
        <Clock size={compact ? 12 : 14} className="animate-pulse" />
        {!compact && <span className="ml-1 text-sm">Loading...</span>}
      </div>
    );
  }

  if (error || !clock) {
    return (
      <div className={`flex items-center ${compact ? 'px-1 py-0.5' : 'px-2 py-1'} text-red-600 dark:text-red-400`}>
        <AlertCircle size={compact ? 12 : 14} />
        {!compact && <span className="ml-1 text-sm">Error</span>}
      </div>
    );
  }

  const isOpen = clock.is_open;
  const now = new Date();
  const nextEvent = isOpen ? new Date(clock.next_close) : new Date(clock.next_open);
  const timeDiff = nextEvent.getTime() - now.getTime();

  const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  // Compact version - just the status indicator
  if (compact) {
    return (
      <div
        className="relative inline-flex items-center gap-1"
        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltipPos(null)}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-xs font-medium">
          {isOpen ? 'Open' : 'Closed'}
        </span>

        {tooltipPos && (
          <div
            className={`fixed px-2 py-1 text-xs font-medium rounded shadow-lg transition-opacity duration-200 pointer-events-none z-50
              ${isOpen
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            style={{
              top: tooltipPos.y + 10,
              left: tooltipPos.x + 10,
            }}
          >
            {isOpen
              ? `Closes in ${hoursRemaining}h ${minutesRemaining}m`
              : `Opens in ${hoursRemaining}h ${minutesRemaining}m`}
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div
      className="relative inline-flex items-center gap-2"
      onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setTooltipPos(null)}
    >
      <div
        className={`w-3 h-3 rounded-full ${
          isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Market {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isOpen 
            ? `Closes in ${hoursRemaining}h ${minutesRemaining}m` 
            : `Opens in ${hoursRemaining}h ${minutesRemaining}m`
          }
        </span>
      </div>

      {tooltipPos && (
        <div
          className={`fixed px-3 py-2 text-sm font-medium rounded shadow-lg transition-opacity duration-200 pointer-events-none z-50
            ${isOpen
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          style={{
            top: tooltipPos.y + 12,
            left: tooltipPos.x + 12,
          }}
        >
          <div className="font-semibold">Market {isOpen ? 'Open' : 'Closed'}</div>
          <div className="text-xs mt-1">
            {isOpen 
              ? `Closes at ${new Date(clock.next_close).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `Opens at ${new Date(clock.next_open).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            }
          </div>
        </div>
      )}
    </div>
  );
};


