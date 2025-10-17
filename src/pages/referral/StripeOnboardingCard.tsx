// src/pages/referral/StripeOnboardingCard.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  createConnectedAccount, 
  fetchAccountLink, 
  fetchConnectedAccountStatus 
} from '@/store/paymentThunks';

export const StripeOnboardingCard = () => {
  const dispatch = useAppDispatch();
  const { 
    connectedAccount, 
    connectedAccountStatus,
    accountLinkUrl,
    accountLinkStatus 
  } = useAppSelector((state) => state.payment);
  
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh account status on component mount
  useEffect(() => {
    const loadAccountStatus = async () => {
      try {
        await dispatch(fetchConnectedAccountStatus()).unwrap();
      } catch (err) {
        // 404 is expected if no account exists yet
        if (err !== 'Not Found') {
          setError('Failed to load account status');
        }
      }
    };

    loadAccountStatus();
  }, [dispatch]);

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    setError(null);
    try {
      await dispatch(createConnectedAccount()).unwrap();
      // Refresh account status after creation
      await dispatch(fetchConnectedAccountStatus()).unwrap();
    } catch (err: any) {
      setError(err || 'Failed to create Stripe account');
      console.error('Failed to create account:', err);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!connectedAccount) return;
    
    setError(null);
    try {
      const refreshUrl = `${window.location.origin}/referrals`;
      const returnUrl = `${window.location.origin}/referrals?onboarding=success`;
      
      await dispatch(fetchAccountLink({ refreshUrl, returnUrl })).unwrap();
      
      // Redirect to Stripe onboarding
      if (accountLinkUrl) {
        window.open(accountLinkUrl, '_blank');
      }
    } catch (err: any) {
      setError(err || 'Failed to start onboarding');
      console.error('Failed to get account link:', err);
    }
  };

  const getAccountStatus = () => {
    if (!connectedAccount) {
      return {
        status: 'not_created',
        message: 'No Stripe account created',
        color: 'gray' as const,
        icon: <XCircle className="w-4 h-4" />,
        description: 'Create a Stripe account to receive payouts'
      };
    }

    if (connectedAccount.payouts_enabled) {
      return {
        status: 'complete',
        message: 'Ready for payouts',
        color: 'green' as const,
        icon: <CheckCircle className="w-4 h-4" />,
        description: 'Your account is fully set up and ready for automatic payouts'
      };
    }

    if (connectedAccount.details_submitted) {
      return {
        status: 'under_review', 
        message: 'Under review by Stripe',
        color: 'yellow' as const,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        description: 'Your account is being reviewed. This usually takes 1-2 business days.'
      };
    }

    return {
      status: 'needs_onboarding',
      message: 'Needs verification',
      color: 'red' as const,
      icon: <AlertTriangle className="w-4 h-4" />,
      description: 'Complete identity verification with Stripe to receive payouts'
    };
  };

  const status = getAccountStatus();

  return (
    <Card className="rounded-lg bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-emerald-100">
          <CreditCard className="h-5 w-5 text-emerald-500" />
          Payout Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              Stripe Connected Account
            </p>
            <div className="flex items-center gap-2">
              {status.icon}
              <span className={`text-sm text-${status.color}-600 dark:text-${status.color}-400`}>
                {status.message}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {status.description}
            </p>
          </div>
          <Badge variant={status.color}>
            {status.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Action Buttons */}
        {status.status === 'not_created' && (
          <Button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount || connectedAccountStatus === 'loading'}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isCreatingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Stripe Account'
            )}
          </Button>
        )}

        {status.status === 'needs_onboarding' && (
          <Button
            onClick={handleStartOnboarding}
            disabled={accountLinkStatus === 'loading'}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {accountLinkStatus === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Complete Verification
              </>
            )}
          </Button>
        )}

        {status.status === 'under_review' && (
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <Loader2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Your account is being reviewed by Stripe. This usually takes 1-2 business days.
              You'll be able to receive payouts once approved.
            </AlertDescription>
          </Alert>
        )}

        {status.status === 'complete' && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your payout account is ready! You'll automatically receive payments on the 27th of each month
              when your available balance reaches your tier's payout threshold.
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Required to receive referral commission payouts
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Secure connection via Stripe (bank-level security)
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Payouts processed automatically on the 27th of each month
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Minimum payout: ${connectedAccount?.default_currency === 'eur' ? '0.50' : '0.50'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};



// // src/pages/referral/StripeOnboardingCard.tsx

// import { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { 
//   CreditCard, 
//   CheckCircle, 
//   XCircle, 
//   Loader2,
//   ExternalLink,
//   AlertTriangle
// } from 'lucide-react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { 
//   createConnectedAccount, 
//   fetchAccountLink, 
//   fetchConnectedAccountStatus 
// } from '@/store/paymentThunks';

// export const StripeOnboardingCard = () => {
//   const dispatch = useAppDispatch();
//   const { 
//     connectedAccount, 
//     connectedAccountStatus,
//     accountLinkUrl,
//     accountLinkStatus 
//   } = useAppSelector((state) => state.payment);
  
//   const [isCreatingAccount, setIsCreatingAccount] = useState(false);

//   // Refresh account status on component mount
//   useEffect(() => {
//     if (!connectedAccount) {
//       dispatch(fetchConnectedAccountStatus());
//     }
//   }, [dispatch, connectedAccount]);

//   const handleCreateAccount = async () => {
//     setIsCreatingAccount(true);
//     try {
//       await dispatch(createConnectedAccount()).unwrap();
//       // Refresh account status after creation
//       await dispatch(fetchConnectedAccountStatus()).unwrap();
//     } catch (error) {
//       console.error('Failed to create account:', error);
//     } finally {
//       setIsCreatingAccount(false);
//     }
//   };

//   const handleStartOnboarding = async () => {
//     if (!connectedAccount) return;
    
//     try {
//       const refreshUrl = `${window.location.origin}/referrals`;
//       const returnUrl = `${window.location.origin}/referrals?onboarding=success`;
      
//       await dispatch(fetchAccountLink({ refreshUrl, returnUrl })).unwrap();
      
//       // Redirect to Stripe onboarding
//       if (accountLinkUrl) {
//         window.open(accountLinkUrl, '_blank');
//       }
//     } catch (error) {
//       console.error('Failed to get account link:', error);
//     }
//   };

//   const getAccountStatus = () => {
//     if (!connectedAccount) {
//       return {
//         status: 'not_created',
//         message: 'No Stripe account created',
//         color: 'gray' as const,
//         icon: <XCircle className="w-4 h-4" />,
//         description: 'Create a Stripe account to receive payouts'
//       };
//     }

//     if (connectedAccount.payouts_enabled) {
//       return {
//         status: 'complete',
//         message: 'Ready for payouts',
//         color: 'green' as const,
//         icon: <CheckCircle className="w-4 h-4" />,
//         description: 'Your account is fully set up and ready for automatic payouts'
//       };
//     }

//     if (connectedAccount.details_submitted) {
//       return {
//         status: 'under_review', 
//         message: 'Under review by Stripe',
//         color: 'yellow' as const,
//         icon: <Loader2 className="w-4 h-4 animate-spin" />,
//         description: 'Your account is being reviewed. This usually takes 1-2 business days.'
//       };
//     }

//     return {
//       status: 'needs_onboarding',
//       message: 'Needs verification',
//       color: 'red' as const,
//       icon: <AlertTriangle className="w-4 h-4" />,
//       description: 'Complete identity verification with Stripe to receive payouts'
//     };
//   };

//   const status = getAccountStatus();

//   return (
//     <Card className="rounded-lg bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 dark:text-emerald-100">
//           <CreditCard className="h-5 w-5 text-emerald-500" />
//           Payout Setup
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {/* Status Display */}
//         <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//           <div className="flex-1">
//             <p className="font-medium text-gray-900 dark:text-white mb-1">
//               Stripe Connected Account
//             </p>
//             <div className="flex items-center gap-2">
//               {status.icon}
//               <span className={`text-sm text-${status.color}-600 dark:text-${status.color}-400`}>
//                 {status.message}
//               </span>
//             </div>
//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//               {status.description}
//             </p>
//           </div>
//           <Badge variant={status.color}>
//             {status.status.replace('_', ' ')}
//           </Badge>
//         </div>

//         {/* Action Buttons */}
//         {status.status === 'not_created' && (
//           <Button
//             onClick={handleCreateAccount}
//             disabled={isCreatingAccount || connectedAccountStatus === 'loading'}
//             className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
//           >
//             {isCreatingAccount ? (
//               <>
//                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 Creating Account...
//               </>
//             ) : (
//               'Create Stripe Account'
//             )}
//           </Button>
//         )}

//         {status.status === 'needs_onboarding' && (
//           <Button
//             onClick={handleStartOnboarding}
//             disabled={accountLinkStatus === 'loading'}
//             className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
//           >
//             {accountLinkStatus === 'loading' ? (
//               <>
//                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                 Loading...
//               </>
//             ) : (
//               <>
//                 <ExternalLink className="w-4 h-4 mr-2" />
//                 Complete Verification
//               </>
//             )}
//           </Button>
//         )}

//         {status.status === 'under_review' && (
//           <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
//             <Loader2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
//             <AlertDescription className="text-yellow-800 dark:text-yellow-200">
//               Your account is being reviewed by Stripe. This usually takes 1-2 business days.
//               You'll be able to receive payouts once approved.
//             </AlertDescription>
//           </Alert>
//         )}

//         {status.status === 'complete' && (
//           <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
//             <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
//             <AlertDescription className="text-green-800 dark:text-green-200">
//               Your payout account is ready! You'll automatically receive payments on the 27th of each month
//               when your available balance reaches your tier's payout threshold.
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Help Text */}
//         <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
//           <p className="flex items-center gap-2">
//             <CheckCircle className="w-3 h-3 text-green-500" />
//             Required to receive referral commission payouts
//           </p>
//           <p className="flex items-center gap-2">
//             <CheckCircle className="w-3 h-3 text-green-500" />
//             Secure connection via Stripe (bank-level security)
//           </p>
//           <p className="flex items-center gap-2">
//             <CheckCircle className="w-3 h-3 text-green-500" />
//             Payouts processed automatically on the 27th of each month
//           </p>
//           <p className="flex items-center gap-2">
//             <CheckCircle className="w-3 h-3 text-green-500" />
//             Minimum payout: ${connectedAccount?.default_currency === 'eur' ? '0.50' : '0.50'}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };