// components/portfolio/PortfolioPerformance.tsx
import React from 'react';
import { type Portfolio } from '@/hooks/usePortfolios';

interface PortfolioPerformanceProps {
  portfolio: Portfolio;
}

export const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ 
  portfolio 
}) => {
  // Safe performance data with defaults
  const performance = portfolio.performance || {
    dailyPnL: 0,
    totalPnL: portfolio.total_return || 0,
    winRate: portfolio.win_rate || 0,
    drawdown: portfolio.max_drawdown || 0
  };

  // Safe number conversion with fallbacks
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || fallback;
    return fallback;
  };

  const totalPnL = safeNumber(performance.totalPnL, portfolio.total_return || 0);
  const dailyPnL = safeNumber(performance.dailyPnL, 0);
  const winRate = safeNumber(performance.winRate, portfolio.win_rate || 0);
  const drawdown = safeNumber(performance.drawdown, portfolio.max_drawdown || 0);
  const sharpeRatio = safeNumber(portfolio.sharpe_ratio, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance Overview
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Return</span>
          <span className={`text-sm font-medium ${
            totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Daily P&L</span>
          <span className={`text-sm font-medium ${
            dailyPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {dailyPnL >= 0 ? '+' : ''}{dailyPnL.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {winRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</span>
          <span className="text-sm font-medium text-red-500">
            -{Math.abs(drawdown).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {sharpeRatio.toFixed(2)}
          </span>
        </div>

        {/* Additional portfolio metrics */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Min Investment</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${portfolio.min_investment?.toLocaleString() || '0'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Expected Return</span>
            <span className="text-sm font-medium text-emerald-500">
              {portfolio.expected_return_min?.toFixed(1) || '0'}% - {portfolio.expected_return_max?.toFixed(1) || '0'}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};