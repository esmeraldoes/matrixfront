// // components/portfolio/PortfolioDetails.tsx
// import React, { useState } from 'react';
// import { X, TrendingUp, TrendingDown, PieChart, DollarSign, Clock, AlertTriangle, Play, Copy } from 'lucide-react';
// import { type Portfolio } from '@/hooks/usePortfolios';
// import { useBacktestPortfolio } from '@/hooks/usePortfolios';
// import { useToast } from '@/hooks/use-toast';
// import { Modal } from '@/components/ui/Modal';

// interface PortfolioDetailsProps {
//   portfolio: Portfolio;
//   isOpen: boolean;
//   onClose: () => void;
//   onCopy: (portfolio: Portfolio) => void;
// }

// export const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({
//   portfolio,
//   isOpen,
//   onClose,
//   onCopy
// }) => {
//   const [showBacktestModal, setShowBacktestModal] = useState(false);
//   const [backtestParams, setBacktestParams] = useState({
//     initial_capital: portfolio.min_investment || 1000,
//     start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//     end_date: new Date().toISOString().split('T')[0],
//     rebalance_frequency: portfolio.rebalance_frequency || 'monthly'
//   });

//   const backtestMutation = useBacktestPortfolio();
//   const { toast } = useToast();

//   const handleBacktest = () => {
//     backtestMutation.mutate({
//       portfolio_id: portfolio.id,
//       name: `Backtest: ${portfolio.name}`,
//       initial_capital: backtestParams.initial_capital,
//       start_date: backtestParams.start_date,
//       end_date: backtestParams.end_date,
//       rebalance_frequency: backtestParams.rebalance_frequency
//     }, {
//       onSuccess: (data) => {
//         setShowBacktestModal(false);
//         toast({
//           title: "Backtest Started",
//           description: `Backtest for ${portfolio.name} has been queued. ID: ${data.id}`,
//           variant: "default",
//         });
//       },
//       onError: (error: any) => {
//         const errorMessage = error.response?.data?.error || error.message || 'Backtest failed';
//         toast({
//           title: "Backtest Failed",
//           description: errorMessage,
//           variant: "destructive",
//         });
//       }
//     });
//   };

//   if (!isOpen) return null;

//   // Safe number conversion with fallbacks
//   const safeNumber = (value: any, fallback: number = 0): number => {
//     if (typeof value === 'number') return value;
//     if (typeof value === 'string') {
//       const parsed = parseFloat(value);
//       return isNaN(parsed) ? fallback : parsed;
//     }
//     return fallback;
//   };

//   const safeToFixed = (value: any, decimals: number = 2, fallback: string = '0.00'): string => {
//     const num = safeNumber(value, 0);
//     return num.toFixed(decimals);
//   };

//   // Safe performance data with defaults
//   const performance = portfolio.performance || {
//     dailyPnL: 0,
//     totalPnL: portfolio.total_return || 0,
//     winRate: portfolio.win_rate || 0,
//     drawdown: portfolio.max_drawdown || 0
//   };
//   console.log("Portfolio: ", portfolio)

//   const totalPnL = safeNumber(performance.totalPnL, portfolio.total_return || 0);
//   const dailyPnL = safeNumber(performance.dailyPnL, 0);
//   const winRate = safeNumber(performance.winRate, portfolio.win_rate || 0);
//   const drawdown = safeNumber(performance.drawdown, portfolio.max_drawdown || 0);
//   const sharpeRatio = safeNumber(portfolio.sharpe_ratio, 0);
//   const volatility = safeNumber(portfolio.volatility, 0);
//   const expectedReturnMin = safeNumber(portfolio.expected_return_min, 0);
//   const expectedReturnMax = safeNumber(portfolio.expected_return_max, 0);
//   const annualManagementFee = safeNumber(portfolio.annual_management_fee, 0);

//   const getRiskLevelColor = (level: number) => {
//     switch (level) {
//       case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
//       case 2: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
//       case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
//       case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
//       case 5: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
//       default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
//     }
//   };

//   const getRiskLevelText = (level: number) => {
//     switch (level) {
//       case 1: return 'Very Conservative';
//       case 2: return 'Conservative';
//       case 3: return 'Moderate';
//       case 4: return 'Aggressive';
//       case 5: return 'Very Aggressive';
//       default: return 'Unknown';
//     }
//   };

//   return (
//     <>
//       {/* Backtest Modal */}
//       <Modal 
//         isOpen={showBacktestModal} 
//         onClose={() => setShowBacktestModal(false)}
//         title={`Backtest Portfolio: ${portfolio.name}`}
//         size="md"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Initial Capital
//             </label>
//             <input
//               type="number"
//               min="100"
//               value={backtestParams.initial_capital}
//               onChange={(e) => setBacktestParams(prev => ({
//                 ...prev,
//                 initial_capital: Number(e.target.value)
//               }))}
//               className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Start Date
//               </label>
//               <input
//                 type="date"
//                 value={backtestParams.start_date}
//                 onChange={(e) => setBacktestParams(prev => ({
//                   ...prev,
//                   start_date: e.target.value
//                 }))}
//                 className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 End Date
//               </label>
//               <input
//                 type="date"
//                 value={backtestParams.end_date}
//                 onChange={(e) => setBacktestParams(prev => ({
//                   ...prev,
//                   end_date: e.target.value
//                 }))}
//                 className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Rebalance Frequency
//             </label>
//             <select
//               value={backtestParams.rebalance_frequency}
//               onChange={(e) => setBacktestParams(prev => ({
//                 ...prev,
//                 rebalance_frequency: e.target.value
//               }))}
//               className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="daily">Daily</option>
//               <option value="weekly">Weekly</option>
//               <option value="monthly">Monthly</option>
//               <option value="quarterly">Quarterly</option>
//             </select>
//           </div>

//           <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
//             <div className="flex items-start">
//               <AlertTriangle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
//               <div className="flex-1">
//                 <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
//                   Backtest Information
//                 </h4>
//                 <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
//                   This backtest will simulate portfolio performance using historical market data.
//                   Results are for informational purposes only and past performance doesn't guarantee future results.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end space-x-4 pt-4">
//             <button
//               onClick={() => setShowBacktestModal(false)}
//               className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleBacktest}
//               disabled={backtestMutation.isPending}
//               className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
//             >
//               {backtestMutation.isPending ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                   Running...
//                 </>
//               ) : (
//                 <>
//                   <Play className="w-4 h-4" />
//                   Start Backtest
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* Portfolio Details Modal */}
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//           {/* Header */}
//           <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex-1">
//               <div className="flex items-center justify-between mb-2">
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {portfolio.name}
//                 </h2>
//                 <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskLevelColor(portfolio.risk_level)}`}>
//                   {getRiskLevelText(portfolio.risk_level)}
//                 </span>
//               </div>
//               <p className="text-gray-600 dark:text-gray-400 mb-4">
//                 {portfolio.description}
//               </p>
//               <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
//                 <div className="flex items-center">
//                   <Clock className="w-4 h-4 mr-2" />
//                   {portfolio.duration}
//                 </div>
//                 <div className="flex items-center">
//                   <DollarSign className="w-4 h-4 mr-2" />
//                   Min: ${portfolio.min_investment?.toLocaleString() || '0'}
//                 </div>
//                 <div className="flex items-center">
//                   <TrendingUp className="w-4 h-4 mr-2" />
//                   Expected: {safeToFixed(expectedReturnMin, 1)}% - {safeToFixed(expectedReturnMax, 1)}%
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Content */}
//           <div className="p-6">
//             {/* Performance Metrics */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//               <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Total Return</span>
//                   <div className="flex items-center">
//                     {totalPnL >= 0 ? (
//                       <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
//                     ) : (
//                       <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
//                     )}
//                     <span className={`text-sm font-medium ${
//                       totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
//                     }`}>
//                       {totalPnL >= 0 ? '+' : ''}{safeToFixed(totalPnL, 2)}%
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Daily P&L</span>
//                   <span className={`text-sm font-medium ${
//                     dailyPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
//                   }`}>
//                     {dailyPnL >= 0 ? '+' : ''}{safeToFixed(dailyPnL, 2)}%
//                   </span>
//                 </div>
//               </div>

//               <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {safeToFixed(winRate, 1)}%
//                   </span>
//                 </div>
//               </div>

