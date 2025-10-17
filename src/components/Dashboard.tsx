import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
// import { AITradingAssistant } from './ai/AITradingAssistant';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const stats = [
    { label: 'Portfolio Value', value: '$125,430.50', change: '+2.5%', icon: DollarSign, trend: 'up' },
    { label: 'Daily P&L', value: '$1,234.20', change: '+1.2%', icon: TrendingUp, trend: 'up' },
    { label: 'Win Rate', value: '68%', change: '-0.5%', icon: Percent, trend: 'down' },
    { label: 'Drawdown', value: '3.2%', change: '+0.2%', icon: TrendingDown, trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const trendColor = stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500';
          
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-transform duration-200 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                    <Icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${trendColor}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Portfolios */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Active Portfolios
            </h3>
            <div className="space-y-4">
              {[
                { name: 'High Risk', account: 'Paper Trading', positions: 3, value: '$50,000', change: '+3.2%' },
                { name: 'Medium Risk', account: 'Interactive Brokers', positions: 5, value: '$75,000', change: '+1.8%' },
                { name: 'Low Risk', account: 'Paper Trading', positions: 2, value: '$25,000', change: '+0.5%' }
              ].map((portfolio) => (
                <div
                  key={portfolio.name}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{portfolio.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {portfolio.account}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {portfolio.positions} positions
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {portfolio.value}
                    </p>
                    <p className="text-sm text-emerald-500">
                      {portfolio.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Trading Assistant */}
        <div className="lg:col-span-1">
          {/* <AITradingAssistant /> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;