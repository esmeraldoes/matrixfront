// // components/AccountSummary.tsx
import React from 'react';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';
import { useTradingStore } from '@/store/tradingStore';

export const AccountSummary: React.FC = () => {
  const account = useTradingStore(state => state.account);
  
  console.log("THE ACCOUNT: ", account);


  if (!account) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        Loading account data...
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">
        Account Summary
      </h3>

      <div className="space-y-3">
        {/* Cash */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <DollarSign size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Cash</span>
          </div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            ${Number(account.cash).toFixed(2)}
          </span>
        </div>

        {/* Equity */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <PieChart size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Equity</span>
          </div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            ${Number(account.equity).toFixed(2)}
          </span>
        </div>

        {/* Day Profit/Loss */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <TrendingUp size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Day P/L</span>
          </div>
          <span
            className={`text-sm font-medium ${
              Number(account.day_profit_loss) >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {Number(account.day_profit_loss) >= 0 ? '+' : ''}
            {Number(account.day_profit_loss).toFixed(2)}
          </span>
        </div>

        {/* Buying Power */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Buying Power</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            ${Number(account.buying_power).toFixed(2)}
          </span>
        </div>

        {/* Portfolio Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            ${Number(account.portfolio_value).toFixed(2)}
          </span>
        </div>

        {/* Positions & Orders Count */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Positions</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {account.positions_count}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {account.orders_count}
          </span>
        </div>
      </div>
    </div>
  );
};



// import React from 'react';
// import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
// import { useTradingStore } from '@/store/tradingStore';

// export const AccountSummary: React.FC = () => {
//     const accountSnapshot = useTradingStore(state => state.account);

// //   const accountSnapshot = useTradingStore(state => state.accountSnapshot);
  
//   if (!accountSnapshot) {
//     return (
//       <div className="text-center py-4 text-gray-500 dark:text-gray-400">
//         Loading account data...
//       </div>
//     );
//   }
  
//   return (
//     <div>
//       <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4">Account Summary</h3>
      
//       <div className="space-y-3">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <DollarSign size={16} className="text-gray-500 mr-2" />
//             <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
//           </div>
//           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//             ${accountSnapshot.balance.toFixed(2)}
//           </span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <PieChart size={16} className="text-gray-500 mr-2" />
//             <span className="text-sm text-gray-600 dark:text-gray-400">Equity</span>
//           </div>
//           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//             ${accountSnapshot.equity.toFixed(2)}
//           </span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <TrendingUp size={16} className="text-gray-500 mr-2" />
//             <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
//           </div>
//           <span className={`text-sm font-medium ${
//             accountSnapshot.unrealizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
//           }`}>
//             {accountSnapshot.unrealizedPL >= 0 ? '+' : ''}{accountSnapshot.unrealizedPL.toFixed(2)}
//           </span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <TrendingDown size={16} className="text-gray-500 mr-2" />
//             <span className="text-sm text-gray-600 dark:text-gray-400">Margin</span>
//           </div>
//           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//             ${accountSnapshot.margin.toFixed(2)}
//           </span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600 dark:text-gray-400">Free Margin</span>
//           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//             ${accountSnapshot.freeMargin.toFixed(2)}
//           </span>
//         </div>
        
//         <div className="flex justify-between items-center">
//           <span className="text-sm text-gray-600 dark:text-gray-400">Margin Level</span>
//           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//             {accountSnapshot.marginLevel.toFixed(2)}%
//           </span>
//         </div>
        
//         <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
//           <div className="flex justify-between items-center">
//             <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Net Value</span>
//             <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
//               ${accountSnapshot.equity.toFixed(2)}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };