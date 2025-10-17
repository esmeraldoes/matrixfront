// src/services/performanceMonitor.ts
export interface PerformanceMetrics {
  messageRate: number;
  latency: number;
  errorRate: number;
  connectionUptime: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    messageRate: 0,
    latency: 0,
    errorRate: 0,
    connectionUptime: 0,
    memoryUsage: 0,
  };

  private messageCount = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private lastUpdate = Date.now();
  private latencySum = 0;
  private latencyCount = 0;

  constructor(private updateInterval: number = 5000) {
    setInterval(() => this.updateMetrics(), this.updateInterval);
  }

  recordMessage(latency?: number): void {
    this.messageCount++;
    if (latency !== undefined) {
      this.latencySum += latency;
      this.latencyCount++;
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  private updateMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.lastUpdate) / 1000; // in seconds
    
    this.metrics.messageRate = this.messageCount / elapsed;
    this.metrics.errorRate = this.errorCount / elapsed;
    this.metrics.connectionUptime = (now - this.startTime) / 1000;
    
    if (this.latencyCount > 0) {
      this.metrics.latency = this.latencySum / this.latencyCount;
    }
    
    // Reset counters
    this.messageCount = 0;
    this.errorCount = 0;
    this.latencySum = 0;
    this.latencyCount = 0;
    this.lastUpdate = now;
    
    // Update memory usage (browser-only)
    if (typeof window !== 'undefined' && (window as any).performance) {
      this.metrics.memoryUsage = (window as any).performance.memory?.usedJSHeapSize || 0;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (this.metrics.errorRate > 0.1 || this.metrics.latency > 1000) {
      return 'unhealthy';
    } else if (this.metrics.errorRate > 0.01 || this.metrics.latency > 500) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}