import type { StructuredLogger, LogLevel, LogEntry, LogTransport, LogFormatter } from '../interfaces/logger';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  trace: 0,
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

const DEFAULT_FORMATTER: LogFormatter = (entry: LogEntry): string => {
  return JSON.stringify(entry);
};

export class DefaultStructuredLogger implements StructuredLogger {
  private minLevel: LogLevel;
  private transports: LogTransport[] = [];
  private bindings: Record<string, unknown>;
  private source: string;
  private formatter: LogFormatter;
  private traceId?: string;
  private spanId?: string;

  constructor(options?: {
    minLevel?: LogLevel;
    source?: string;
    bindings?: Record<string, unknown>;
    transports?: LogTransport[];
    formatter?: LogFormatter;
    traceId?: string;
    spanId?: string;
  }) {
    this.minLevel = options?.minLevel ?? 'trace';
    this.source = options?.source ?? 'default';
    this.bindings = options?.bindings ?? {};
    this.transports = options?.transports ?? [];
    this.formatter = options?.formatter ?? DEFAULT_FORMATTER;
    this.traceId = options?.traceId;
    this.spanId = options?.spanId;
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.write('trace', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>, err?: Error): void {
    this.write('error', message, meta, err);
  }

  fatal(message: string, meta?: Record<string, unknown>, err?: Error): void {
    this.write('fatal', message, meta, err);
  }

  child(bindings: Record<string, unknown>): StructuredLogger {
    return new DefaultStructuredLogger({
      minLevel: this.minLevel,
      source: this.source,
      transports: [...this.transports],
      formatter: this.formatter,
      bindings: { ...this.bindings, ...bindings },
      traceId: this.traceId,
      spanId: this.spanId,
    });
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  getLevel(): LogLevel {
    return this.minLevel;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  removeTransport(transport: LogTransport): void {
    const idx = this.transports.indexOf(transport);
    if (idx >= 0) {
      this.transports.splice(idx, 1);
    }
  }

  async flush(): Promise<void> {
    for (const transport of this.transports) {
      const result = transport.flush();
      if (result instanceof Promise) {
        await result;
      }
    }
  }

  setTraceContext(traceId: string, spanId: string): void {
    this.traceId = traceId;
    this.spanId = spanId;
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>, err?: Error): void {
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: { ...this.bindings, ...meta },
      source: this.source,
      traceId: this.traceId,
      spanId: this.spanId,
    };

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: (err as { cause?: { message?: string } }).cause?.message,
      };
    }

    for (const transport of this.transports) {
      transport.write(entry);
    }
  }
}

export class ConsoleLogTransport implements LogTransport {
  write(entry: LogEntry): void {
    const formatted = JSON.stringify(entry);
    switch (entry.level) {
      case 'fatal':
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
      case 'trace':
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  flush(): void {}
}