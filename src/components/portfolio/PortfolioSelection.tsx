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