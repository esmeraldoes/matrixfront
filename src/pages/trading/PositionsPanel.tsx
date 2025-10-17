// src/pages/trading/PositionsPanel.tsx
import React from "react";
import type{ Position } from "@/store/types/trading";
import { useClosePosition } from "@/hooks/useTrading";
import { X, Percent, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface PositionsPanelProps {
  positions: Position[];
  accountId: string;
}

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  positions,
  accountId,
}) => {
  const closePositionMutation = useClosePosition(accountId);

  const handleClosePosition = (symbol: string) => {
    closePositionMutation.mutate({ symbol, data: {} });
  };

  const handleClosePartialPosition = (symbol: string, percentage: number) => {
    closePositionMutation.mutate({ symbol, data: { percentage } });
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400";
  };

  const getPnlBgColor = (pnl: number) => {
    return pnl >= 0 
      ? "bg-green-50 dark:bg-green-900/20" 
      : "bg-red-50 dark:bg-red-900/20";
  };

  // Calculate totals
  const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0);
  const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.market_value), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Positions
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
            <div className={`text-sm font-semibold ${getPnlColor(totalPnl)}`}>
              {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
            </div>
          </div>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg text-xs">
            {positions.length} open
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-3">
            <DollarSign size={40} className="mx-auto opacity-50" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            No open positions
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Your positions will appear here when you start trading
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((position) => {
            const pnl = parseFloat(position.unrealized_pl);
            const pnlPercent = parseFloat(position.unrealized_plpc);
            const isPositive = pnl >= 0;

            return (
              <div
                key={position.symbol}
                className={`p-3 border border-gray-200/60 dark:border-gray-600/60 rounded-lg transition-all hover:shadow-sm ${getPnlBgColor(pnl)}`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {position.symbol}
                    </span>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        position.side === "long"
                          ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400"
                      }`}
                    >
                      {position.side.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp size={14} className="text-green-500" />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${getPnlColor(pnl)}`}>
                      {pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Qty</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {parseFloat(position.qty).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Avg Price</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      ${parseFloat(position.avg_entry_price).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Current</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      ${parseFloat(position.current_price).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* P&L and Actions Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">P&L</div>
                    <div className={`text-sm font-semibold ${getPnlColor(pnl)}`}>
                      ${Math.abs(pnl).toFixed(2)}
                      <span className="text-xs font-normal ml-1">
                        {pnl >= 0 ? "up" : "down"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleClosePartialPosition(position.symbol, 50)}
                      disabled={closePositionMutation.isPending}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      title="Close 50%"
                    >
                      <Percent size={12} />
                      50%
                    </button>
                    <button
                      onClick={() => handleClosePosition(position.symbol)}
                      disabled={closePositionMutation.isPending}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      title="Close position"
                    >
                      <X size={12} />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary Footer */}
          <div className="pt-3 border-t border-gray-200/60 dark:border-gray-600/60">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Value</div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  ${totalValue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total P&L</div>
                <div className={`font-semibold ${getPnlColor(totalPnl)}`}>
                  {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

