// components/BrokerSelection.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrokerConnections } from '@/hooks/useBrokers';
import type { BrokerConnection } from '@/store/types/broker';
import { 
  Building2, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  WifiOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  PlayCircle,
  TestTube
} from 'lucide-react';

export const BrokerSelection: React.FC = () => {
  const navigate = useNavigate();
  const { data: connections, isLoading, error, refetch } = useBrokerConnections();

  const handleSelectBroker = (connection: BrokerConnection) => {
    if (connection.trading_account_id) {
      navigate(`/trading/${connection.trading_account_id}`);
    } else {
      console.error('No trading account found for this broker connection');
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      valid: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Connected'
      },
      pending: {
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Pending'
      },
      invalid: {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Disconnected'
      }
    };
    
    return configs[status as keyof typeof configs] || configs.invalid;
  };

  const getBrokerIcon = (brokerType: string) => {
    const icons = {
      alpaca: BarChart3,
      tradier: DollarSign,
      tradovate: TrendingUp,
      interactive_brokers: Building2,
      default: Building2
    };
    
    return icons[brokerType as keyof typeof icons] || icons.default;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-8">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-12"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => refetch()} 
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button 
                onClick={() => navigate('/brokers/new')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 hover:border-blue-400 text-gray-700 dark:text-gray-300 hover:text-blue-600 text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header with Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Broker Accounts
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your trading accounts and connections
            </p>
          </div>
          <button
            onClick={() => navigate('/brokers/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Add Broker Connection
          </button>
        </div>

        {/* Stats Bar - Compact */}
        {connections && connections.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {connections.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {connections.filter(c => c.status === 'valid').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {connections.filter(c => c.environment === 'paper').length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Paper</div>
            </div>
          </div>
        )}

        {/* Broker Connections Grid */}
        {connections && connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => {
              const statusConfig = getStatusConfig(connection.status);
              const StatusIcon = statusConfig.icon;
              const BrokerIcon = getBrokerIcon(connection.broker_type);
              
              return (
                <div
                  key={connection.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={() => handleSelectBroker(connection)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
                        <BrokerIcon className={statusConfig.color} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {connection.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                          {connection.broker_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" size={16} />
                  </div>

                  {/* Connection Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Environment</span>
                      <div className="flex items-center gap-1.5">
                        {connection.environment === 'paper' ? (
                          <TestTube size={14} className="text-blue-500" />
                        ) : (
                          <PlayCircle size={14} className="text-emerald-500" />
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          connection.environment === 'paper' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {connection.environment === 'paper' ? 'Paper' : 'Live'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={statusConfig.color} size={14} />
                        <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Last active</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {connection.updated_at 
                          ? new Date(connection.updated_at).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="text-gray-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Broker Connections
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Connect your first broker account to start trading.
              </p>
              <button
                onClick={() => navigate('/brokers/new')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mx-auto"
              >
                <Plus size={18} />
                Add Broker Connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

