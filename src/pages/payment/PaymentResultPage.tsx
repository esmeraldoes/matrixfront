// src/pages/payment/PaymentResultPage.tsx
import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyCheckoutSession } from '@/store/paymentThunks';
import { selectSessionVerification } from '@/store/paymentSlice';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PaymentResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const params = new URLSearchParams(location.search);
  const successParam = params.get('success') === 'true';
  const sessionId = params.get('session_id');
  
  const sessionVerification = useAppSelector(selectSessionVerification);
  const {
    status: verificationStatus = 'idle',
    sessionStatus = null,
    paymentStatus = null,
    error: verificationError = null
  } = sessionVerification || {};

  useEffect(() => {
    if (!location.search) {
      navigate('/');
      return;
    }
    
    // Verify payment with backend if successful and session exists
    if (successParam && sessionId && verificationStatus === 'idle') {
      dispatch(verifyCheckoutSession(sessionId));
    }
  }, [location, navigate, successParam, sessionId, dispatch, verificationStatus]);

  const isPaymentSuccess = useMemo(() => {
    if (!successParam) return false;
    
    if (verificationStatus === 'succeeded') {
      return sessionStatus === 'complete' && 
             (paymentStatus === 'paid' || paymentStatus === 'no_payment_required');
    }
    
    return false;
  }, [successParam, verificationStatus, sessionStatus, paymentStatus]);

  // Add loading state for initial mount
  if (!sessionVerification) {
    return (
      <div className="container mx-auto py-12 text-center">
        <LoadingSpinner text="Loading payment status..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 text-center">
      {successParam && verificationStatus === 'loading' ? (
        <LoadingSpinner text="Verifying payment..." />
      ) : verificationStatus === 'failed' ? (
        <div className="text-red-500 mb-4">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Verification Failed</h1>
          <p className="mb-6">{verificationError || 'Could not verify payment status'}</p>
        </div>
      ) : isPaymentSuccess ? (
        <>
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="mb-6 text-gray-600">
            Thank you for your purchase. Your subscription is now active.
          </p>
          {sessionId && (
            <p className="text-sm text-gray-500">
              Session ID: {sessionId}
            </p>
          )}
        </>
      ) : (
        <>
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            {successParam ? 'Payment Verification Failed' : 'Payment Failed'}
          </h1>
          <p className="mb-6 text-gray-600">
            {successParam 
              ? 'We could not verify your payment. Please contact support.'
              : 'There was an issue processing your payment. Please try again.'}
          </p>
        </>
      )}
      
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="primary" onClick={() => navigate('/subscriptions')}>
          View Subscriptions
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default PaymentResultPage;



