export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
  baggage: Record<string, string>;
}

export interface SpanAttributes {
  [key: string]: string | number | boolean;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: SpanAttributes;
}

export interface Span {
  readonly id: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly kind: SpanKind;
  readonly startTime: number;
  endTime?: number;
  status: 'unset' | 'ok' | 'error';
  statusMessage?: string;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanLink[];
  setAttribute(key: string, value: string | number | boolean): Span;
  addEvent(name: string, attributes?: SpanAttributes): Span;
  addLink(traceId: string, spanId: string, attributes?: SpanAttributes): Span;
  setStatus(status: 'ok' | 'error', message?: string): Span;
  end(): void;
  toContext(): TraceContext;
}

export interface Trace {
  readonly id: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  spans: Span[];
  status: 'unset' | 'ok' | 'error';
  setStatus(status: 'ok' | 'error', message?: string): void;
  end(): void;
  toSnapshot(): TraceSnapshot;
}

export interface TraceSnapshot {
  traceId: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'unset' | 'ok' | 'error';
  spans: SpanSnapshot[];
}

export interface SpanSnapshot {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'unset' | 'ok' | 'error';
  statusMessage?: string;
  attributes: SpanAttributes;
  events: Array<{ name: string; timestamp: number; attributes?: SpanAttributes }>;
}

export interface Tracer {
  startTrace(name: string, context?: Partial<TraceContext>): Trace;
  startSpan(name: string, context?: Partial<TraceContext>, kind?: SpanKind): Span;
  getContext(): TraceContext | null;
  setContext(context: TraceContext): void;
  clearContext(): void;
  activeTraces(): Trace[];
  activeSpans(): Span[];
  snapshot(): { traces: TraceSnapshot[]; activeSpans: SpanSnapshot[] };
}