//               <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</span>
//                   <span className="text-sm font-medium text-red-500">
//                     -{safeToFixed(Math.abs(drawdown), 1)}%
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Asset Allocation */}
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
//                 <PieChart className="w-5 h-5 mr-2" />
//                 Asset Allocation
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {portfolio.assets && portfolio.assets.map((asset) => (
//                   <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
//                     <div className="flex items-center">
//                       <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
//                       <div>
//                         <span className="font-medium text-gray-900 dark:text-white">{asset.symbol}</span>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <span className="font-medium text-gray-900 dark:text-white">
//                         {safeToFixed(asset.allocation, 1)}%
//                       </span>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
//                         {asset.asset_class || 'Unknown'}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               {(!portfolio.assets || portfolio.assets.length === 0) && (
//                 <p className="text-center text-gray-500 dark:text-gray-400 py-4">
//                   No asset allocation data available
//                 </p>
//               )}
//             </div>

//             {/* Strategy Details */}
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                 Strategy Details
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="font-medium text-gray-900 dark:text-white mb-2">Portfolio Information</h4>
//                   <dl className="space-y-2">
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Strategy Type</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white capitalize">
//                         {portfolio.strategy_type || 'Not specified'}
//                       </dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Rebalance Frequency</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white capitalize">
//                         {portfolio.rebalance_frequency || 'Not specified'}
//                       </dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Management Fee</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white">
//                         {safeToFixed(annualManagementFee, 2)}%
//                       </dd>
//                     </div>
//                   </dl>
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-gray-900 dark:text-white mb-2">Performance Metrics</h4>
//                   <dl className="space-y-2">
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white">
//                         {safeToFixed(sharpeRatio, 2)}
//                       </dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Volatility</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white">
//                         {safeToFixed(volatility, 2)}%
//                       </dd>
//                     </div>
//                     <div className="flex justify-between">
//                       <dt className="text-sm text-gray-500 dark:text-gray-400">Total Subscribers</dt>
//                       <dd className="text-sm text-gray-900 dark:text-white">
//                         {portfolio.total_subscribers || 0}
//                       </dd>
//                     </div>
//                   </dl>
//                 </div>
//               </div>
//             </div>

//             {/* Risk Disclaimer */}
//             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
//               <div className="flex items-start">
//                 <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
//                     Investment Risk Disclaimer
//                   </h4>
//                   <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
//                     Past performance does not guarantee future results. All investments involve risk, including the possible loss of principal. 
//                     The portfolio's strategy and asset allocation may not be suitable for all investors. Please consult with a financial advisor 
//                     before making any investment decisions.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer Actions */}
//           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
//             {/* Backtest button */}
//             <button
//               onClick={() => setShowBacktestModal(true)}
//               className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium w-full sm:w-auto"
//             >
//               <Play className="w-4 h-4" />
//               BackTest Portfolio
//             </button>

//             {/* Action buttons */}
//             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
//               <button
//                 onClick={onClose}
//                 className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
//               >
//                 Close
//               </button>
//               <button
//                 onClick={() => {
//                   onCopy(portfolio);
//                   onClose();
//                 }}
//                 className="w-full sm:w-auto px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
//               >
//                 <Copy className="w-4 h-4" />
//                 Subscribe to Portfolio
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };







// components/portfolio/PortfolioDetails.tsx
// import React from 'react';
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, PieChart, DollarSign, Clock, AlertTriangle, Play } from 'lucide-react';
import { type Portfolio } from '@/hooks/usePortfolios';
import { useBacktestPortfolio } from '@/hooks/usePortfolios';
import { useToast } from '../ui/use-toast';
// import { useToast } from '@/hooks/use-toast';




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
    const { toast } = useToast();
  
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
             toast({
          title: "Backtest Started",
          description: `Backtest for ${portfolio.name} has been queued. ID: ${data.id}`,
          variant: "default",
        });
          // You could navigate to backtest results page here
          // alert(`Backtest started! ID: ${data.id}`);
        },
        onError: (error: any) => {
          // alert(`Backtest failed: ${error.response?.data?.error || error.message}`);
          const errorMessage = error.response?.data?.error || error.message || 'Backtest failed';
        toast({
          title: "Backtest Failed",
          description: errorMessage,
          variant: "destructive",
        });
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