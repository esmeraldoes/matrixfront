// src/pages/referral/PayoutHistoryCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export const PayoutHistoryCard = () => {
  const { payoutHistory } = useAppSelector((state) => state.payment);

  // ✅ FIX: Safe access to payoutHistory.results
  const payouts = payoutHistory?.results || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      case 'in_transit': return 'blue';
      default: return 'gray';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="rounded-lg bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-emerald-100">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Payout History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payouts.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No payout history yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Payouts will appear here after processing
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {payouts.slice(0, 10).map((payout) => (
              <div 
                key={payout.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      ${payout.amount} {payout.currency?.toUpperCase() || 'USD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {payout.created_at ? new Date(payout.created_at).toLocaleDateString() : 'Unknown date'}
                  </div>
                  {payout.purpose && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {payout.purpose}
                    </p>
                  )}
                </div>
                <Badge variant={getStatusColor(payout.status) as any} className="flex-shrink-0 ml-2">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {getStatusIcon(payout.status)}
                    {formatStatus(payout.status)}
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        {payouts.length > 10 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Showing 10 of {payoutHistory?.count || 0} payouts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};




// // src/pages/referral/PayoutHistoryCard.tsx

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { useAppSelector } from '@/store/hooks';
// import { Badge } from '@/components/ui/badge';
// import { DollarSign, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

// export const PayoutHistoryCard = () => {
//   const { payoutHistory } = useAppSelector((state) => state.payment);

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
//       case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
//       default: return <Clock className="w-4 h-4 text-yellow-500" />;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'paid': return 'green';
//       case 'failed': return 'red';
//       case 'pending': return 'yellow';
//       case 'in_transit': return 'blue';
//       default: return 'gray';
//     }
//   };

//   const formatStatus = (status: string) => {
//     return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
//   };

//   return (
//     <Card className="rounded-lg bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 dark:text-emerald-100">
//           <DollarSign className="h-5 w-5 text-emerald-500" />
//           Payout History
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {payoutHistory.results.length === 0 ? (
//           <div className="text-center py-6">
//             <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               No payout history yet
//             </p>
//             <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
//               Payouts will appear here after processing
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-3 max-h-80 overflow-y-auto">
//             {payoutHistory.results.slice(0, 10).map((payout) => (
//               <div 
//                 key={payout.id} 
//                 className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
//               >
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <span className="font-medium text-gray-900 dark:text-white truncate">
//                       ${payout.amount} {payout.currency.toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
//                     <Calendar className="w-3 h-3" />
//                     {new Date(payout.created_at).toLocaleDateString()}
//                   </div>
//                   {payout.purpose && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
//                       {payout.purpose}
//                     </p>
//                   )}
//                 </div>
//                 <Badge variant={getStatusColor(payout.status) as any} className="flex-shrink-0 ml-2">
//                   <div className="flex items-center gap-1 whitespace-nowrap">
//                     {getStatusIcon(payout.status)}
//                     {formatStatus(payout.status)}
//                   </div>
//                 </Badge>
//               </div>
//             ))}
//           </div>
//         )}
        
//         {payoutHistory.results.length > 10 && (
//           <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
//             <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
//               Showing 10 of {payoutHistory.count} payouts
//             </p>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };