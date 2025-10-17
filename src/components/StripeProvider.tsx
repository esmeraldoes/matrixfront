// src/components/StripeProvider.tsx
import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||"pk_test_51Qr3NcCVV6Nkon5YTT95VUx37LfK4FFesVShkzpKS5LK9udS2pk0zk8zRiuFI12wgwAvIkc4uzZXa528DVopo1IG00GKqyeuay";
        if (!key) {
          throw new Error('Stripe publishable key is missing');
        }
        
        const stripeInstance = await loadStripe(key);
        if (!stripeInstance) {
          throw new Error('Failed to initialize Stripe');
        }
        
        setStripe(stripeInstance);
      } catch (err) {
        console.error('Stripe initialization error:', err);
        setError('Payment system is currently unavailable. Please try again later.');
      }
    };

    initializeStripe();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 text-center">
        <h3 className="font-bold">Payment System Error</h3>
        <p>{error}</p>
        <p className="mt-2 text-sm">
          Please contact support if this issue persists
        </p>
      </div>
    );
  }

  return <Elements stripe={stripe}>{children}</Elements>;
};

export default StripeProvider;






// import React from 'react';
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';

// // Load your Stripe publishable key from env
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)||"pk_test_51Qr3NcCVV6Nkon5YTT95VUx37LfK4FFesVShkzpKS5LK9udS2pk0zk8zRiuFI12wgwAvIkc4uzZXa528DVopo1IG00GKqyeuay";

// const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//   <Elements stripe={stripePromise}>{children}</Elements>
// );

// export default StripeProvider;
