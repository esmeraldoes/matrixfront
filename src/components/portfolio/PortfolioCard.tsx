// components/portfolio/PortfolioCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Copy, ExternalLink, Pause, Play, X } from 'lucide-react';
import { type Portfolio } from '@/hooks/usePortfolios';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onSelect: (portfolio: Portfolio) => void;
  onCopy: (portfolio: Portfolio) => void;
  onPause?: (subscriptionId: number) => void;
  onResume?: (subscriptionId: number) => void;
  onCancel?: (subscriptionId: number) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onSelect,
  onCopy,
  onPause,
  onResume,
  onCancel
}) => {
  const isSubscription = portfolio.subscriptionData;
  const subscriptionId = isSubscription ? portfolio.id as number : null;

  // Compute risk type from risk_level
  const getRiskType = (riskLevel: number): 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' => {
    if (riskLevel <= 2) return 'LOW_RISK';
    if (riskLevel <= 4) return 'MEDIUM_RISK';
    return 'HIGH_RISK';
  };

  const riskType = portfolio.type || getRiskType(portfolio.risk_level);

  // Compute performance data with safe defaults
  const performance = portfolio.performance || {
    dailyPnL: portfolio.total_return / 365, // Approximate daily from annual
    totalPnL: portfolio.total_return,
    winRate: portfolio.win_rate,
    drawdown: portfolio.max_drawdown
  };

  // Compute account info with safe defaults
  const account = portfolio.account || {
    type: 'PAPER' as const,
    name: 'Demo Portfolio'
  };

  // Safe status check
  const status = portfolio.status || 'active';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${
      status === 'paused' ? 'opacity-60' : ''
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {portfolio.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {account.name}
            {isSubscription && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {status.toUpperCase()}
              </span>
            )}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          riskType === 'HIGH_RISK'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            : riskType === 'MEDIUM_RISK'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        }`}>
          {riskType.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Daily P&L</span>
            <div className="flex items-center">
              {performance.dailyPnL >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                performance.dailyPnL >= 0
                  ? 'text-emerald-500'
                  : 'text-red-500'
              }`}>
                {performance.dailyPnL >= 0 ? '+' : ''}
                {performance.dailyPnL.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {performance.winRate}%
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Min: ${portfolio.min_investment}
          </span>
          <div className="flex items-center space-x-2">
            {isSubscription && subscriptionId && (
              <>
                {status === 'active' && onPause && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPause(subscriptionId);
                    }}
                    className="p-2 text-yellow-500 hover:text-yellow-600"
                    title="Pause subscription"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {status === 'paused' && onResume && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResume(subscriptionId);
                    }}
                    className="p-2 text-green-500 hover:text-green-600"
                    title="Resume subscription"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(subscriptionId!);
                    }}
                    className="p-2 text-red-500 hover:text-red-600"
                    title="Cancel subscription"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            
            {!isSubscription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(portfolio);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Copy portfolio"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(portfolio);
              }}
              className="p-2 text-emerald-500 hover:text-emerald-600"
              title="View details"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


