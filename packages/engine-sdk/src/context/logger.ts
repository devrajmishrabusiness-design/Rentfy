import type { PluginLogger } from '../types';

export interface EngineLogger extends PluginLogger {
  child(meta: Record<string, unknown>): PluginLogger;
}

export class DefaultEngineLogger implements EngineLogger {
  private prefix: string;
  private context: Record<string, unknown>;

  constructor(prefix: string, context: Record<string, unknown> = {}) {
    this.prefix = prefix;
    this.context = context;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  child(meta: Record<string, unknown>): PluginLogger {
    return new DefaultEngineLogger(this.prefix, { ...this.context, ...meta });
  }

  private log(level: string, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      prefix: this.prefix,
      message,
      context: { ...this.context, ...meta },
    };

    switch (level) {
      case 'debug':
      case 'info':
        console.log(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }
}