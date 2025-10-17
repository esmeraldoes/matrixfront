import React, { useState } from 'react';
import { 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { type SubscriptionPlan } from '../services/api_payment';

interface CheckoutFormProps {
  plan: SubscriptionPlan;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    
    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // For demo purposes, we'll simulate a successful payment
      setTimeout(() => {
        setProcessing(false);
        setSucceeded(true);
      }, 1500);
      
      // In a real app:
      // const { error, paymentMethod } = await stripe.createPaymentMethod({
      //   type: 'card',
      //   card: cardElement,
      // });
      // 
      // if (error) {
      //   setError(error.message || 'Payment failed');
      //   setProcessing(false);
      // } else {
      //   // Send paymentMethod.id to your server
      //   setProcessing(false);
      //   setSucceeded(true);
      // }
    } catch (err) {
      setError('An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Card details
        </label>
        <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#32325d',
                  '::placeholder': {
                    color: '#aab7c4'
                  }
                },
                invalid: {
                  color: '#fa755a'
                }
              }
            }}
          />
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4 text-sm">{error}</div>
      )}
      
      {succeeded ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 dark:text-green-200 font-medium">
              Payment successful! Your {plan.name} subscription is now active.
            </p>
          </div>
          <div className="mt-4">
            <a 
              href="/dashboard" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Go to Dashboard
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={processing || !stripe}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {processing ? 'Processing...' : `Pay $${plan.amount}`}
        </button>
      )}
      
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Your payment details are securely processed by Stripe.</p>
        <div className="flex justify-center mt-2">
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl w-10 h-6 mx-1" />
          ))}
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;