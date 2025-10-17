import React, { useState } from 'react';
import { Shield, Wallet, Bell, Briefcase, Plus } from 'lucide-react';
import {
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useBrokerConnections, useCreateAndValidateBrokerConnection, useUpdateBrokerConnection, useDeleteBrokerConnection, useSetDefaultBroker, useValidateBroker } from '@/hooks/useBrokers';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/uiSlice';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { BrokerConnection } from '@/store/types/broker';

interface BrokerAccount {
  id: string;
  name: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  paperTradingBalance?: number;
}

const BROKER_TYPES = [
  { value: 'alpaca', label: 'Alpaca' },
  { value: 'alpaca_crypto', label: 'Alpaca Crypto' },
  { value: 'ibkr', label: 'Interactive Brokers' },
  { value: 'tradier', label: 'Tradier' },
  { value: 'tdameritrade', label: 'TD Ameritrade' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'binance', label: 'Binance' },
];

const ENVIRONMENTS = [
  { value: 'paper', label: 'Paper Trading' },
  { value: 'live', label: 'Live Trading' },
];

const AUTH_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth', label: 'OAuth' },
];

// Custom type for test status
type TestStatus = {
  state: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: string;
  account_status?: string;
} | null;

const Settings: React.FC = () => {
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<BrokerConnection | null>(null);
  const [formData, setFormData] = useState<Partial<BrokerConnection>>({
    name: '',
    broker_type: 'alpaca',
    environment: 'paper',
    auth_type: 'api_key',
    is_default: false,
    is_active: true,
  });
  const [testStatus, setTestStatus] = useState<TestStatus>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<BrokerConnection | null>(null);

  const [notifications, setNotifications] = useState({
    tradeSignals: true,
    portfolioAlerts: true,
    riskWarnings: true,
    marketNews: false
  });

  const [defaultRiskSettings, setDefaultRiskSettings] = useState({
    maxPositionSize: 5000,
    maxDrawdown: 10,
    defaultStopLoss: 2,
    defaultTakeProfit: 3,
    maxDailyLoss: 5
  });

  // Broker connections from backend
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: connections, isLoading, error, refetch } = useBrokerConnections();
  const deleteMutation = useDeleteBrokerConnection();
  const setDefaultMutation = useSetDefaultBroker();
  const validateMutation = useValidateBroker();
  const updateMutation = useUpdateBrokerConnection();
  const createAndValidateMutation = useCreateAndValidateBrokerConnection();

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Clear test status on form change
    setTestStatus(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.broker_type) newErrors.broker_type = 'Broker type is required';
    if (!formData.environment) newErrors.environment = 'Environment is required';
    if (!formData.auth_type) newErrors.auth_type = 'Authentication type is required';

    if (formData.auth_type === 'api_key') {
      if (!formData.api_key) newErrors.api_key = 'API key is required';
      if (!formData.api_secret) newErrors.api_secret = 'API secret is required';
      
      // Validate Alpaca API key format
      if (formData.api_key && formData.broker_type?.includes('alpaca')) {
        if (!formData.api_key.startsWith('PK') && !formData.api_key.startsWith('AK')) {
          newErrors.api_key = 'Alpaca API key should start with PK (paper) or AK (live)';
        }
      }
    } else if (formData.auth_type === 'oauth') {
      if (!formData.oauth_access_token) newErrors.oauth_access_token = 'Access token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setTestStatus({ state: 'error', message: 'Please correct the form errors before saving.' });
      toast({
        title: "Validation Error",
        description: "Please correct the form errors before saving.",
        variant: "destructive",
      });
      return;
    }

    // For editing existing connections
    if (editingConnection) {
      setTestStatus({ state: 'testing', message: 'Updating connection...' });
      
      updateMutation.mutate({ id: editingConnection.id, data: formData }, {
        onSuccess: () => {
          dispatch(showToast({ 
            message: 'Connection updated successfully', 
            type: 'success' 
          }));
          toast({
            title: "Connection Updated",
            description: "Broker connection has been updated successfully",
            variant: "default",
          });
          setShowBrokerModal(false);
          setEditingConnection(null);
          setFormData({
            name: '',
            broker_type: 'alpaca',
            environment: 'paper',
            auth_type: 'api_key',
            is_default: false,
            is_active: true,
          });
          setTestStatus(null);
          refetch();
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Failed to update connection';
          setTestStatus({
            state: 'error',
            message: errorMessage,
          });
          
          if (error.response?.data) {
            setErrors(error.response.data);
          }
          
          toast({
            title: "Update Failed",
            description: errorMessage,
            variant: "destructive",
          });
        },
      });
    } else {
      // For new connections - use createAndValidate
      setTestStatus({ state: 'testing', message: 'Testing and saving connection...' });
      
      createAndValidateMutation.mutate(formData as any, {
        onSuccess: (result) => {
          if (result.success && result.created) {
            let successMessage = result.message || 'Connection created and validated successfully!';
            
            if (result.account_info) {
              successMessage += ` Account: ${result.account_info.account_number || 'Connected'}`;
            }
            
            setTestStatus({
              state: 'success',
              message: successMessage,
              account_status: result.account_info?.status,
            });
            
            dispatch(showToast({
              message: successMessage,
              type: 'success'
            }));
            
            toast({
              title: "Connection Created",
              description: successMessage,
              variant: "default",
            });
            
            // Small delay to show success message before closing
            setTimeout(() => {
              setShowBrokerModal(false);
              setEditingConnection(null);
              setFormData({
                name: '',
                broker_type: 'alpaca',
                environment: 'paper',
                auth_type: 'api_key',
                is_default: false,
                is_active: true,
              });
              setTestStatus(null);
              refetch();
            }, 1500);
          } else {
            setTestStatus({
              state: 'error',
              message: result.message || 'Failed to create connection',
            });
            
            toast({
              title: "Connection Failed",
              description: result.message || 'Failed to create connection',
              variant: "destructive",
            });
          }
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Failed to create connection';
          setTestStatus({
            state: 'error',
            message: errorMessage,
          });
          
          if (error.response?.data) {
            setErrors(error.response.data);
          }
          
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEdit = (connection: BrokerConnection) => {
    setEditingConnection(connection);
    setFormData(connection);
    setShowBrokerModal(true);
    setTestStatus(null);
  };

  const handleDeleteConnection = (connection: BrokerConnection) => {
    setConnectionToDelete(connection);
    setShowDeleteModal(true);
  };

  const confirmDeleteConnection = () => {
    if (!connectionToDelete) return;

    deleteMutation.mutate(connectionToDelete.id, {
      onSuccess: () => {
        dispatch(showToast({ message: 'Connection deleted successfully', type: 'success' }));
        toast({
          title: "Connection Deleted",
          description: "Broker connection has been deleted successfully",
          variant: "default",
        });
        setShowDeleteModal(false);
        setConnectionToDelete(null);
        refetch();
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Failed to delete connection';
        dispatch(showToast({ 
          message: errorMessage, 
          type: 'error' 
        }));
        toast({
          title: "Deletion Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setShowDeleteModal(false);
        setConnectionToDelete(null);
      },
    });
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => {
        dispatch(showToast({ message: 'Default connection set successfully', type: 'success' }));
        toast({
          title: "Default Connection Set",
          description: "Default broker connection has been updated successfully",
          variant: "default",
        });
        refetch();
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Failed to set default connection';
        dispatch(showToast({ 
          message: errorMessage, 
          type: 'error' 
        }));
        toast({
          title: "Default Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleValidate = (id: number) => {
    validateMutation.mutate(id, {
      onSuccess: (data) => {
        if (data.valid) {
          dispatch(showToast({ message: 'Connection validated successfully', type: 'success' }));
          toast({
            title: "Validation Successful",
            description: "Broker connection has been validated successfully",
            variant: "default",
          });
          refetch();
        } else {
          const errorMessage = data.message || 'Connection validation failed';
          dispatch(showToast({ 
            message: errorMessage, 
            type: 'error' 
          }));
          toast({
            title: "Validation Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        dispatch(showToast({ 
          message: errorMessage, 
          type: 'error' 
        }));
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const renderAuthFields = () => {
    if (formData.auth_type === 'api_key') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key *
            </label>
            <input
              type="password"
              value={formData.api_key || ''}
              onChange={(e) => handleChange('api_key', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
            {errors.api_key && <p className="mt-2 text-sm text-red-600">{errors.api_key}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Secret *
            </label>
            <input
              type="password"
              value={formData.api_secret || ''}
              onChange={(e) => handleChange('api_secret', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
            {errors.api_secret && <p className="mt-2 text-sm text-red-600">{errors.api_secret}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Token (Optional)
            </label>
            <input
              type="password"
              value={formData.api_token || ''}
              onChange={(e) => handleChange('api_token', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
          </div>
        </>
      );
    } else if (formData.auth_type === 'oauth') {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Token *
            </label>
            <input
              type="password"
              value={formData.oauth_access_token || ''}
              onChange={(e) => handleChange('oauth_access_token', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
            {errors.oauth_access_token && <p className="mt-2 text-sm text-red-600">{errors.oauth_access_token}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refresh Token (Optional)
            </label>
            <input
              type="password"
              value={formData.oauth_refresh_token || ''}
              onChange={(e) => handleChange('oauth_refresh_token', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Client ID (Optional)
            </label>
            <input
              type="text"
              value={formData.oauth_client_id || ''}
              onChange={(e) => handleChange('oauth_client_id', e.target.value)}
              className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
            />
          </div>
        </>
      );
    }
    return null;
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'valid') return 'CONNECTED';
    return status.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
      case 'invalid':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'rate_limited':
        return 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400';
    }
  };

  const isSaving = updateMutation.isPending || createAndValidateMutation.isPending;

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setConnectionToDelete(null);
        }}
        onConfirm={confirmDeleteConnection}
        title="Delete Broker Connection"
        message={`Are you sure you want to delete the connection "${connectionToDelete?.name}"? This action cannot be undone and all associated trading data will be lost.`}
        confirmText="Delete Connection"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Trading Accounts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-500" />
            Trading Accounts
          </h2>
          <button
            onClick={() => {
              setShowBrokerModal(true);
              setEditingConnection(null);
              setFormData({
                name: '',
                broker_type: 'alpaca',
                environment: 'paper',
                auth_type: 'api_key',
                is_default: false,
                is_active: true,
              });
              setTestStatus(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 w-full sm:w-auto bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Add Trading Account
          </button>
        </div>

        <div className="space-y-4">
          {/* Broker connections from backend */}
          {isLoading ? (
            <div className="flex justify-center p-4">
              <CircularProgress />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-md">
              Failed to load broker connections: {(error as Error).message}
            </div>
          ) : connections && connections.length > 0 ? (
            connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Wallet className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {connection.name}
                      {connection.is_default && (
                        <StarIcon className="ml-1 text-yellow-500" fontSize="small" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {connection.broker_type.toUpperCase()} • {connection.environment.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(connection.status)}`}>
                    {getStatusDisplay(connection.status)}
                  </span>
                  <span className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400">
                    {connection.auth_type.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleValidate(connection.id)}
                    disabled={validateMutation.isPending}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Validate Connection"
                  >
                    <RefreshIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handleEdit(connection)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Edit Connection"
                  >
                    <EditIcon fontSize="small" />
                  </button>
                  {!connection.is_default && (
                    <button
                      onClick={() => handleSetDefault(connection.id)}
                      disabled={setDefaultMutation.isPending}
                      className="p-1 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
                      title="Set as Default"
                    >
                      <StarIcon fontSize="small" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteConnection(connection)}
                    disabled={deleteMutation.isPending}
                    className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete Connection"
                  >
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6">
              <p className="text-gray-500 dark:text-gray-400">No broker connections found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Add your first broker connection to get started with trading
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Default Risk Management</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Position Size ($)
            </label>
            <input
              type="number"
              value={defaultRiskSettings.maxPositionSize}
              onChange={(e) => setDefaultRiskSettings(prev => ({
                ...prev,
                maxPositionSize: Number(e.target.value)
              }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Drawdown (%)
            </label>
            <input
              type="number"
              value={defaultRiskSettings.maxDrawdown}
              onChange={(e) => setDefaultRiskSettings(prev => ({
                ...prev,
                maxDrawdown: Number(e.target.value)
              }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Stop Loss (%)
            </label>
            <input
              type="number"
              value={defaultRiskSettings.defaultStopLoss}
              onChange={(e) => setDefaultRiskSettings(prev => ({
                ...prev,
                defaultStopLoss: Number(e.target.value)
              }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Take Profit (%)
            </label>
            <input
              type="number"
              value={defaultRiskSettings.defaultTakeProfit}
              onChange={(e) => setDefaultRiskSettings(prev => ({
                ...prev,
                defaultTakeProfit: Number(e.target.value)
              }))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Trade Signals</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications for new trade signals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.tradeSignals}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  tradeSignals: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Portfolio Alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get updates on portfolio performance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.portfolioAlerts}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  portfolioAlerts: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Risk Warnings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Alerts for risk management violations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.riskWarnings}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  riskWarnings: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Market News</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive relevant market news and updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketNews}
                onChange={(e) => setNotifications(prev => ({
                  ...prev,
                  marketNews: e.target.checked
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Broker Connection Modal - Simplified Single Step */}
      {showBrokerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {editingConnection ? 'Edit Broker Connection' : 'Add Broker Connection'}
              </h3>
              
              <div className="space-y-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Broker Type *
                    </label>
                    <select
                      value={formData.broker_type || ''}
                      onChange={(e) => handleChange('broker_type', e.target.value)}
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base h-12"
                    >
                      {BROKER_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.broker_type && <p className="mt-2 text-sm text-red-600">{errors.broker_type}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Environment *
                    </label>
                    <select
                      value={formData.environment || ''}
                      onChange={(e) => handleChange('environment', e.target.value)}
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base h-12"
                    >
                      {ENVIRONMENTS.map((env) => (
                        <option key={env.value} value={env.value}>
                          {env.label}
                        </option>
                      ))}
                    </select>
                    {errors.environment && <p className="mt-2 text-sm text-red-600">{errors.environment}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Authentication Type *
                  </label>
                  <select
                    value={formData.auth_type || ''}
                    onChange={(e) => handleChange('auth_type', e.target.value)}
                    className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base h-12"
                  >
                    {AUTH_TYPES.map((auth) => (
                      <option key={auth.value} value={auth.value}>
                        {auth.label}
                      </option>
                    ))}
                  </select>
                  {errors.auth_type && <p className="mt-2 text-sm text-red-600">{errors.auth_type}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {renderAuthFields()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.base_url || ''}
                      onChange={(e) => handleChange('base_url', e.target.value)}
                      placeholder="Will use default if empty"
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.account_id || ''}
                      onChange={(e) => handleChange('account_id', e.target.value)}
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.is_active ? 'active' : 'inactive'}
                      onChange={(e) => handleChange('is_active', e.target.value === 'active')}
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base h-12"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Connection
                    </label>
                    <select
                      value={formData.is_default ? 'yes' : 'no'}
                      onChange={(e) => handleChange('is_default', e.target.value === 'yes')}
                      className="block w-full px-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base h-12"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Test Status Display */}
              {testStatus && (
                <div className={`p-4 mb-4 rounded-md ${
                  testStatus.state === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                    : testStatus.state === 'error'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                }`}>
                  {testStatus.state === 'testing' && (
                    <div className="flex items-center">
                      <CircularProgress size={16} className="mr-2" />
                      {testStatus.message}
                    </div>
                  )}
                  {testStatus.state !== 'testing' && (
                    <div>
                      <div>{testStatus.message}</div>
                      {testStatus.account_status && (
                        <div className="mt-1 text-sm">Account Status: {testStatus.account_status}</div>
                      )}
                      {testStatus.details && (
                        <div className="mt-1 text-sm">Details: {testStatus.details}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setShowBrokerModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Connection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;


