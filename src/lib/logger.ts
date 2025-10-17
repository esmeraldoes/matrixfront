import { toast } from "@/hooks/use-toast";

type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type ErrorMetadata = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: ErrorMetadata;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogEntry(level: LogLevel, message: string, metadata?: ErrorMetadata, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      stack: error?.stack,
    };
  }

  private async persistLog(entry: LogEntry) {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    // In development, also console log
    if (import.meta.env.DEV) {
      const logFn = entry.level === 'error' ? console.error : 
                    entry.level === 'warn' ? console.warn : 
                    console.log;
      logFn(`[${entry.level.toUpperCase()}] ${entry.message}`, {
        metadata: entry.metadata,
        stack: entry.stack,
      });
    }

    // For errors, show toast notification
    if (entry.level === 'error') {
      toast({
        variant: "destructive",
        title: "Error",
        description: entry.message,
      });
    }

    // Send to backend logging endpoint
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        credentials: 'include',
      });
    } catch (e) {
      // Fallback to console if backend logging fails
      console.error('Failed to persist log to backend:', e);
    }
  }

  error(message: string, metadata?: ErrorMetadata, error?: Error) {
    const entry = this.createLogEntry('error', message, metadata, error);
    this.persistLog(entry);
  }

  warn(message: string, metadata?: ErrorMetadata) {
    const entry = this.createLogEntry('warn', message, metadata);
    this.persistLog(entry);
  }

  info(message: string, metadata?: ErrorMetadata) {
    const entry = this.createLogEntry('info', message, metadata);
    this.persistLog(entry);
  }

  debug(message: string, metadata?: ErrorMetadata) {
    const entry = this.createLogEntry('debug', message, metadata);
    this.persistLog(entry);
  }

  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }
}

export const logger = Logger.getInstance();