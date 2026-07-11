import type { PluginLogger } from '../types';
import {
  DefaultStructuredLogger,
  ConsoleLogTransport,
  type StructuredLogger,
} from '../observability';

export interface EngineLogger extends PluginLogger {
  child(meta: Record<string, unknown>): PluginLogger;
}

export class DefaultEngineLogger implements EngineLogger {
  private readonly prefix: string;
  private readonly context: Record<string, unknown>;
  private readonly logger: StructuredLogger;

  constructor(prefix: string, context: Record<string, unknown> = {}) {
    this.prefix = prefix;
    this.context = context;
    this.logger = new DefaultStructuredLogger({
      source: prefix,
      bindings: context,
      transports: [new ConsoleLogTransport()],
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  child(meta: Record<string, unknown>): PluginLogger {
    return new DefaultEngineLogger(this.prefix, { ...this.context, ...meta });
  }
}
