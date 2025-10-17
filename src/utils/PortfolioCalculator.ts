// // src/utils/portfolioCalculator.ts
// import type { Position } from '@/store/types/trade';
// // import type{ Quote } from '@/store/types/trading';
// import type{ Quote } from '@/store/types/tard';
// // import type{ Position, Quote } from '@/store/tradingStore';

// export interface PortfolioValue {
//   totalValue: number;
//   unrealizedPL: number;
//   unrealizedPLPercent: number;
//   dailyPL: number;
//   dailyPLPercent: number;
//   positions: PositionValue[];
// }

// export interface PositionValue {
//   symbol: string;
//   quantity: number;
//   currentPrice: number;
//   marketValue: number;
//   avgEntryPrice: number;
//   unrealizedPL: number;
//   unrealizedPLPercent: number;
// }

// export function calculatePortfolioValue(
//   positions: Position[],
//   quotes: Record<string, Quote>,
//   initialEquity: number
// ): PortfolioValue {
//   let totalValue = 0;
//   let totalUnrealizedPL = 0;
//   let totalCostBasis = 0;
  
//   const positionValues: PositionValue[] = positions.map(position => {
//     const symbol = position.symbol;
//     const currentQuote = quotes[symbol];
//     const currentPrice = currentQuote ? 
//       (currentQuote.bid_price + currentQuote.ask_price) / 2 : 
//       parseFloat(position.current_price);
    
//     const quantity = parseFloat(position.qty);
//     const marketValue = quantity * currentPrice;
//     const avgEntryPrice = parseFloat(position.avg_entry_price);
//     const costBasis = quantity * avgEntryPrice;
//     const unrealizedPL = marketValue - costBasis;
//     const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
    
//     totalValue += marketValue;
//     totalUnrealizedPL += unrealizedPL;
//     totalCostBasis += costBasis;
    
//     return {
//       symbol,
//       quantity,
//       currentPrice,
//       marketValue,
//       avgEntryPrice,
//       unrealizedPL,
//       unrealizedPLPercent
//     };
//   });
  
//   const unrealizedPLPercent = totalCostBasis > 0 ? 
//     (totalUnrealizedPL / totalCostBasis) * 100 : 0;
  
//   // Calculate daily P/L (this would need historical data)
//   const dailyPL = 0; // Placeholder
//   const dailyPLPercent = initialEquity > 0 ? (dailyPL / initialEquity) * 100 : 0;
  
//   return {
//     totalValue: totalValue + (initialEquity - totalCostBasis), // Add cash
//     unrealizedPL: totalUnrealizedPL,
//     unrealizedPLPercent,
//     dailyPL,
//     dailyPLPercent,
//     positions: positionValues
//   };
// }