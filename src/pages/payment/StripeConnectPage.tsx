// src/pages/payment/StripeConnectPage.tsx 

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createConnectedAccount, fetchAccountLink, fetchConnectedAccountStatus } from '@/store/paymentThunks'; 
import { resetConnectedAccountState } from '@/store/paymentSlice';
import type{ AppDispatch, RootState } from '@/store/store';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const StripeConnectPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [manualRedirect, setManualRedirect] = useState(false);
  
  const { 
    accountLinkStatus,
    accountLinkUrl,
    connectedAccountStatus,
    connectedAccount,
    connectedAccountError
  } = useSelector((state: RootState) => ({
    accountLinkStatus: state.payment.accountLinkStatus,
    accountLinkUrl: state.payment.accountLinkUrl,
    connectedAccountStatus: state.payment.connectedAccountStatus,
    connectedAccount: state.payment.connectedAccount,
    connectedAccountError: state.payment.connectedAccountError
  }));

  useEffect(() => {
    dispatch(fetchConnectedAccountStatus());
  }, [dispatch]);

  useEffect(() => {
    if (connectedAccountStatus === 'succeeded' && !connectedAccount) {
      dispatch(createConnectedAccount());
    }
    
    if (connectedAccount && !accountLinkUrl && accountLinkStatus === 'idle') {
      const refreshUrl = `${window.location.origin}/stripe-connect`;
      const returnUrl = `${window.location.origin}/payouts`;
      dispatch(fetchAccountLink({ refreshUrl, returnUrl }));
    }
    
    if (accountLinkUrl && !manualRedirect) {
      const timer = setTimeout(() => {
        window.location.href = accountLinkUrl;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      dispatch(resetConnectedAccountState());
    };
  }, [connectedAccount, accountLinkUrl, accountLinkStatus, connectedAccountStatus, dispatch, manualRedirect]);

  const handleManualRedirect = () => {
    if (accountLinkUrl) {
      window.location.href = accountLinkUrl;
    }
  };

  if (connectedAccountStatus === 'loading' || accountLinkStatus === 'loading') {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <LoadingSpinner text="Setting up your payout account..." />
      </div>
    );
  }

  if (connectedAccountError) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error setting up payout account: {connectedAccountError}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Set Up Payout Account</h1>
        <p className="text-lg text-gray-600 mb-2">
          Connect your Stripe account to receive affiliate commissions
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-900">Setup Progress</h2>
          {connectedAccount && (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${connectedAccount ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span className={connectedAccount ? 'text-green-700 font-medium' : 'text-blue-700'}>
              {connectedAccount ? 'Account created' : 'Creating Stripe account...'}
            </span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${accountLinkUrl ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={accountLinkUrl ? 'text-green-700 font-medium' : 'text-gray-500'}>
              {accountLinkUrl ? 'Ready for onboarding' : 'Preparing onboarding...'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">What you'll need:</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Government-issued ID for verification</li>
          <li>• Business information (if applicable)</li>
          <li>• Bank account details for payouts</li>
          <li>• Tax information (SSN/EIN for US)</li>
        </ul>
      </div>

      {accountLinkUrl && (
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Ready to Continue!
            </h3>
            <p className="text-green-700 mb-4">
              You'll be redirected to Stripe to complete your account setup.
            </p>
            
            {manualRedirect ? (
              <Button onClick={handleManualRedirect} size="lg" className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="mr-2 h-5 w-5" />
                Continue to Stripe
              </Button>
            ) : (
              <div className="space-y-4">
                <LoadingSpinner text="Redirecting to Stripe..." />
                <Button 
                  variant="outline" 
                  onClick={() => setManualRedirect(true)}
                  className="mt-2"
                >
                  Click here if not redirected
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            You'll return to your dashboard after completing the Stripe onboarding process.
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          🔒 Your information is securely handled by Stripe, a PCI-compliant payment processor used by millions of businesses worldwide.
        </p>
      </div>
    </div>
  );
};

export default StripeConnectPage;