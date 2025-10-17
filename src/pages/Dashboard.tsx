// src/pages/Dashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Building2,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { usePortfolioWebSocket } from '@/hooks/usePortfolioWebSocket';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { useNavigate } from 'react-router-dom';
import type{ BrokerConnection } from '@/store/types/broker';

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const { data: brokerConnections, isLoading: isLoadingBrokers } = useBrokerConnections();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [autoSelected, setAutoSelected] = useState(false);

  const getDefaultAccount = useCallback(() => {
    if (!brokerConnections || brokerConnections.length === 0) {
      return null;
    }

    console.log('🔍 Available broker connections:', brokerConnections);

    // Priority selection logic:
    // 1. First valid connection with trading_account_id
    // 2. First connection with trading_account_id
    // 3. First valid connection
    // 4. First connection

    const validConnections = brokerConnections.filter(conn => 
      conn.status === 'valid' && conn.trading_account_id
    );

    if (validConnections.length > 0) {
      console.log('✅ Found valid connections with trading accounts:', validConnections);
      return validConnections[0];
    }

    const connectionsWithAccount = brokerConnections.filter(conn => 
      conn.trading_account_id
    );

    if (connectionsWithAccount.length > 0) {
      console.log('📋 Found connections with trading accounts:', connectionsWithAccount);
      return connectionsWithAccount[0];
    }

    const firstValid = brokerConnections.find(conn => conn.status === 'valid');
    if (firstValid) {
      console.log('⚠️ Found valid connection but no trading account:', firstValid);
      return firstValid;
    }

    console.log('📦 Using first available connection:', brokerConnections[0]);
    return brokerConnections[0];
  }, [brokerConnections]);

  // Auto-select default account when broker connections load
  useEffect(() => {
    if (brokerConnections && brokerConnections.length > 0 && !autoSelected) {
      const defaultConnection = getDefaultAccount();
      
      if (defaultConnection && defaultConnection.trading_account_id) {
        const accountId = defaultConnection.trading_account_id.toString();
        console.log('🎯 Auto-selecting default account:', {
          connection: defaultConnection.name,
          accountId: accountId,
          status: defaultConnection.status
        });
        
        setSelectedAccountId(accountId);
        setAutoSelected(true);
      } else {
        console.log('❌ No trading account found in broker connections');
        setSelectedAccountId('');
      }
    }
  }, [brokerConnections, getDefaultAccount, autoSelected]);

  const { metrics, isConnected, isConnecting, error, refresh } = usePortfolioWebSocket(selectedAccountId);

  // Handle manual account selection
  const handleAccountSelect = (connection: BrokerConnection) => {
    if (connection.trading_account_id) {
      const accountId = connection.trading_account_id.toString();
      console.log('👤 User selected account:', {
        connection: connection.name,
        accountId: accountId
      });
      setSelectedAccountId(accountId);
      setAutoSelected(true);
    } else {
      console.error('No trading account ID found for connection:', connection);
    }
  };

  // Get current selected connection
  const selectedConnection = brokerConnections?.find(
    conn => conn.trading_account_id?.toString() === selectedAccountId
  );

  // Connection status component
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-4 flex-wrap gap-2">
      {/* Connection Indicator */}
      <div className={`flex items-center space-x-2 ${
        isConnected ? 'text-green-500' : isConnecting ? 'text-yellow-500' : 'text-red-500'
      }`}>
        {isConnected ? (
          <Wifi className="w-5 h-5" />
        ) : isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>
      
      {/* Account Selector */}
      {brokerConnections && brokerConnections.length > 0 && (
        <select
          value={selectedAccountId}
          onChange={(e) => {
            const connection = brokerConnections.find(
              conn => conn.trading_account_id?.toString() === e.target.value
            );
            if (connection) {
              handleAccountSelect(connection);
            }
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-[200px]"
        >
          <option value="">Select Account</option>
          {brokerConnections.map(connection => (
            <option 
              key={connection.id} 
              value={connection.trading_account_id?.toString() || ''}
              disabled={!connection.trading_account_id}
            >
              {connection.name} 
              {connection.broker_type && ` (${connection.broker_type})`}
              {connection.environment === 'paper' && ' 📊'}
              {connection.status !== 'valid' && ' ⚠️'}
              {!connection.trading_account_id && ' - No Trading Account'}
            </option>
          ))}
        </select>
      )}
      
      {/* Refresh Button */}
      {/* <button
        onClick={refresh}
        disabled={!selectedAccountId || (!isConnected && !isConnecting)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button> */}

      {/* Add Broker Button */}
      {(!brokerConnections || brokerConnections.length === 0) && (
        <button
          onClick={() => navigate('/brokers/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Broker</span>
        </button>
      )}
    </div>
  );

  // Error display component
  const ErrorAlert = () => {
    if (!error) return null;
    
    return (
      <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 dark:text-red-200 font-medium">Connection Issue</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          {selectedAccountId && !isConnecting && (
            <button
              onClick={refresh}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  };

  // No broker connections component
  const NoBrokersAvailable = () => (
    <div className="text-center py-12">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 max-w-md mx-auto">
        <Building2 className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          No Broker Connections
        </h3>
        <p className="text-yellow-600 dark:text-yellow-300 mb-4">
          You need to set up a broker connection to view portfolio data.
        </p>
        <button
          onClick={() => navigate('/brokers/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Up Broker Connection</span>
        </button>
      </div>
    </div>
  );

  // No account selected component
  const NoAccountSelected = () => (
    <div className="text-center py-12">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 max-w-md mx-auto">
        <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
          Select Trading Account
        </h3>
        <p className="text-blue-600 dark:text-blue-300 mb-4">
          Choose a broker connection to view portfolio metrics.
        </p>
        {brokerConnections && brokerConnections.length > 0 && (
          <select
            value={selectedAccountId}
            onChange={(e) => {
              const connection = brokerConnections.find(
                conn => conn.trading_account_id?.toString() === e.target.value
              );
              if (connection) handleAccountSelect(connection);
            }}
            className="px-3 py-2 border border-blue-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select an account...</option>
            {brokerConnections.map(connection => (
              <option 
                key={connection.id} 
                value={connection.trading_account_id?.toString() || ''}
              >
                {connection.name} ({connection.broker_type})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  // Loading state for brokers
  if (isLoadingBrokers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-32">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Stats data with real metrics or fallbacks
  const stats = [
    { 
      label: 'Portfolio Value', 
      value: metrics ? `$${metrics.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$---', 
      change: metrics ? `${metrics.daily_pnl_percent >= 0 ? '+' : ''}${metrics.daily_pnl_percent.toFixed(2)}%` : '--%', 
      icon: DollarSign, 
      trend: metrics ? (metrics.daily_pnl_percent >= 0 ? 'up' : 'down') : 'neutral',
      description: 'Total account value including cash and positions'
    },
    { 
      label: 'Daily P&L', 
      value: metrics ? `$${metrics.daily_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$---', 
      change: metrics ? `${metrics.daily_pnl_percent >= 0 ? '+' : ''}${metrics.daily_pnl_percent.toFixed(2)}%` : '--%', 
      icon: TrendingUp, 
      trend: metrics ? (metrics.daily_pnl >= 0 ? 'up' : 'down') : 'neutral',
      description: "Today's profit/loss"
    },
    { 
      label: 'Win Rate', 
      value: metrics ? `${metrics.win_rate.toFixed(1)}%` : '--%', 
      change: 'Overall',
      icon: Percent, 
      trend: metrics ? (metrics.win_rate >= 50 ? 'up' : 'down') : 'neutral',
      description: 'Percentage of profitable trades'
    },
    { 
      label: 'Drawdown', 
      value: metrics ? `${metrics.current_drawdown.toFixed(1)}%` : '--%', 
      change: `Max: ${metrics ? metrics.max_drawdown.toFixed(1) : '--'}%`, 
      icon: TrendingDown, 
      trend: metrics ? (metrics.current_drawdown <= 5 ? 'down' : 'up') : 'neutral',
      description: 'Current decline from peak value'
    },
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendBgColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'bg-emerald-100 dark:bg-emerald-900/20';
      case 'down': return 'bg-red-100 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTrendIconColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Loading state component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {isConnecting ? 'Connecting to live data...' : 'Loading portfolio data...'}
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
          {selectedConnection ? `Account: ${selectedConnection.name}` : 'Connecting...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header with Connection Status */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.username || 'Trader'}! {
              isConnected && selectedConnection
                ? `Live data for ${selectedConnection.name}`
                : isConnecting 
                ? 'Establishing connection...'
                : selectedConnection
                ? 'Connect to view live data.'
                : 'Select a broker connection.'
            }
          </p>
        </div>
        <ConnectionStatus />
      </div>

      {/* Error Display */}
      <ErrorAlert />

      {/* Show different states based on broker connections and selection */}
      {!brokerConnections || brokerConnections.length === 0 ? (
        <NoBrokersAvailable />
      ) : !selectedAccountId ? (
        <NoAccountSelected />
      ) : (
        <>
          {/* Selected Account Info */}
          {selectedConnection && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      {selectedConnection.name}
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedConnection.broker_type} • {selectedConnection.environment === 'paper' ? 'Paper Trading' : 'Live Trading'}
                      {selectedConnection.status !== 'valid' && ' • ⚠️ Needs Attention'}
                    </p>
                  </div>
                </div>
                <button
                  // onClick={() => navigate(`/portfolios/${selectedAccountId}`)}
                  onClick={() => navigate(`/portfolio/`)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <span>Go to Portfolio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Statistics Cards - Show only when we have data or loading */}
          {(metrics || isConnecting) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const trendColor = getTrendColor(stat.trend);
                const trendBgColor = getTrendBgColor(stat.trend);
                const trendIconColor = getTrendIconColor(stat.trend);

                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${trendBgColor}`}>
                          <Icon className={`w-6 h-6 ${trendIconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isConnecting && !metrics ? '...' : stat.value}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${trendColor}`}>
                        {isConnecting && !metrics ? '...' : stat.change}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading State */}
          {isConnecting && !metrics && <LoadingState />}

          {/* Additional Metrics - Only show when we have data */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Risk Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Volatility</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metrics.volatility.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metrics.sharpe_ratio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Active Positions</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {metrics.positions_count}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  P&L Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Unrealized P&L</span>
                    <span className={`font-medium ${
                      metrics.unrealized_pl >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      ${metrics.unrealized_pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Realized P&L</span>
                    <span className={`font-medium ${
                      metrics.realized_pl >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      ${metrics.realized_pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Available Cash</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${metrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Buying Power</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${metrics.buying_power.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {new Date(metrics.last_updated).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Connection</span>
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {isConnected ? 'Live' : 'Disconnected'}
                    </span>
                  </div>
                  
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;