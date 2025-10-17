// components/portfolio/PortfolioManager.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortfolioSelection } from '@/components/portfolio/PortfolioSelection';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { PortfolioPerformance } from '@/components/portfolio/PortfolioPerformance';
import { AssetAllocation } from '@/components/portfolio/AssetAllocation';
import { PortfolioDetails } from '@/components/portfolio/PortfolioDetails';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { InputModal } from '@/components/ui/InputModal';
import { useToast } from '@/hooks/use-toast';
import { 
  usePortfolios, 
  usePortfolioSubscriptions, 
  useSubscribeToPortfolio,
  useManagePortfolioSubscription,
  usePaperPortfolioSubscriptions,
  type Portfolio,
  type PortfolioSubscription,
  type PortfolioAsset,
  type PaperPortfolioSubscription,
} from '@/hooks/usePortfolios';
import { Bookmark, Play } from 'lucide-react';

// Helper function to convert subscription to portfolio
const subscriptionToPortfolio = (subscription: PortfolioSubscription): Portfolio => {
  const getRiskType = (riskLevel: number): 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' => {
    if (riskLevel <= 2) return 'LOW_RISK';
    if (riskLevel <= 4) return 'MEDIUM_RISK';
    return 'HIGH_RISK';
  };

  return {
    id: subscription.id,
    name: subscription.portfolio_name,
    description: `Subscription to ${subscription.portfolio_name}`,
    strategy_type: 'copied',
    risk_level: subscription.portfolio_risk_level,
    duration: 'medium',
    min_investment: subscription.allocation_amount,
    expected_return_min: 0,
    expected_return_max: 0,
    total_return: subscription.subscription_return,
    sharpe_ratio: 0,
    max_drawdown: 0,
    volatility: 0,
    win_rate: 0,
    annual_management_fee: 0,
    rebalance_frequency: 'monthly',
    is_active: subscription.status === 'active',
    is_public: false,
    is_accepting_subscribers: false,
    total_subscribers: 1,
    total_aum: subscription.current_value,
    created_by_name: 'Subscribed Portfolio',
    is_subscribed: true,
    assets: [],
    created_at: subscription.subscribed_at,
    updated_at: subscription.subscribed_at,
    
    type: getRiskType(subscription.portfolio_risk_level),
    account: {
      type: subscription.trading_account ? 'LIVE' : 'PAPER',
      name: subscription.account_nickname || 'Virtual Portfolio'
    },
    riskSettings: {
      maxPositionSize: subscription.allocation_amount * 0.1,
      maxDrawdown: 10,
      defaultStopLoss: 2,
      defaultTakeProfit: 6,
      maxDailyLoss: 5,
      maxOpenPositions: 5
    },
    positions: [],
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
  };
};

// Helper function to convert paper subscription to portfolio
const paperSubscriptionToPortfolio = (subscription: PaperPortfolioSubscription): Portfolio => {
  const getRiskType = (riskLevel: number): 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' => {
    if (riskLevel <= 2) return 'LOW_RISK';
    if (riskLevel <= 4) return 'MEDIUM_RISK';
    return 'HIGH_RISK';
  };

  return {
    id: subscription.id + 100000,
    name: `${subscription.portfolio_name} (Paper)`,
    description: `Paper trading copy of ${subscription.portfolio_name}`,
    strategy_type: subscription.strategy_type,
    risk_level: subscription.risk_level,
    duration: 'medium',
    min_investment: subscription.initial_investment,
    expected_return_min: 0,
    expected_return_max: 0,
    total_return: subscription.return_percentage,
    sharpe_ratio: 0,
    max_drawdown: 0,
    volatility: 0,
    win_rate: 0,
    annual_management_fee: 0,
    rebalance_frequency: 'monthly',
    is_active: subscription.status === 'active',
    is_public: false,
    is_accepting_subscribers: false,
    total_subscribers: 1,
    total_aum: subscription.current_value,
    created_by_name: 'Paper Trading',
    is_subscribed: true,
    assets: [],
    created_at: subscription.subscribed_at,
    updated_at: subscription.subscribed_at,
    
    type: getRiskType(subscription.risk_level),
    account: {
      type: 'PAPER',
      name: 'Paper Trading Account'
    },
    riskSettings: {
      maxPositionSize: subscription.initial_investment * 0.1,
      maxDrawdown: 10,
      defaultStopLoss: 2,
      defaultTakeProfit: 6,
      maxDailyLoss: 5,
      maxOpenPositions: 5
    },
    positions: [],
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
  };
};

