// src/pages/payment/CheckoutPage.tsx

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCheckoutSession } from '@/store/paymentThunks';
import { Link, useParams} from 'react-router-dom';
import { resetCheckoutState } from '@/store/paymentSlice';
import type{ AppDispatch, RootState } from '@/store/store';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';


const CheckoutPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { url, sessionId, status, error } = useSelector((state: RootState) => state.payment.checkoutSession);

const requestInitiated = useRef(false);

useEffect(() => {
  if (planId && status === 'idle' && !requestInitiated.current) {
    requestInitiated.current = true;
    dispatch(createCheckoutSession(planId));
  }

  return () => {
    if (status !== 'processing') {
      dispatch(resetCheckoutState());
    }
    
    requestInitiated.current = false; 
  };
}, [planId, status, dispatch]); 

useEffect(() => {
    if (url && sessionId) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('session_id', sessionId);
      
      const timer = setTimeout(() => {
        window.location.href = urlObj.toString();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [url, sessionId]);


  if (status === 'processing') return <LoadingSpinner text="Redirecting to payment..." />;

    if (status === 'failed') {
    return (
        <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Checkout Failed</h1>
        
        {error?.includes('trial') ? (
            <div>
            <p className="text-red-500 mb-4">
                Trial not available: {error}
            </p>
            <Button asChild variant="secondary">
                <Link to="/plans">Choose Another Plan</Link>
            </Button>
            </div>
        ) : (
            <div>Error: {error}</div>
        )}
        </div>
    );
    }

  return (
    <div className="container mx-auto py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Processing Payment</h1>
      <p>You'll be redirected to our secure payment page shortly.</p>
    </div>
  );
};

export default CheckoutPage;