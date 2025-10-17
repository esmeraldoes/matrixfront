import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  amount: string;
  duration: string;
  features: string[];
}

export const SubscribePage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/payments/plans/').then((res) => {
      setPlans(res.data);
      setLoading(false);
    });
  }, []);

  const selectPlan = (planId: string) => {
    navigate(`/subscribe/${planId}`);
  };

  if (loading) return <p>Loading plans...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {plans.map((plan) => (
        <div key={plan.id} className="border p-4 rounded shadow hover:shadow-md">
          <h2 className="text-xl font-bold">{plan.name}</h2>
          <p className="text-2xl font-semibold">${plan.amount}</p>
          <p className="capitalize text-gray-500">{plan.duration}</p>
          <ul className="text-sm mt-2">
            {plan.features.map((f, idx) => (
              <li key={idx}>✓ {f}</li>
            ))}
          </ul>
          <button
            onClick={() => selectPlan(plan.id)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Choose Plan
          </button>
        </div>
      ))}
    </div>
  );
};