// Helper function to enhance portfolio data
const enhancePortfolio = (portfolio: Portfolio): Portfolio => {
  const getRiskType = (riskLevel: number): 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' => {
    if (riskLevel <= 2) return 'LOW_RISK';
    if (riskLevel <= 4) return 'MEDIUM_RISK';
    return 'HIGH_RISK';
  };

  const safeNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || fallback;
    return fallback;
  };

  const calculateAllocation = (assets: PortfolioAsset[]) => {
    return assets.reduce((acc: { forex: number; crypto: number; stocks: number; commodities: number }, asset: PortfolioAsset) => {
      const classKey = asset.asset_class.toLowerCase();
      const allocation = safeNumber(asset.allocation, 0);
      
      if (classKey.includes('stock') || classKey.includes('equity')) {
        acc.stocks = (acc.stocks || 0) + allocation;
      } else if (classKey.includes('crypto')) {
        acc.crypto = (acc.crypto || 0) + allocation;
      } else if (classKey.includes('forex') || classKey.includes('fx')) {
        acc.forex = (acc.forex || 0) + allocation;
      } else if (classKey.includes('commodity')) {
        acc.commodities = (acc.commodities || 0) + allocation;
      }
      return acc;
    }, { forex: 0, crypto: 0, stocks: 0, commodities: 0 });
  };

  const totalReturn = safeNumber(portfolio.total_return, 0);
  const winRate = safeNumber(portfolio.win_rate, 0);
  const maxDrawdown = safeNumber(portfolio.max_drawdown, 0);

  return {
    ...portfolio,
    total_return: totalReturn,
    win_rate: winRate,
    max_drawdown: maxDrawdown,
    type: getRiskType(portfolio.risk_level),
    account: {
      type: 'PAPER' as const,
      name: `${portfolio.strategy_type} Portfolio`
    },
    performance: {
      dailyPnL: totalReturn / 365,
      totalPnL: totalReturn,
      winRate: winRate,
      drawdown: maxDrawdown
    },
    positions: [],
    allocation: calculateAllocation(portfolio.assets)
  };
};

