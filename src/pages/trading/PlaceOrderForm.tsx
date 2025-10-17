import React, { useState, useEffect } from 'react';
import { useCreateOrder } from '@/hooks/useTrading';
import { useTradingStore } from '@/store/tradingStore';
import { useAccount } from '@/hooks/useTrading';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { OrderRequest } from '@/store/types/trading';

type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' | 'trailing_stop_limit';
type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
type Side = 'buy' | 'sell';
type TrailType = 'amount' | 'percent';

interface PlaceOrderFormProps {
  accountId: string;
  symbol: string | null;
  availableSymbols: string[];
  onSymbolChange: (symbol: string) => void;
}

const toNum = (val: string | number | null | undefined): number =>
  val ? parseFloat(val.toString()) : 0;

export const PlaceOrderForm: React.FC<PlaceOrderFormProps> = ({
  accountId,
  symbol,
  availableSymbols,
  onSymbolChange,
}) => {
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<Side>('buy');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [trailValue, setTrailValue] = useState('');
  const [trailType, setTrailType] = useState<TrailType>('amount');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('gtc');
  const [isQuantityAutoSet, setIsQuantityAutoSet] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<OrderRequest | null>(null);
  
  const createOrder = useCreateOrder(accountId);
  const { data: account } = useAccount(accountId);
  const quotes = useTradingStore(state => state.quotes);
  const assets = useTradingStore(state => state.assets);
  const { toast } = useToast();

  useEffect(() => {
    if (symbol && account && quotes[symbol] && !isQuantityAutoSet) {
      const currentPrice = quotes[symbol].ask_price || quotes[symbol].bid_price;
      
      if (currentPrice > 0) {
        const buyingPower = account.buying_power;
        const positionSize = toNum(buyingPower) * 0.1;
        const calculatedQuantity = Math.floor(positionSize / currentPrice);
        
        const asset = assets.find(a => a.symbol === symbol);
        const isCrypto = asset?.asset_class === 'crypto';
        
        if (isCrypto) {
          setQuantity((positionSize / currentPrice).toFixed(6));
        } else if (calculatedQuantity > 0) {
          setQuantity(calculatedQuantity.toString());
        }
        
        setIsQuantityAutoSet(true);
      }
    }
  }, [symbol, account, quotes, assets, isQuantityAutoSet]);

  useEffect(() => {
    setIsQuantityAutoSet(false);
  }, [symbol]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(e.target.value);
    setIsQuantityAutoSet(false); 
  };

  const handleSymbolChangeInternal = (newSymbol: string) => {
    onSymbolChange(newSymbol);
    setIsQuantityAutoSet(false); 
  };

  const calculatePositionSize = () => {
    if (symbol && quotes[symbol] && quantity) {
      const currentPrice = quotes[symbol].ask_price || quotes[symbol].bid_price;
      const qty = parseFloat(quantity);
      return (currentPrice * qty).toFixed(2);
    }
    return '0.00';
  };

  const getPositionSizePercentage = () => {
    if (account && calculatePositionSize() !== '0.00') {
      const positionSize = parseFloat(calculatePositionSize());
      const buyingPower = account.buying_power;
      return ((positionSize / toNum(buyingPower)) * 100).toFixed(2);
    }
    return '0.00';
  };

  const validateOrder = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!symbol) {
      errors.push('Please select a symbol');
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      errors.push('Please enter a valid quantity');
    }

    if (orderType === 'limit' && !limitPrice) {
      errors.push('Limit Price is required for a Limit order');
    } else if (orderType === 'stop' && !stopPrice) {
      errors.push('Stop Price is required for a Stop order');
    } else if (orderType === 'stop_limit' && (!stopPrice || !limitPrice)) {
      errors.push('Stop Price and Limit Price are required for a Stop Limit order');
    } else if (orderType === 'trailing_stop' && !trailValue) {
      errors.push('Trail Value is required for a Trailing Stop order');
    } else if (orderType === 'trailing_stop_limit' && (!trailValue || !limitPrice)) {
      errors.push('Trail Value and Limit Price are required for a Trailing Stop Limit order');
    }

    // Validate numeric values
    if (limitPrice && parseFloat(limitPrice) <= 0) {
      errors.push('Limit Price must be greater than 0');
    }
    if (stopPrice && parseFloat(stopPrice) <= 0) {
      errors.push('Stop Price must be greater than 0');
    }
    if (trailValue && parseFloat(trailValue) <= 0) {
      errors.push('Trail Value must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const prepareOrderData = (): OrderRequest | null => {
    const validation = validateOrder();
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      return null;
    }

    const orderData: OrderRequest = {
      symbol: symbol!,
      side,
      type: orderType,
      qty: parseFloat(quantity),
      time_in_force: timeInForce,
    };
    
    if (orderType === 'limit') {
      orderData.limit_price = parseFloat(limitPrice);
    } else if (orderType === 'stop') {
      orderData.stop_price = parseFloat(stopPrice);
    } else if (orderType === 'stop_limit') {
      orderData.stop_price = parseFloat(stopPrice);
      orderData.limit_price = parseFloat(limitPrice);
    } else if (orderType === 'trailing_stop') {
      if (trailType === 'amount') {
        orderData.trail_price = parseFloat(trailValue);
      } else {
        orderData.trail_percent = parseFloat(trailValue);
      }
    } else if (orderType === 'trailing_stop_limit') {
      if (trailType === 'amount') {
        orderData.trail_price = parseFloat(trailValue);
      } else {
        orderData.trail_percent = parseFloat(trailValue);
      }
      orderData.limit_price = parseFloat(limitPrice);
    }
    
    return orderData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = prepareOrderData();
    if (!orderData) return;

    setPendingOrderData(orderData);
    setShowOrderConfirmation(true);
  };

  const confirmOrder = () => {
    if (!pendingOrderData) return;

    createOrder.mutate(pendingOrderData, {
      onSuccess: () => {
        // Reset form
        setQuantity('');
        setLimitPrice('');
        setStopPrice('');
        setTrailValue('');
        setTrailType('amount');
        setIsQuantityAutoSet(false);
        
        // Show success toast
        toast({
          title: "Order Placed Successfully",
          description: `${pendingOrderData.side.toUpperCase()} order for ${pendingOrderData.symbol} has been placed`,
          variant: "default",
        });

        // Close confirmation modal
        setShowOrderConfirmation(false);
        setPendingOrderData(null);
      },
      onError: (error: any) => {
        console.error('Failed to place order:', error);
        
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
        
        toast({
          title: "Order Failed",
          description: `Error placing order: ${errorMessage}`,
          variant: "destructive",
        });

        // Close confirmation modal
        setShowOrderConfirmation(false);
        setPendingOrderData(null);
      }
    });
  };

  const getOrderSummary = () => {
    if (!pendingOrderData) return null;

    const positionSize = calculatePositionSize();
    const positionPercentage = getPositionSizePercentage();

    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
          <span className="font-medium text-gray-900 dark:text-white">{pendingOrderData.symbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Action:</span>
          <span className={`font-medium ${side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
            {pendingOrderData.side.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Type:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {pendingOrderData.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="font-medium text-gray-900 dark:text-white">{pendingOrderData.qty}</span>
        </div>
        {pendingOrderData.limit_price && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Limit Price:</span>
            <span className="font-medium text-gray-900 dark:text-white">${pendingOrderData.limit_price}</span>
          </div>
        )}
        {pendingOrderData.stop_price && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Stop Price:</span>
            <span className="font-medium text-gray-900 dark:text-white">${pendingOrderData.stop_price}</span>
          </div>
        )}
        {(pendingOrderData.trail_price || pendingOrderData.trail_percent) && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trail Value:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {pendingOrderData.trail_price ? `$${pendingOrderData.trail_price}` : `${pendingOrderData.trail_percent}%`}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Time in Force:</span>
          <span className="font-medium text-gray-900 dark:text-white">{pendingOrderData.time_in_force.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Position Size:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${positionSize} ({positionPercentage}%)
          </span>
        </div>
      </div>
    );
  };

  const renderOrderTypeFields = () => {
    switch (orderType) {
      case 'limit':
        return (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Limit Price</label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        );
      case 'stop':
        return (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stop Price</label>
            <input
              type="number"
              step="any"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
        );
      case 'stop_limit':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stop Price</label>
              <input
                type="number"
                step="any"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Limit Price</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </>
        );
      case 'trailing_stop':
      case 'trailing_stop_limit':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Trail Value</label>
              <div className="flex rounded-md shadow-sm">
                <input
                  type="number"
                  step="any"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={trailValue}
                  onChange={(e) => setTrailValue(e.target.value)}
                  required
                  placeholder="e.g., 5.00 or 1.5"
                />
                <select
                  value={trailType}
                  onChange={(e) => setTrailType(e.target.value as TrailType)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="amount">Amount ($)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
            </div>
            {orderType === 'trailing_stop_limit' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Limit Price</label>
                <input
                  type="number"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={showOrderConfirmation}
        onClose={() => {
          setShowOrderConfirmation(false);
          setPendingOrderData(null);
        }}
        onConfirm={confirmOrder}
        title="Confirm Order"
        message={
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Please review your order details before confirming:
            </p>
            {getOrderSummary()}
          </div>
        }
        confirmText="Place Order"
        variant={side === 'buy' ? 'info' : 'warning'}
        isLoading={createOrder.isPending}
      />

      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Place Order</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Symbol</label>
            <select
              value={symbol || ''}
              onChange={(e) => handleSymbolChangeInternal(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select symbol</option>
              {availableSymbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
              <option value="stop_limit">Stop Limit</option>
              <option value="trailing_stop">Trailing Stop</option>
              <option value="trailing_stop_limit">Trailing Stop Limit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Time in Force</label>
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="gtc">Good Till Canceled (GTC)</option>
              <option value="day">Day</option>
              <option value="opg">Opening (OPG)</option>
              <option value="cls">Closing (CLS)</option>
              <option value="ioc">Immediate or Cancel (IOC)</option>
              <option value="fok">Fill or Kill (FOK)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Side</label>
            <div className="flex space-x-2">
              <button
                type="button"
                className={`flex-1 p-2 rounded-md transition-colors duration-200 ${
                  side === 'buy' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSide('buy')}
              >
                Buy
              </button>
              <button
                type="button"
                className={`flex-1 p-2 rounded-md transition-colors duration-200 ${
                  side === 'sell' 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSide('sell')}
              >
                Sell
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Position Size: ${calculatePositionSize()} ({getPositionSizePercentage()}% of buying power)
              {isQuantityAutoSet && <span className="ml-2 text-blue-500">(Auto-calculated)</span>}
            </div>
          </div>
          
          {renderOrderTypeFields()}
          
          <button
            type="submit"
            disabled={createOrder.isPending || !symbol || !quantity}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createOrder.isPending ? 'Placing Order...' : 'Review Order'}
          </button>
        </form>
      </div>
    </>
  );
};














// import React, { useState, useEffect } from 'react';
// import { useCreateOrder } from '@/hooks/useTrading';
// import { useTradingStore } from '@/store/tradingStore';
// import { useAccount } from '@/hooks/useTrading';
// import type{ OrderRequest } from '@/store/types/trading';

// type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop' | 'trailing_stop_limit';
// type TimeInForce = 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
// type Side = 'buy' | 'sell';
// type TrailType = 'amount' | 'percent';

// interface PlaceOrderFormProps {
//   accountId: string;
//   symbol: string | null;
//   availableSymbols: string[];
//   onSymbolChange: (symbol: string) => void;
// }

// const toNum = (val: string | number | null | undefined): number =>
//   val ? parseFloat(val.toString()) : 0;

// export const PlaceOrderForm: React.FC<PlaceOrderFormProps> = ({
//   accountId,
//   symbol,
//   availableSymbols,
//   onSymbolChange,
// }) => {
//   const [orderType, setOrderType] = useState<OrderType>('market');
//   const [side, setSide] = useState<Side>('buy');
//   const [quantity, setQuantity] = useState('');
//   const [limitPrice, setLimitPrice] = useState('');
//   const [stopPrice, setStopPrice] = useState('');
//   const [trailValue, setTrailValue] = useState('');
//   const [trailType, setTrailType] = useState<TrailType>('amount');
//   const [timeInForce, setTimeInForce] = useState<TimeInForce>('gtc');
//   const [isQuantityAutoSet, setIsQuantityAutoSet] = useState(false);
  
//   const createOrder = useCreateOrder(accountId);
//   const { data: account } = useAccount(accountId);
//   const quotes = useTradingStore(state => state.quotes);
//   const assets = useTradingStore(state => state.assets);

//   useEffect(() => {
//     if (symbol && account && quotes[symbol] && !isQuantityAutoSet) {
//       const currentPrice = quotes[symbol].ask_price || quotes[symbol].bid_price;
      
//       if (currentPrice > 0) {
//         const buyingPower = account.buying_power;
//         const positionSize = toNum(buyingPower) * 0.1;
//         const calculatedQuantity = Math.floor(positionSize / currentPrice);
        
//         const asset = assets.find(a => a.symbol === symbol);
//         const isCrypto = asset?.asset_class === 'crypto';
        
//         if (isCrypto) {
//           setQuantity((positionSize / currentPrice).toFixed(6));
//         } else if (calculatedQuantity > 0) {
//           setQuantity(calculatedQuantity.toString());
//         }
        
//         setIsQuantityAutoSet(true);
//       }
//     }
//   }, [symbol, account, quotes, assets, isQuantityAutoSet]);

//   useEffect(() => {
//     setIsQuantityAutoSet(false);
//   }, [symbol]);

//   const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuantity(e.target.value);
//     setIsQuantityAutoSet(false); 
//   };

//   const handleSymbolChangeInternal = (newSymbol: string) => {
//     onSymbolChange(newSymbol);
//     setIsQuantityAutoSet(false); 
//   };

//   const calculatePositionSize = () => {
//     if (symbol && quotes[symbol] && quantity) {
//       const currentPrice = quotes[symbol].ask_price || quotes[symbol].bid_price;
//       const qty = parseFloat(quantity);
//       return (currentPrice * qty).toFixed(2);
//     }
//     return '0.00';
//   };

//   const getPositionSizePercentage = () => {
//     if (account && calculatePositionSize() !== '0.00') {
//       const positionSize = parseFloat(calculatePositionSize());
//       const buyingPower = account.buying_power;
//       return ((positionSize / toNum(buyingPower)) * 100).toFixed(2);
//     }
//     return '0.00';
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!symbol || !quantity) {
//       alert('Please select a symbol and enter a quantity.');
//       return;
//     }
    
//     const orderData: OrderRequest = {
//       symbol,
//       side,
//       type: orderType,
//       qty: parseFloat(quantity),
//       time_in_force: timeInForce,
//     };
    
//     if (orderType === 'limit') {
//       if (!limitPrice) { alert('Limit Price is required for a Limit order.'); return; }
//       orderData.limit_price = parseFloat(limitPrice);
//     } else if (orderType === 'stop') {
//       if (!stopPrice) { alert('Stop Price is required for a Stop order.'); return; }
//       orderData.stop_price = parseFloat(stopPrice);
//     } else if (orderType === 'stop_limit') {
//       if (!stopPrice || !limitPrice) { alert('Stop Price and Limit Price are required for a Stop Limit order.'); return; }
//       orderData.stop_price = parseFloat(stopPrice);
//       orderData.limit_price = parseFloat(limitPrice);
//     } else if (orderType === 'trailing_stop') {
//       if (!trailValue) { alert('Trail Value is required for a Trailing Stop order.'); return; }
//       if (trailType === 'amount') {
//         orderData.trail_price = parseFloat(trailValue);
//       } else {
//         orderData.trail_percent = parseFloat(trailValue);
//       }
//     } else if (orderType === 'trailing_stop_limit') {
//       if (!trailValue || !limitPrice) { alert('Trail Value and Limit Price are required for a Trailing Stop Limit order.'); return; }
//       if (trailType === 'amount') {
//         orderData.trail_price = parseFloat(trailValue);
//       } else {
//         orderData.trail_percent = parseFloat(trailValue);
//       }
//       orderData.limit_price = parseFloat(limitPrice);
//     }
    
//     createOrder.mutate(orderData, {
//       onSuccess: () => {
//         setQuantity('');
//         setLimitPrice('');
//         setStopPrice('');
//         setTrailValue('');
//         setTrailType('amount');
//         setIsQuantityAutoSet(false);
//         alert('Order placed successfully!');
//       },
//       onError: (error) => {
//         console.error('Failed to place order:', error);
//         alert(`Error placing order: ${error.message || 'Unknown error'}`);
//       }
//     });
//   };

//   const renderOrderTypeFields = () => {
//     switch (orderType) {
//       case 'limit':
//         return (
//           <div>
//             <label className="block text-sm font-medium mb-1">Limit Price</label>
//             <input
//               type="number"
//               step="any"
//               value={limitPrice}
//               onChange={(e) => setLimitPrice(e.target.value)}
//               className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//               required
//             />
//           </div>
//         );
//       case 'stop':
//         return (
//           <div>
//             <label className="block text-sm font-medium mb-1">Stop Price</label>
//             <input
//               type="number"
//               step="any"
//               value={stopPrice}
//               onChange={(e) => setStopPrice(e.target.value)}
//               className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//               required
//             />
//           </div>
//         );
//       case 'stop_limit':
//         return (
//           <>
//             <div>
//               <label className="block text-sm font-medium mb-1">Stop Price</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={stopPrice}
//                 onChange={(e) => setStopPrice(e.target.value)}
//                 className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Limit Price</label>
//               <input
//                 type="number"
//                 step="any"
//                 value={limitPrice}
//                 onChange={(e) => setLimitPrice(e.target.value)}
//                 className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//                 required
//               />
//             </div>
//           </>
//         );
//       case 'trailing_stop':
//       case 'trailing_stop_limit':
//         return (
//           <>
//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">Trail Value</label>
//               <div className="flex rounded-md shadow-sm">
//                 <input
//                   type="number"
//                   step="any"
//                   className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700"
//                   value={trailValue}
//                   onChange={(e) => setTrailValue(e.target.value)}
//                   required
//                   placeholder="e.g., 5.00 or 1.5"
//                 />
//                 <select
//                   value={trailType}
//                   onChange={(e) => setTrailType(e.target.value as TrailType)}
//                   className="p-2 border border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700"
//                 >
//                   <option value="amount">Amount ($)</option>
//                   <option value="percent">Percent (%)</option>
//                 </select>
//               </div>
//             </div>
//             {orderType === 'trailing_stop_limit' && (
//               <div>
//                 <label className="block text-sm font-medium mb-1">Limit Price</label>
//                 <input
//                   type="number"
//                   step="any"
//                   value={limitPrice}
//                   onChange={(e) => setLimitPrice(e.target.value)}
//                   className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
//                   required
//                 />
//               </div>
//             )}
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
//       <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Place Order</h3>
      
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Symbol</label>
//           <select
//             value={symbol || ''}
//             onChange={(e) => handleSymbolChangeInternal(e.target.value)}
//             className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select symbol</option>
//             {availableSymbols.map((s) => (
//               <option key={s} value={s}>
//                 {s}
//               </option>
//             ))}
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Order Type</label>
//           <select
//             value={orderType}
//             onChange={(e) => setOrderType(e.target.value as OrderType)}
//             className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="market">Market</option>
//             <option value="limit">Limit</option>
//             <option value="stop">Stop</option>
//             <option value="stop_limit">Stop Limit</option>
//             <option value="trailing_stop">Trailing Stop</option>
//             <option value="trailing_stop_limit">Trailing Stop Limit</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Time in Force</label>
//           <select
//             value={timeInForce}
//             onChange={(e) => setTimeInForce(e.target.value as TimeInForce)}
//             className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="gtc">Good Till Canceled (GTC)</option>
//             <option value="day">Day</option>
//             <option value="opg">Opening (OPG)</option>
//             <option value="cls">Closing (CLS)</option>
//             <option value="ioc">Immediate or Cancel (IOC)</option>
//             <option value="fok">Fill or Kill (FOK)</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Side</label>
//           <div className="flex space-x-2">
//             <button
//               type="button"
//               className={`flex-1 p-2 rounded-md transition-colors duration-200 ${
//                 side === 'buy' 
//                   ? 'bg-green-600 text-white shadow-md' 
//                   : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
//               }`}
//               onClick={() => setSide('buy')}
//             >
//               Buy
//             </button>
//             <button
//               type="button"
//               className={`flex-1 p-2 rounded-md transition-colors duration-200 ${
//                 side === 'sell' 
//                   ? 'bg-red-600 text-white shadow-md' 
//                   : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
//               }`}
//               onClick={() => setSide('sell')}
//             >
//               Sell
//             </button>
//           </div>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
//           <input
//             type="number"
//             step="any"
//             value={quantity}
//             onChange={handleQuantityChange}
//             className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//             required
//           />
//           <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//             Position Size: ${calculatePositionSize()} ({getPositionSizePercentage()}% of buying power)
//             {isQuantityAutoSet && <span className="ml-2 text-blue-500">(Auto-calculated)</span>}
//           </div>
//         </div>
        
//         {renderOrderTypeFields()}
        
//         <button
//           type="submit"
//           disabled={createOrder.isPending || !symbol || !quantity}
//           className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
//         </button>
//       </form>
//     </div>
//   );
// };

