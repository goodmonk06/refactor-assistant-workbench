/**
 * Metrics collector interface for observability
 *
 * Supports:
 * - Prometheus
 * - DataDog
 * - CloudWatch
 * - Custom/in-memory collectors
 */
export interface IMetricsCollector {
  /**
   * Collector name
   */
  readonly name: string;

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels?: Record<string, string>, value?: number): void;

  /**
   * Record a gauge value
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram value (for timing, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Optional: Flush metrics to backend
   */
  flush?(): Promise<void>;
}

/**
 * In-memory metrics collector (for development/testing)
 */
export class InMemoryMetricsCollector implements IMetricsCollector {
  readonly name = 'in-memory';
  private metrics: Map<string, MetricValue[]> = new Map();

  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    this.recordMetric(name, 'counter', value, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, 'gauge', value, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, 'histogram', value, labels);
  }

  private recordMetric(
    name: string,
    type: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push({
      type,
      value,
      labels: labels || {},
      timestamp: new Date(),
    });
  }

  getMetrics(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }

  getAllMetrics(): Map<string, MetricValue[]> {
    return this.metrics;
  }

  clear(): void {
    this.metrics.clear();
  }
}

interface MetricValue {
  type: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

/**
 * Metrics registry
 */
export class MetricsRegistry {
  private collectors: Map<string, IMetricsCollector> = new Map();
  private defaultCollector?: IMetricsCollector;

  register(collector: IMetricsCollector, isDefault = false): void {
    this.collectors.set(collector.name, collector);
    if (isDefault || !this.defaultCollector) {
      this.defaultCollector = collector;
    }
  }

  getDefault(): IMetricsCollector {
    if (!this.defaultCollector) {
      // Auto-register in-memory collector if none exists
      const collector = new InMemoryMetricsCollector();
      this.register(collector, true);
      return collector;
    }
    return this.defaultCollector;
  }

  get(name: string): IMetricsCollector | undefined {
    return this.collectors.get(name);
  }
}

// Global metrics registry
export const metricsRegistry = new MetricsRegistry();

/**
 * Convenience functions for common metrics
 */
export const metrics = {
  incrementCounter: (name: string, labels?: Record<string, string>, value?: number) => {
    metricsRegistry.getDefault().incrementCounter(name, labels, value);
  },

  recordGauge: (name: string, value: number, labels?: Record<string, string>) => {
    metricsRegistry.getDefault().recordGauge(name, value, labels);
  },

  recordHistogram: (name: string, value: number, labels?: Record<string, string>) => {
    metricsRegistry.getDefault().recordHistogram(name, value, labels);
  },

  recordDuration: async <T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      metricsRegistry.getDefault().recordHistogram(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      metricsRegistry.getDefault().recordHistogram(name, duration, {
        ...labels,
        error: 'true',
      });
      throw error;
    }
  },
};