const PortfolioManager: React.FC = () => {
  const [showPortfolioSelection, setShowPortfolioSelection] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [detailedPortfolio, setDetailedPortfolio] = useState<Portfolio | null>(null);
  
  // Modal states
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [portfolioToCopy, setPortfolioToCopy] = useState<Portfolio | null>(null);
  const [allocationAmount, setAllocationAmount] = useState(0);
  
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [subscriptionToPause, setSubscriptionToPause] = useState<number | null>(null);
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [subscriptionToResume, setSubscriptionToResume] = useState<number | null>(null);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<number | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: portfoliosData } = usePortfolios();
  const { data: subscriptions, refetch: refetchSubscriptions } = usePortfolioSubscriptions();
  const { data: paperSubscriptions } = usePaperPortfolioSubscriptions();
  const subscribeMutation = useSubscribeToPortfolio();
  const manageSubscriptionMutation = useManagePortfolioSubscription();

  const displayPortfolios = (portfoliosData?.results || []).map(enhancePortfolio);
  const subscriptionPortfolios = (subscriptions || []).map(subscriptionToPortfolio);
  const paperPortfolios = (paperSubscriptions || []).map(paperSubscriptionToPortfolio);



   const shouldShowSeeMoreSubscriptions = subscriptionPortfolios.length > 15;
  const displayedSubscriptionPortfolios = shouldShowSeeMoreSubscriptions 
    ? subscriptionPortfolios.slice(0, 15) 
    : subscriptionPortfolios;


  // Handle portfolio subscription
  const handleCreatePortfolio = (template: Portfolio, riskPerTrade: number) => {
    subscribeMutation.mutate({
      portfolio_id: template.id,
      allocation_amount: template.min_investment,
      leverage_multiplier: 1.0,
    }, {
      onSuccess: () => {
        setShowPortfolioSelection(false);
        refetchSubscriptions();
        toast({
          title: "Subscription Successful",
          description: `Successfully subscribed to ${template.name}`,
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error('Failed to subscribe to portfolio:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Subscription failed';
        toast({
          title: "Subscription Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  // Handle copy portfolio with allocation modal
  const handleCopyPortfolio = (portfolio: Portfolio) => {
    setPortfolioToCopy(portfolio);
    setAllocationAmount(portfolio.min_investment || 1000);
    setShowAllocationModal(true);
  };

  const confirmCopyPortfolio = (amount: number) => {
    if (!portfolioToCopy) return;

    subscribeMutation.mutate({
      portfolio_id: portfolioToCopy.id,
      allocation_amount: amount,
      leverage_multiplier: 1.0,
    }, {
      onSuccess: () => {
        refetchSubscriptions();
        setShowAllocationModal(false);
        setPortfolioToCopy(null);
        toast({
          title: "Portfolio Subscribed",
          description: `Successfully subscribed to ${portfolioToCopy.name} with $${amount}`,
          variant: "default",
        });
      },
      onError: (error: any) => {
        console.error('Failed to copy portfolio:', error);
        const errorMessage = error.response?.data?.error || 
                            error.message || 
                            'Failed to subscribe to portfolio. Please try again.';
        toast({
          title: "Subscription Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  // Handle pause subscription
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

  // Handle resume subscription
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

  // Handle cancel subscription
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

  const handleSelectPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolio(portfolio);
  };

  const handleOpenPortfolioDetails = (portfolio: Portfolio) => {
    setDetailedPortfolio(portfolio);
    setShowPortfolioDetails(true);
  };

  const handleClosePortfolioDetails = () => {
    setShowPortfolioDetails(false);
    setDetailedPortfolio(null);
  };

  return (
    <div className="space-y-6">
      {/* Allocation Modal */}
      <InputModal
        isOpen={showAllocationModal}
        onClose={() => {
          setShowAllocationModal(false);
          setPortfolioToCopy(null);
        }}
        onConfirm={confirmCopyPortfolio}
        title={`Subscribe to ${portfolioToCopy?.name || 'Portfolio'}`}
        message={`Enter the amount you want to allocate to this portfolio. Minimum investment is $${portfolioToCopy?.min_investment || 1000}.`}
        inputLabel="Allocation Amount"
        type="number"
        min={portfolioToCopy?.min_investment || 1000}
        defaultValue={portfolioToCopy?.min_investment || 1000}
        isLoading={subscribeMutation.isPending}
      />

      {/* Pause Confirmation Modal */}
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

      {/* Resume Confirmation Modal */}
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

      {/* Cancel Confirmation Modal */}
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

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Manager
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your investment portfolios and track performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/portfolios/backtests')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Play className="w-4 h-4" />
            View Backtests
          </button>


           <button
                onClick={() => navigate('/portfolio/subscriptions')}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-white text-sm sm:text-base rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <Bookmark className="w-4 h-4" />
                        My Subscriptions ({subscriptionPortfolios.length + paperPortfolios.length})

                    </button>
          
        </div>
      </div>

      {/* Portfolio Selection or Portfolio Grid */}
      {showPortfolioSelection ? (
        <PortfolioSelection onSelect={handleCreatePortfolio} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio List */}
            <div className="lg:col-span-3 space-y-6">



              {/* Paper Portfolios Section */}
              {paperPortfolios.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Play className="w-5 h-5 mr-2 text-blue-500" />
                    Paper Trading Portfolios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {paperPortfolios.map((portfolio: Portfolio) => (
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

              {/* Regular Portfolios */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Investment Portfolios
                </h3>

                  {shouldShowSeeMoreSubscriptions && (
                      <button
                        onClick={() => navigate('/portfolios/subscriptions')}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
                        See All Portfolios →
                      </button>
                    )}


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayPortfolios.map((portfolio: Portfolio) => (
                    <PortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                      onSelect={handleOpenPortfolioDetails}
                      onCopy={handleCopyPortfolio}
                    />
                  ))}
                  
                
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                  {selectedPortfolio && (
                    <>
                      <PortfolioPerformance portfolio={selectedPortfolio} />
                      <AssetAllocation
                        allocation={
                          selectedPortfolio.allocation || {
                            forex: 0,
                            crypto: 0,
                            stocks: 0,
                            commodities: 0,
                          }
                        }
                      />
                    </>
                  )}
            </div>
          </div>
        </>
      )}
      
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

export default PortfolioManager;


