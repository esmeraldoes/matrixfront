import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { api } from '@/services/api'


export const CheckoutPage = () => {
  const { planId } = useParams();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.post('/api/payments/create-subscription/', { plan_id: planId })
      .then(res => {
        setClientSecret(res.data.client_secret);
      })
      .catch(() => setError('Failed to create subscription'));
  }, [planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const result = await stripe?.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements?.getElement(CardElement)!,
      },
    });

    if (result?.error) {
      setError(result.error.message || 'Payment failed');
      setProcessing(false);
    } else if (result?.paymentIntent?.status === 'succeeded') {
      navigate('/dashboard'); // Or success page
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Complete Your Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardElement className="p-4 border rounded" />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {processing ? 'Processing...' : 'Pay'}
        </button>
      </form>
    </div>
  );
};
