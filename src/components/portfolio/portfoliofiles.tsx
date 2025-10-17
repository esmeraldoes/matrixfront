// --- File: AssetAllocation.tsx ---
// components/portfolio/AssetAllocation.tsx
import React from 'react';
import { PieChart } from 'lucide-react';
import type { PortfolioAsset } from '@/hooks/usePortfolios';

interface AssetAllocationProps {
  assets?: PortfolioAsset[];
  allocation?: {
    forex: number;
    crypto: number;
    stocks: number;
    commodities: number;
  };
}

export const AssetAllocation: React.FC<AssetAllocationProps> = ({ assets, allocation }) => {
  const displayData = assets ? 
    assets.map(asset => ({
      name: asset.symbol,
      value: asset.allocation,
      color: getAssetColor(asset.asset_class)
    })) : 
    allocation ? [
      { name: 'Forex', value: allocation.forex, color: 'bg-blue-500' },
      { name: 'Crypto', value: allocation.crypto, color: 'bg-purple-500' },
      { name: 'Stocks', value: allocation.stocks, color: 'bg-emerald-500' },
      { name: 'Commodities', value: allocation.commodities, color: 'bg-yellow-500' }
    ] : [];

  function getAssetColor(assetClass: string): string {
    switch (assetClass.toLowerCase()) {
      case 'stock': return 'bg-emerald-500';
      case 'etf': return 'bg-blue-500';
      case 'crypto': return 'bg-purple-500';
      case 'bond': return 'bg-yellow-500';
      case 'cash': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  }

  if (!displayData.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Asset Allocation
        </h3>
      </div>

      <div className="space-y-4">
        {displayData.map((category) => (
          <div key={category.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {category.name}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {category.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${category.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${category.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- File: BacktestList.tsx ---
// components/portfolio/BacktestList.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolioBacktests } from '@/hooks/usePortfolios';

export const BacktestList: React.FC = () => {
  const { data: backtestsData, isLoading } = usePortfolioBacktests();
  const backtests = backtestsData?.results || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Portfolio Backtests
        </h1>
        <Link
          to="/portfolio"
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Back to Portfolios
        </Link>
      </div>

      {backtests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Backtests Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Run your first backtest from a portfolio details page to see how it would have performed historically.
          </p>
          <Link
            to="/portfolio"
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Browse Portfolios
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {backtests.map((backtest: any) => (
            <div
              key={backtest.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {backtest.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Portfolio: {backtest.portfolio_name}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  backtest.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  backtest.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  backtest.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {backtest.status.toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Initial Capital</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${backtest.initial_capital.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Period</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(backtest.start_date).toLocaleDateString()} - {new Date(backtest.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rebalance</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {backtest.rebalance_frequency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(backtest.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>



                {backtest.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                        <p
                            className={`text-lg font-bold ${
                            Number(backtest.total_return) >= 0 ? 'text-emerald-500' : 'text-red-500'
                            }`}
                        >
                            {Number(backtest.total_return) >= 0 ? '+' : ''}
                            {(Number(backtest.total_return) * 100).toFixed(2)}%
                        </p>
                        </div>

                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {!isNaN(Number(backtest.sharpe_ratio))
                            ? Number(backtest.sharpe_ratio).toFixed(2)
                            : 'N/A'}
                        </p>
                        </div>

                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</p>
                        <p className="text-lg font-bold text-red-500">
                            -{(Number(backtest.max_drawdown) * 100).toFixed(2)}%
                        </p>
                        </div>

                        <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Final Value</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            $
                            {Number(backtest.final_portfolio_value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                            })}
                        </p>
                        </div>
                    </div>
                    )}


{/* 
              {backtest.status === 'completed' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                    <p className={`text-lg font-bold ${
                      backtest.total_return >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {backtest.total_return >= 0 ? '+' : ''}{(backtest.total_return * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {backtest.sharpe_ratio?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</p>
                    <p className="text-lg font-bold text-red-500">
                      -{(backtest.max_drawdown * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Final Value</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${backtest.final_portfolio_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {backtest.execution_time || 'In progress...'}
                </div>
                <Link
                  to={`/portfolios/backtests/${backtest.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- File: BacktestResults.tsx ---
// components/portfolio/BacktestResults.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, DollarSign, Activity } from 'lucide-react';
import { usePortfolioBacktest, useBacktestResults, useBacktestChartData } from '@/hooks/usePortfolios';

export const BacktestResults: React.FC = () => {
  const { backtestId } = useParams<{ backtestId: string }>();
  const navigate = useNavigate();
  const id = parseInt(backtestId || '0');

  const { data: backtest, isLoading: backtestLoading } = usePortfolioBacktest(id);
  const { data: results, isLoading: resultsLoading } = useBacktestResults(id);
  const { data: chartData, isLoading: chartLoading } = useBacktestChartData(id);

  if (backtestLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!backtest) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Backtest Not Found
        </h2>
        <button
          onClick={() => navigate('/portfolios')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Return to Portfolios
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/portfolios')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {backtest.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Portfolio: {backtest.portfolio_name}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          backtest.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          backtest.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
          backtest.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
        }`}>
          {backtest.status.toUpperCase()}
        </div>
      </div>

      {/* Performance Metrics */}
      {backtest.status === 'completed' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                <p className={`text-2xl font-bold ${
                  backtest.total_return >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {backtest.total_return >= 0 ? '+' : ''}{(backtest.total_return * 100).toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Annualized Return</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(backtest.annualized_return * 100).toFixed(2)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {backtest.sharpe_ratio.toFixed(2)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-500">
                  -{(backtest.max_drawdown * 100).toFixed(2)}%
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Test Parameters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Parameters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Initial Capital</p>
            <p className="font-medium text-gray-900 dark:text-white">
              ${backtest.initial_capital.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(backtest.start_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {new Date(backtest.end_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rebalance</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {backtest.rebalance_frequency}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      {backtest.status === 'completed' && chartData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Chart
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Chart visualization would go here
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {backtest.status === 'completed' && results && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Results
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Portfolio Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Daily Return
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cumulative Return
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.daily_results?.slice(0, 10).map((result: any) => (
                  <tr key={result.date}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {new Date(result.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      ${result.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      result.daily_return >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {(result.daily_return * 100).toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      result.cumulative_return >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {(result.cumulative_return * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- File: PortfolioCard.tsx ---
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




// --- File: PortfolioDetails.tsx ---
// components/portfolio/PortfolioDetails.tsx
// import React from 'react';
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, PieChart, DollarSign, Clock, AlertTriangle, Play } from 'lucide-react';
import { type Portfolio } from '@/hooks/usePortfolios';
import { useBacktestPortfolio } from '@/hooks/usePortfolios';




interface PortfolioDetailsProps {
  portfolio: Portfolio;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (portfolio: Portfolio) => void;
}

export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({
  portfolio,
  isOpen,
  onClose,
  onCopy
}) => {


  
  
  
    
    const [showBacktestModal, setShowBacktestModal] = useState(false);
    const [backtestParams, setBacktestParams] = useState({
      initial_capital: portfolio.min_investment || 1000,
      start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      end_date: new Date().toISOString().split('T')[0], // today
      rebalance_frequency: portfolio.rebalance_frequency || 'monthly'
    });
  
    const backtestMutation = useBacktestPortfolio();
  
    const handleBacktest = () => {
      backtestMutation.mutate({
        portfolio_id: portfolio.id,
        name: `Backtest: ${portfolio.name}`,
        initial_capital: backtestParams.initial_capital,
        start_date: backtestParams.start_date,
        end_date: backtestParams.end_date,
        rebalance_frequency: backtestParams.rebalance_frequency
      }, {
        onSuccess: (data) => {
          setShowBacktestModal(false);
          // You could navigate to backtest results page here
          alert(`Backtest started! ID: ${data.id}`);
        },
        onError: (error: any) => {
          alert(`Backtest failed: ${error.response?.data?.error || error.message}`);
        }
      });
    };
  
  

  if (!isOpen) return null;

  // Safe number conversion with fallbacks
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const safeToFixed = (value: any, decimals: number = 2, fallback: string = '0.00'): string => {
    const num = safeNumber(value, 0);
    return num.toFixed(decimals);
  };

  // Safe performance data with defaults
  const performance = portfolio.performance || {
    dailyPnL: 0,
    totalPnL: portfolio.total_return || 0,
    winRate: portfolio.win_rate || 0,
    drawdown: portfolio.max_drawdown || 0
  };

  const totalPnL = safeNumber(performance.totalPnL, portfolio.total_return || 0);
  const dailyPnL = safeNumber(performance.dailyPnL, 0);
  const winRate = safeNumber(performance.winRate, portfolio.win_rate || 0);
  const drawdown = safeNumber(performance.drawdown, portfolio.max_drawdown || 0);
  const sharpeRatio = safeNumber(portfolio.sharpe_ratio, 0);
  const volatility = safeNumber(portfolio.volatility, 0);
  const expectedReturnMin = safeNumber(portfolio.expected_return_min, 0);
  const expectedReturnMax = safeNumber(portfolio.expected_return_max, 0);
  const annualManagementFee = safeNumber(portfolio.annual_management_fee, 0);

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 2: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Very Conservative';
      case 2: return 'Conservative';
      case 3: return 'Moderate';
      case 4: return 'Aggressive';
      case 5: return 'Very Aggressive';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolio.name}
              </h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskLevelColor(portfolio.risk_level)}`}>
                {getRiskLevelText(portfolio.risk_level)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {portfolio.description}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {portfolio.duration}
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Min: ${portfolio.min_investment?.toLocaleString() || '0'}
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Expected: {safeToFixed(expectedReturnMin, 1)}% - {safeToFixed(expectedReturnMax, 1)}%
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Return</span>
                <div className="flex items-center">
                  {totalPnL >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {totalPnL >= 0 ? '+' : ''}{safeToFixed(totalPnL, 2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Daily P&L</span>
                <span className={`text-sm font-medium ${
                  dailyPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {dailyPnL >= 0 ? '+' : ''}{safeToFixed(dailyPnL, 2)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {safeToFixed(winRate, 1)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</span>
                <span className="text-sm font-medium text-red-500">
                  -{safeToFixed(Math.abs(drawdown), 1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Asset Allocation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.assets && portfolio.assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{asset.symbol}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {safeToFixed(asset.allocation, 1)}%
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {asset.asset_class || 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(!portfolio.assets || portfolio.assets.length === 0) && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No asset allocation data available
              </p>
            )}
          </div>

          {/* Strategy Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Strategy Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Portfolio Information</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Strategy Type</dt>
                    <dd className="text-sm text-gray-900 dark:text-white capitalize">
                      {portfolio.strategy_type || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Rebalance Frequency</dt>
                    <dd className="text-sm text-gray-900 dark:text-white capitalize">
                      {portfolio.rebalance_frequency || 'Not specified'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Management Fee</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {safeToFixed(annualManagementFee, 2)}%
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Metrics</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {safeToFixed(sharpeRatio, 2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Volatility</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {safeToFixed(volatility, 2)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {portfolio.total_subscribers || 0}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Risk Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Investment Risk Disclaimer
                </h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  Past performance does not guarantee future results. All investments involve risk, including the possible loss of principal. 
                  The portfolio's strategy and asset allocation may not be suitable for all investors. Please consult with a financial advisor 
                  before making any investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}


        
                {/* Footer Actions - UPDATED */}
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
  {/* Backtest button */}
  <button
    onClick={() => setShowBacktestModal(true)}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto"
  >
    <Play className="w-4 h-4" />
    BackTest Portfolio
  </button>

  {/* Action buttons */}
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    <button
      onClick={onClose}
      className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
    >
      Close
    </button>
    <button
      onClick={() => {
        onCopy(portfolio);
        onClose();
      }}
      className="w-full sm:w-auto px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
    >
      Subscribe to Portfolio
    </button>
  </div>
</div>



              
               {/* Backtest Modal */}
                    {showBacktestModal && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            BackTest Portfolio: {portfolio.name}
                          </h3>
              
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Initial Capital
                              </label>
                              <input
                                type="number"
                                min="100"
                                value={backtestParams.initial_capital}
                                onChange={(e) => setBacktestParams(prev => ({
                                  ...prev,
                                  initial_capital: Number(e.target.value)
                                }))}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                              />
                            </div>
              
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={backtestParams.start_date}
                                onChange={(e) => setBacktestParams(prev => ({
                                  ...prev,
                                  start_date: e.target.value
                                }))}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                              />
                            </div>
              
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={backtestParams.end_date}
                                onChange={(e) => setBacktestParams(prev => ({
                                  ...prev,
                                  end_date: e.target.value
                                }))}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                              />
                            </div>
              
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Rebalance Frequency
                              </label>
                              <select
                                value={backtestParams.rebalance_frequency}
                                onChange={(e) => setBacktestParams(prev => ({
                                  ...prev,
                                  rebalance_frequency: e.target.value
                                }))}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                              </select>
                            </div>
              
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Backtest Information
                                  </h4>
                                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                                    This backtest will simulate portfolio performance using historical market data.
                                    Results are for informational purposes only and past performance doesn't guarantee future results.
                                  </p>
                                </div>
                              </div>
                            </div>
              
                            <div className="flex justify-end space-x-4 mt-6">
                              <button
                                onClick={() => setShowBacktestModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleBacktest}
                                disabled={backtestMutation.isPending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                              >
                                {backtestMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Running...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Start Backtest
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

        {/* <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onCopy(portfolio);
              onClose();
            }}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            Subscribe to Portfolio
          </button>
        </div> */}



      </div>
    </div>
  );
};

// --- File: PortfolioPerformance.tsx ---
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

// --- File: PortfolioSelection.tsx ---
// components/portfolio/PortfolioSelection.tsx
import React, { useState } from 'react';
import { Clock, DollarSign, AlertTriangle, PieChart } from 'lucide-react';
import { usePortfolios, type Portfolio, type PortfolioAsset } from '@/hooks/usePortfolios';

interface PortfolioSelectionProps {
  onSelect: (template: Portfolio, riskPerTrade: number) => void;
}

export const PortfolioSelection: React.FC<PortfolioSelectionProps> = ({ onSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Portfolio | null>(null);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [allocationAmount, setAllocationAmount] = useState(0);
  const [riskPerTrade, setRiskPerTrade] = useState(1);

  const { data: portfoliosData, isLoading } = usePortfolios();
  const portfolios = portfoliosData?.results || [];

  const getRiskLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 2: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRiskLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Very Conservative';
      case 2: return 'Conservative';
      case 3: return 'Moderate';
      case 4: return 'Aggressive';
      case 5: return 'Very Aggressive';
      default: return 'Unknown';
    }
  };

  const handleClonePortfolio = () => {
    if (!selectedTemplate) return;
    onSelect(selectedTemplate, riskPerTrade);
    setShowCloneModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 safe-padding">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Curated Investment Portfolios
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {portfolios.map((portfolio: Portfolio) => (
            <div
              key={portfolio.id}
              className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-within:ring-2 focus-within:ring-emerald-500"
              onClick={() => {
                setSelectedTemplate(portfolio);
                setShowDetails(showDetails === portfolio.id ? null : portfolio.id);
              }}
              role="button"
              tabIndex={0}
              onKeyPress={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedTemplate(portfolio);
                  setShowDetails(showDetails === portfolio.id ? null : portfolio.id);
                }
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {portfolio.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {portfolio.description}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs sm:text-sm font-medium rounded-full ${getRiskLevelColor(portfolio.risk_level)}`}>
                    {getRiskLevelText(portfolio.risk_level)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {portfolio.duration}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    ${portfolio.min_investment.toLocaleString()}
                  </div>
                </div>

                {showDetails === portfolio.id && (
                  <div className="mt-2 space-y-2 animate-fadeIn">
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Asset Allocation
                      </h4>
                      <div className="space-y-1">
                        {portfolio.assets.map((asset: PortfolioAsset) => (
                          <div key={asset.id} className="flex justify-between items-center text-xs sm:text-sm">
                            <div className="flex items-center">
                              <PieChart className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="text-gray-500 dark:text-gray-400">{asset.symbol}</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{asset.allocation}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Expected Return</span>
                        <span className="text-xs sm:text-sm font-medium text-emerald-500">
                          {portfolio.expected_return_min}% - {portfolio.expected_return_max}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setAllocationAmount(portfolio.min_investment);
                        setShowCloneModal(true);
                      }}
                      className="w-full min-h-[44px] py-1.5 px-3 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                      Subscribe to Portfolio
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCloneModal && selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 safe-padding"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 
              id="modal-title"
              className="text-lg font-bold text-gray-900 dark:text-white mb-4"
            >
              Subscribe to {selectedTemplate.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAccount(e.target.value)}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
                >
                  <option value="">Select an account</option>
                  <option value="paper">Paper Trading Account</option>
                  <option value="live">Live Trading Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Allocation Amount (Min: ${selectedTemplate.min_investment})
                </label>
                <input
                  type="number"
                  min={selectedTemplate.min_investment}
                  value={allocationAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAllocationAmount(Number(e.target.value))}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Risk Per Trade (1-5%)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={riskPerTrade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRiskPerTrade(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1%</span>
                  <span>{riskPerTrade}%</span>
                  <span>5%</span>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Risk Disclaimer
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                      Past performance does not guarantee future results. Investment involves risk of loss.
                      Please ensure this portfolio aligns with your investment goals and risk tolerance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClonePortfolio}
                  disabled={allocationAmount < selectedTemplate.min_investment}
                  className="min-h-[44px] px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Confirm Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

