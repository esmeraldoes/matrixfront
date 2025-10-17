// src/services/alertService.ts
import type{ Quote, Position } from '@/store/tradingStore';

export interface AlertCondition {
  type: 'price' | 'percentage' | 'volume' | 'technical';
  operator: 'above' | 'below' | 'crosses_above' | 'crosses_below' | 'changes_by';
  value: number;
  symbol: string;
  timeframe?: string; // For technical indicators
  indicator?: 'SMA' | 'EMA' | 'RSI' | 'MACD'; // Technical indicator type
  period?: number; // Period for technical indicators
}

export interface Alert {
  id: string;
  userId: string;
  name: string;
  conditions: AlertCondition[];
  active: boolean;
  triggered: boolean;
  triggerTime?: number;
  cooldown?: number; // Cooldown period in milliseconds
  lastTriggered?: number;
}

export class ScalableAlertService {
  private alerts: Map<string, Alert> = new Map();
  private previousQuotes: Map<string, Quote> = new Map();
  private symbolToAlertMap: Map<string, Set<string>> = new Map();
  private technicalData: Map<string, any> = new Map();
  private updateQueue: Map<string, { quotes: Record<string, Quote>, positions: Position[] }> = new Map();
  private batchProcessingInterval: number;
  private maxBatchSize: number = 1000;

  constructor(
    private onAlertTriggered: (alert: Alert) => void,
    batchProcessingInterval: number = 1000 // Process alerts in batches every second
  ) {
    this.batchProcessingInterval = batchProcessingInterval;
    this.startBatchProcessor();
  }

  // Add multiple alerts efficiently
  addAlerts(alerts: Alert[]): void {
    for (const alert of alerts) {
      this.addAlert(alert);
    }
  }

  addAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    
    // Create reverse mapping from symbols to alerts for efficient updates
    for (const condition of alert.conditions) {
      if (!this.symbolToAlertMap.has(condition.symbol)) {
        this.symbolToAlertMap.set(condition.symbol, new Set());
      }
      this.symbolToAlertMap.get(condition.symbol)!.add(alert.id);
    }
  }

  removeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      // Clean up reverse mapping
      for (const condition of alert.conditions) {
        const alertSet = this.symbolToAlertMap.get(condition.symbol);
        if (alertSet) {
          alertSet.delete(alertId);
          if (alertSet.size === 0) {
            this.symbolToAlertMap.delete(condition.symbol);
          }
        }
      }
      this.alerts.delete(alertId);
    }
  }

  // Queue updates for batch processing
  queueUpdate(userId: string, quotes: Record<string, Quote>, positions: Position[]): void {
    this.updateQueue.set(userId, { quotes, positions });
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      this.processBatchUpdates();
    }, this.batchProcessingInterval);
  }

  private processBatchUpdates(): void {
    if (this.updateQueue.size === 0) return;

    const batch = Array.from(this.updateQueue.entries()).slice(0, this.maxBatchSize);
    
    for (const [userId, data] of batch) {
      this.updateAlertsForUser(userId, data.quotes, data.positions);
      this.updateQueue.delete(userId);
    }
  }

  private updateAlertsForUser(userId: string, quotes: Record<string, Quote>, positions: Position[]): void {
    // Get all alerts for this user
    const userAlerts = Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
    
    if (userAlerts.length === 0) return;

    // Find which symbols are relevant for this user's alerts
    const relevantSymbols = new Set<string>();
    for (const alert of userAlerts) {
      for (const condition of alert.conditions) {
        relevantSymbols.add(condition.symbol);
      }
    }

    // Filter quotes to only relevant symbols
    const relevantQuotes: Record<string, Quote> = {};
    for (const symbol of relevantSymbols) {
      if (quotes[symbol]) {
        relevantQuotes[symbol] = quotes[symbol];
      }
    }

    // Process each alert
    for (const alert of userAlerts) {
      if (!alert.active || (alert.triggered && this.isInCooldown(alert))) continue;
      
      const shouldTrigger = this.checkAlertConditions(alert, relevantQuotes);
      
      if (shouldTrigger) {
        this.triggerAlert(alert);
      }
    }

    // Update previous quotes for next comparison
    Object.entries(relevantQuotes).forEach(([symbol, quote]) => {
      this.previousQuotes.set(symbol, quote);
    });
  }

  private isInCooldown(alert: Alert): boolean {
    if (!alert.cooldown || !alert.lastTriggered) return false;
    return Date.now() - alert.lastTriggered < alert.cooldown;
  }

  private checkAlertConditions(alert: Alert, quotes: Record<string, Quote>): boolean {
    for (const condition of alert.conditions) {
      const quote = quotes[condition.symbol];
      const previousQuote = this.previousQuotes.get(condition.symbol);
      
      if (!quote) return false;
      
      const currentPrice = (quote.bid_price + quote.ask_price) / 2;
      const previousPrice = previousQuote ? 
        (previousQuote.bid_price + previousQuote.ask_price) / 2 : currentPrice;
      
      let conditionMet = false;
      
      switch (condition.type) {
        case 'price':
          conditionMet = this.checkPriceCondition(
            currentPrice, 
            previousPrice, 
            condition.operator, 
            condition.value
          );
          break;
          
        case 'percentage':
          const change = previousPrice !== 0 ? 
            ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
          conditionMet = this.checkPercentageCondition(
            change,
            condition.operator,
            condition.value
          );
          break;
          
        case 'volume':
          // Volume-based conditions
          if (quote.volume !== undefined) {
            conditionMet = this.checkVolumeCondition(
              quote.volume,
              condition.operator,
              condition.value
            );
          }
          break;
          
        case 'technical':
          conditionMet = this.checkTechnicalCondition(
            condition,
            currentPrice,
            previousPrice
          );
          break;
      }
      
      if (!conditionMet) {
        return false;
      }
    }
    
    return true;
  }

  private checkPriceCondition(
    currentPrice: number, 
    previousPrice: number, 
    operator: string, 
    value: number
  ): boolean {
    switch (operator) {
      case 'above':
        return currentPrice > value;
      case 'below':
        return currentPrice < value;
      case 'crosses_above':
        return previousPrice <= value && currentPrice > value;
      case 'crosses_below':
        return previousPrice >= value && currentPrice < value;
      case 'changes_by':
        return Math.abs(currentPrice - previousPrice) >= value;
      default:
        return false;
    }
  }

  private checkPercentageCondition(
    change: number, 
    operator: string, 
    value: number
  ): boolean {
    switch (operator) {
      case 'above':
        return change > value;
      case 'below':
        return change < value;
      case 'changes_by':
        return Math.abs(change) >= value;
      default:
        return false;
    }
  }

  private checkVolumeCondition(
    volume: number, 
    operator: string, 
    value: number
  ): boolean {
    switch (operator) {
      case 'above':
        return volume > value;
      case 'below':
        return volume < value;
      default:
        return false;
    }
  }

  private checkTechnicalCondition(
    condition: AlertCondition,
    currentPrice: number,
    previousPrice: number
  ): boolean {
    // This would integrate with technical indicator calculations
    // For now, return false as a placeholder
    return false;
  }

  private triggerAlert(alert: Alert): void {
    alert.triggered = true;
    alert.lastTriggered = Date.now();
    this.alerts.set(alert.id, alert);
    this.onAlertTriggered(alert);
  }

  resetAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.triggered = false;
      this.alerts.set(alertId, alert);
    }
  }

  // Get alerts by user ID
  getUserAlerts(userId: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  // Get alerts by symbol
  getAlertsBySymbol(symbol: string): Alert[] {
    const alertIds = this.symbolToAlertMap.get(symbol);
    if (!alertIds) return [];
    
    return Array.from(alertIds)
      .map(id => this.alerts.get(id))
      .filter(alert => alert !== undefined) as Alert[];
  }

  // Clean up method to remove stale data
  cleanupStaleData(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    // Remove old quotes
    for (const [symbol, quote] of this.previousQuotes) {
      if (now - quote.timestamp > maxAge) {
        this.previousQuotes.delete(symbol);
      }
    }
    
    // Remove alerts that haven't been updated in a while
    for (const [id, alert] of this.alerts) {
      if (!alert.lastTriggered || now - alert.lastTriggered > maxAge) {
        this.removeAlert(id);
      }
    }
  }
}