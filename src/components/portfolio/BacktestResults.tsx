// components/portfolio/BacktestResults.tsx
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Activity, Download } from 'lucide-react';
import { usePortfolioBacktest, useBacktestResults, useBacktestChartData } from '@/hooks/usePortfolios';
import BacktestPerformanceChart from './BacktestPerformanceChart';

// Helper function to safely convert to number
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper to format percentage
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
};

interface Metrics {
  avgDailyReturn: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  bestDay: number;
  worstDay: number;
  volatility: number;
}

interface ProcessedChartData {
  date: string;
  timestamp: Date;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export const BacktestResults: React.FC = () => {
  const { backtestId } = useParams<{ backtestId: string }>();
  const navigate = useNavigate();
  const id = parseInt(backtestId || '0');

  const { data: backtest, isLoading: backtestLoading } = usePortfolioBacktest(id);
  const { data: results, isLoading: resultsLoading } = useBacktestResults(id);
  const { data: chartData, isLoading: chartLoading } = useBacktestChartData(id);

  // Process chart data for visualization
  const processedChartData = useMemo((): ProcessedChartData[] => {
    if (!chartData?.daily_results) return [];

    return chartData.daily_results.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString(),
      timestamp: new Date(day.date),
      portfolioValue: safeNumber(day.portfolio_value),
      dailyReturn: safeNumber(day.daily_return) * 100, // Convert to percentage
      cumulativeReturn: safeNumber(day.cumulative_return) * 100, // Convert to percentage
      drawdown: safeNumber(day.drawdown) * 100, // Convert to percentage
    }));
  }, [chartData]);

  // Calculate additional metrics with proper typing
  const metrics = useMemo((): Metrics | null => {
    if (!processedChartData.length) return null;

    const returns: number[] = processedChartData.map((d: ProcessedChartData) => d.dailyReturn);
    const positiveReturns: number[] = returns.filter((r: number) => r > 0);
    const negativeReturns: number[] = returns.filter((r: number) => r < 0);
    
    // Calculate averages with proper typing
    const totalReturn: number = returns.reduce((a: number, b: number) => a + b, 0);
    const avgDailyReturn: number = totalReturn / returns.length;
    
    const avgWin: number = positiveReturns.length > 0 
      ? positiveReturns.reduce((a: number, b: number) => a + b, 0) / positiveReturns.length 
      : 0;
    
    const avgLoss: number = negativeReturns.length > 0 
      ? negativeReturns.reduce((a: number, b: number) => a + b, 0) / negativeReturns.length 
      : 0;
    
    // Calculate volatility
    const meanReturn: number = totalReturn / returns.length;
    const variance: number = returns.reduce((a: number, b: number) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
    const volatility: number = Math.sqrt(variance);
    
    return {
      avgDailyReturn,
      winRate: (positiveReturns.length / returns.length) * 100,
      avgWin,
      avgLoss,
      bestDay: Math.max(...returns),
      worstDay: Math.min(...returns),
      volatility,
    };
  }, [processedChartData]);

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
          onClick={() => navigate('/portfolio')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Return to Portfolios
        </button>
      </div>
    );
  }

  // Safely convert all metrics to numbers
  const totalReturn: number = safeNumber(backtest.total_return);
  const annualizedReturn: number = safeNumber(backtest.annualized_return);
  const sharpeRatio: number = safeNumber(backtest.sharpe_ratio);
  const maxDrawdown: number = safeNumber(backtest.max_drawdown);
  const finalPortfolioValue: number = safeNumber(backtest.final_portfolio_value);
  const volatility: number = safeNumber(backtest.volatility);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/portfolio')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {backtest.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Portfolio: {backtest.portfolio_name} • {new Date(backtest.start_date).toLocaleDateString()} - {new Date(backtest.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
         
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            backtest.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
            backtest.status === 'running' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
            backtest.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {backtest.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {backtest.status === 'completed' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                  <p className={`text-2xl font-bold ${
                    totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(totalReturn)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Final: {formatCurrency(finalPortfolioValue)}
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
                    {formatPercentage(annualizedReturn)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Volatility: {(volatility * 100).toFixed(2)}%
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
                    {sharpeRatio.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Risk-Adjusted
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
                    -{(maxDrawdown * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Worst Period
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {metrics.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Daily Return</p>
                <p className={`text-lg font-bold ${metrics.avgDailyReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metrics.avgDailyReturn.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Win</p>
                <p className="text-lg font-bold text-emerald-500">
                  {metrics.avgWin.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Loss</p>
                <p className="text-lg font-bold text-red-500">
                  {metrics.avgLoss.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Best Day</p>
                <p className="text-lg font-bold text-emerald-500">
                  {metrics.bestDay.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Worst Day</p>
                <p className="text-lg font-bold text-red-500">
                  {metrics.worstDay.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Main Performance Chart */}
          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <BacktestPerformanceChart 
              data={processedChartData}
              height={500}
              onChartTypeChange={(type) => console.log('Chart type:', type)}
            />
          </div> */}
          
        </>
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
              {formatCurrency(backtest.initial_capital)}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Drawdown
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.daily_results?.slice(0, 10).map((result: any) => {
                  const dailyReturn: number = safeNumber(result.daily_return);
                  const cumulativeReturn: number = safeNumber(result.cumulative_return);
                  const portfolioValue: number = safeNumber(result.portfolio_value);
                  const drawdown: number = safeNumber(result.drawdown);
                  
                  return (
                    <tr key={result.date}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(result.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(portfolioValue)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${
                        dailyReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {formatPercentage(dailyReturn)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${
                        cumulativeReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {formatPercentage(cumulativeReturn)}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-500">
                        -{(drawdown * 100).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};











