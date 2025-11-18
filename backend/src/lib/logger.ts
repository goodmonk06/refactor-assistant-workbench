/**
 * Structured logging utility
 *
 * Features:
 * - Correlation IDs for request tracking
 * - Contextual metadata
 * - Log levels with filtering
 * - JSON output for production
 * - Pretty output for development
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  codebaseId?: string;
  scanId?: string;
  planId?: string;
  taskId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private context: LogContext = {};

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.minLevel);
    child.context = { ...this.context, ...context };
    return child;
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          },
        }
      : undefined;

    this.log('error', message, { ...context, ...errorContext });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    };

    const output = this.format(entry);
    this.write(level, output);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  private format(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }

    // Pretty format for development
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    return `[${timestamp}] ${level} ${entry.message}${context}`;
  }

  private write(level: LogLevel, message: string): void {
    if (level === 'error') {
      console.error(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Global logger instance
export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
);

/**
 * Express/Fastify middleware for request logging
 */
export function requestLogger() {
  return async (request: any, reply: any, next?: any) => {
    const requestId = request.headers['x-request-id'] || generateRequestId();
    const start = Date.now();

    logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
    });

    // Add request ID to context for this request
    request.log = logger.child({ requestId });

    const done = () => {
      const duration = Date.now() - start;
      logger.info('Request completed', {
        requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
      });
    };

    if (reply.then) {
      // Fastify
      reply.then(done);
    } else {
      // Express
      reply.on('finish', done);
    }

    if (next) {
      next();
    }
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
