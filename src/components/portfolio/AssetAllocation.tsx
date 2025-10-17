// components/portfolio/AssetAllocation.tsx
import React from 'react';
import { PieChart } from 'lucide-react';
import type { PortfolioAsset } from '@/hooks/usePortfolios';

interface AssetAllocationProps {
  assets?: PortfolioAsset[];
  allocation?: {
    forex: number;
    crypto: number;
    stocks: number;
    commodities: number;
  };
}

export const AssetAllocation: React.FC<AssetAllocationProps> = ({ assets, allocation }) => {
  const displayData = assets ? 
    assets.map(asset => ({
      name: asset.symbol,
      value: asset.allocation,
      color: getAssetColor(asset.asset_class)
    })) : 
    allocation ? [
      { name: 'Forex', value: allocation.forex, color: 'bg-blue-500' },
      { name: 'Crypto', value: allocation.crypto, color: 'bg-purple-500' },
      { name: 'Stocks', value: allocation.stocks, color: 'bg-emerald-500' },
      { name: 'Commodities', value: allocation.commodities, color: 'bg-yellow-500' }
    ] : [];

  function getAssetColor(assetClass: string): string {
    switch (assetClass.toLowerCase()) {
      case 'stock': return 'bg-emerald-500';
      case 'etf': return 'bg-blue-500';
      case 'crypto': return 'bg-purple-500';
      case 'bond': return 'bg-yellow-500';
      case 'cash': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  }

  if (!displayData.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Asset Allocation
        </h3>
      </div>

      <div className="space-y-4">
        {displayData.map((category) => (
          <div key={category.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {category.name}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {category.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${category.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${category.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};