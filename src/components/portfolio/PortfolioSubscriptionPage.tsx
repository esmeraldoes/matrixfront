// components/portfolio/SubscriptionsPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Play, TrendingUp, Search, Filter } from 'lucide-react';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { PortfolioDetails } from '@/components/portfolio/PortfolioDetails';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/hooks/use-toast';
import { 
  usePortfolioSubscriptions,
  useManagePortfolioSubscription,
  usePaperPortfolioSubscriptions,
  type Portfolio,
} from '@/hooks/usePortfolios';
import type { PortfolioSubscription } from '@/store/types/portfolio';

export const PortfolioSubscriptionPage: React.FC = () => {
//   const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [detailedPortfolio, setDetailedPortfolio] = useState<Portfolio | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'live' | 'paper'>('all');
  
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [subscriptionToPause, setSubscriptionToPause] = useState<number | null>(null);
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [subscriptionToResume, setSubscriptionToResume] = useState<number | null>(null);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<number | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: subscriptions, refetch: refetchSubscriptions } = usePortfolioSubscriptions();
  const { data: paperSubscriptions } = usePaperPortfolioSubscriptions();
  const manageSubscriptionMutation = useManagePortfolioSubscription();


  const subscriptionPortfolios = (subscriptions || []).map((subscription: PortfolioSubscription) => ({
    id: subscription.id,
    name: subscription.portfolio_name,
    description: `Subscription to ${subscription.portfolio_name}`,
    strategy_type: 'copied',
    risk_level: subscription.portfolio_risk_level,
    duration: 'medium',
    min_investment: subscription.allocation_amount,
    total_return: subscription.subscription_return,
    is_active: subscription.status === 'active',
    total_aum: subscription.current_value,
    is_subscribed: true,
    assets: [],
    type: subscription.portfolio_risk_level <= 2 ? 'LOW_RISK' : subscription.portfolio_risk_level <= 4 ? 'MEDIUM_RISK' : 'HIGH_RISK',
    account: {
      type: subscription.trading_account ? 'LIVE' : 'PAPER',
      name: subscription.account_nickname || 'Virtual Portfolio'
    },
    performance: {
      dailyPnL: subscription.subscription_return / 365,
      totalPnL: subscription.total_profit_loss,
      winRate: 0,
      drawdown: 0
    },
    allocation: subscription.portfolio_assets || {
      forex: 25,
      crypto: 25,
      stocks: 25,
      commodities: 25
    },
    status: subscription.status,
    subscriptionData: subscription
  }));

  const paperPortfolios = (paperSubscriptions || []).map((subscription) => ({
    id: subscription.id + 100000,
    name: `${subscription.portfolio_name} (Paper)`,
    description: `Paper trading copy of ${subscription.portfolio_name}`,
    strategy_type: subscription.strategy_type,
    risk_level: subscription.risk_level,
    duration: 'medium',
    min_investment: subscription.initial_investment,
    total_return: subscription.return_percentage,
    is_active: subscription.status === 'active',
    total_aum: subscription.current_value,
    is_subscribed: true,
    assets: [],
    type: subscription.risk_level <= 2 ? 'LOW_RISK' : subscription.risk_level <= 4 ? 'MEDIUM_RISK' : 'HIGH_RISK',
    account: {
      type: 'PAPER',
      name: 'Paper Trading Account'
    },
    performance: {
      dailyPnL: subscription.return_percentage / 365,
      totalPnL: subscription.profit_loss,
      winRate: 0,
      drawdown: 0
    },
    allocation: {
      forex: 25,
      crypto: 25,
      stocks: 25,
      commodities: 25
    },
    status: subscription.status as 'active' | 'paused' | 'cancelled' | 'completed',
    subscriptionData: subscription,
    isPaperTrading: true
  }));

  // Combine all subscriptions
  const allSubscriptions = [...subscriptionPortfolios, ...paperPortfolios];

  // Filter subscriptions
  const filteredSubscriptions = allSubscriptions.filter(portfolio => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portfolio.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || portfolio.status === statusFilter;
    
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'live' && portfolio.account.type === 'LIVE') ||
                       (typeFilter === 'paper' && portfolio.account.type === 'PAPER');
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Group subscriptions by type
  const liveSubscriptions = filteredSubscriptions.filter(p => p.account.type === 'LIVE');
  const paperSubscriptionsFiltered = filteredSubscriptions.filter(p => p.account.type === 'PAPER');

  const handlePauseSubscription = (subscriptionId: number) => {
    setSubscriptionToPause(subscriptionId);
    setShowPauseModal(true);
  };

  const confirmPauseSubscription = () => {
    if (!subscriptionToPause) return;

    manageSubscriptionMutation.mutate({
      subscriptionId: subscriptionToPause,
      action: 'pause'
    }, {
      onSuccess: () => {
        refetchSubscriptions();
        setShowPauseModal(false);
        setSubscriptionToPause(null);
        toast({
          title: "Subscription Paused",
          description: "Your portfolio subscription has been paused",
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error('Failed to pause subscription:', error);
        setShowPauseModal(false);
        setSubscriptionToPause(null);
        toast({
          title: "Pause Failed",
          description: "Failed to pause subscription. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleResumeSubscription = (subscriptionId: number) => {
    setSubscriptionToResume(subscriptionId);
    setShowResumeModal(true);
  };

  const confirmResumeSubscription = () => {
    if (!subscriptionToResume) return;

    manageSubscriptionMutation.mutate({
      subscriptionId: subscriptionToResume,
      action: 'resume'
    }, {
      onSuccess: () => {
        refetchSubscriptions();
        setShowResumeModal(false);
        setSubscriptionToResume(null);
        toast({
          title: "Subscription Resumed",
          description: "Your portfolio subscription has been resumed",
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error('Failed to resume subscription:', error);
        setShowResumeModal(false);
        setSubscriptionToResume(null);
        toast({
          title: "Resume Failed",
          description: "Failed to resume subscription. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancelSubscription = (subscriptionId: number) => {
    setSubscriptionToCancel(subscriptionId);
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = () => {
    if (!subscriptionToCancel) return;

    manageSubscriptionMutation.mutate({
      subscriptionId: subscriptionToCancel,
      action: 'cancel'
    }, {
      onSuccess: () => {
        refetchSubscriptions();
        setShowCancelModal(false);
        setSubscriptionToCancel(null);
        toast({
          title: "Subscription Cancelled",
          description: "Your portfolio subscription has been cancelled",
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error('Failed to cancel subscription:', error);
        setShowCancelModal(false);
        setSubscriptionToCancel(null);
        toast({
          title: "Cancellation Failed",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleOpenPortfolioDetails = (portfolio: Portfolio) => {
    setDetailedPortfolio(portfolio);
    setShowPortfolioDetails(true);
  };

  const handleClosePortfolioDetails = () => {
    setShowPortfolioDetails(false);
    setDetailedPortfolio(null);
  };

  const handleCopyPortfolio = (portfolio: Portfolio) => {
    navigate('/portfolio');
    toast({
      title: "Browse Portfolios",
      description: "You can subscribe to new portfolios from the main portfolio page",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={showPauseModal}
        onClose={() => {
          setShowPauseModal(false);
          setSubscriptionToPause(null);
        }}
        onConfirm={confirmPauseSubscription}
        title="Pause Subscription"
        message="Are you sure you want to pause this subscription? The portfolio will stop executing new trades but your current positions will remain."
        confirmText="Pause Subscription"
        variant="warning"
        isLoading={manageSubscriptionMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showResumeModal}
        onClose={() => {
          setShowResumeModal(false);
          setSubscriptionToResume(null);
        }}
        onConfirm={confirmResumeSubscription}
        title="Resume Subscription"
        message="Are you sure you want to resume this subscription? The portfolio will start executing trades again according to its strategy."
        confirmText="Resume Subscription"
        variant="info"
        isLoading={manageSubscriptionMutation.isPending}
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSubscriptionToCancel(null);
        }}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel this subscription? This action cannot be undone. All positions will be closed and the portfolio will stop trading."
        confirmText="Cancel Subscription"
        variant="danger"
        isLoading={manageSubscriptionMutation.isPending}
      />

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Bookmark className="w-6 h-6 mr-2 text-emerald-500" />
              My Portfolio Subscriptions
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your active portfolio subscriptions and track performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portfolio')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Browse Portfolios
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{allSubscriptions.length}</p>
            </div>
            <Bookmark className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-emerald-500">
                {allSubscriptions.filter(p => p.status === 'active').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Live Trading</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {subscriptionPortfolios.length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        
      </div>


      {/* Subscriptions List */}
      <div className="space-y-8">
        {/* Live Trading Subscriptions */}
        {liveSubscriptions.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
              Live Trading Subscriptions ({liveSubscriptions.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveSubscriptions.map((portfolio: Portfolio) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onSelect={handleOpenPortfolioDetails}
                  onCopy={handleCopyPortfolio}
                  onPause={handlePauseSubscription}
                  onResume={handleResumeSubscription}
                  onCancel={handleCancelSubscription}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paper Trading Subscriptions */}
        {paperSubscriptionsFiltered.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-500" />
              Paper Trading Subscriptions ({paperSubscriptionsFiltered.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paperSubscriptionsFiltered.map((portfolio: Portfolio) => (
                <div key={portfolio.id} className="border-2 border-blue-200 dark:border-blue-700 rounded-lg">
                  <PortfolioCard
                    portfolio={portfolio}
                    onSelect={handleOpenPortfolioDetails}
                    onCopy={handleCopyPortfolio}
                    onPause={handlePauseSubscription}
                    onResume={handleResumeSubscription}
                    onCancel={handleCancelSubscription}
                  />
                  <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Paper Trading
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        portfolio.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {portfolio.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Subscriptions Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : "You haven't subscribed to any portfolios yet."
              }
            </p>
            <button
              onClick={() => navigate('/portfolio')}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Browse Portfolios
            </button>
          </div>
        )}
      </div>

      {/* Portfolio Details Modal */}
      {detailedPortfolio && (
        <PortfolioDetails
          portfolio={detailedPortfolio}
          isOpen={showPortfolioDetails}
          onClose={handleClosePortfolioDetails}
          onCopy={handleCopyPortfolio}
        />
      )}
    </div>
  );
};