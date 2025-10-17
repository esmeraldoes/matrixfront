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