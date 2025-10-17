
// src/pages/payment/PlanCard.tsx

import React from 'react';
import type { SubscriptionPlan } from '@/services/api_payment';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface PlanCardProps {
  plan: SubscriptionPlan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const isHighlighted = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
  const baseCardColor = isHighlighted ? 'bg-blue-900' : 'bg-gray-800';

  return (
    <div className={`
      relative flex flex-col 
      ${baseCardColor} text-white rounded-lg shadow-xl border transition-all duration-300 ease-in-out overflow-hidden
      hover:shadow-blue-500/50 hover:scale-[1.03] 
      ${isHighlighted ? 'border-blue-500' : 'border-gray-700'}
    `}>
      {isHighlighted && (
        <span className="absolute top-2 right-0 transform translate-x-3 bg-red-500 text-white text-xs font-semibold px-3 py-0.5 rounded-l-full shadow-md uppercase tracking-wider">
          Best Value
        </span>
      )}
      
      <div className="p-4 pb-0">
        <h3 className="text-xl font-bold text-blue-300">
          {plan.name}
        </h3>
        <p className="text-gray-400 text-xs mt-1 min-h-[30px]">{plan.description}</p>
      </div>

      <div className="p-4 pt-3 flex-grow flex flex-col">
        
        <div className="mb-4">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            ${plan.amount}
          </span>
          <span className="text-base font-medium text-gray-400 ml-1">
            /{plan.duration}
          </span>
        </div>
        
        <ul className="space-y-1.5 flex-grow mb-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-gray-200 text-sm">
              <svg 
                className="h-4 w-4 text-teal-400 flex-shrink-0 mt-1 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-auto pt-3 border-t border-gray-700">
          <Button 
            variant="default" 
            className={`w-full font-semibold py-3 text-base transition duration-200 
              ${isHighlighted 
                ? 'bg-blue-400 hover:bg-blue-300 text-blue-900 shadow-md shadow-blue-500/50' 
                : 'bg-gray-200 hover:bg-gray-100 text-gray-900'}
            `} 
            asChild
          >
            <Link to={`/checkout/${plan.id}`}>
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlanCard;


