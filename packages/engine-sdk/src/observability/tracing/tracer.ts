import type { Tracer, Trace, Span, TraceContext, SpanKind, SpanAttributes, TraceSnapshot, SpanSnapshot } from '../interfaces/tracing';
import { generateId } from '../utils/id-generator';

class DefaultSpan implements Span {
  readonly id: string;
  readonly traceId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly kind: SpanKind;
  readonly startTime: number;
  endTime?: number;
  status: 'unset' | 'ok' | 'error' = 'unset';
  statusMessage?: string;
  attributes: SpanAttributes = {};
  events: Array<{ name: string; timestamp: number; attributes?: SpanAttributes }> = [];
  links: Array<{ traceId: string; spanId: string; attributes?: SpanAttributes }> = [];

  constructor(traceId: string, name: string, kind: SpanKind, parentSpanId?: string) {
    this.id = generateId();
    this.traceId = traceId;
    this.name = name;
    this.kind = kind;
    this.parentSpanId = parentSpanId;
    this.startTime = Date.now();
  }

  setAttribute(key: string, value: string | number | boolean): Span {
    this.attributes[key] = value;
    return this;
  }

  addEvent(name: string, attributes?: SpanAttributes): Span {
    this.events.push({ name, timestamp: Date.now(), attributes });
    return this;
  }

  addLink(traceId: string, spanId: string, attributes?: SpanAttributes): Span {
    this.links.push({ traceId, spanId, attributes });
    return this;
  }

  setStatus(status: 'ok' | 'error', message?: string): Span {
    this.status = status;
    if (message !== undefined) {
      this.statusMessage = message;
    }
    return this;
  }

  end(): void {
    this.endTime = Date.now();
  }

  toContext(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.id,
      parentSpanId: this.parentSpanId,
      sampled: true,
      baggage: {},
    };
  }
}

class DefaultTrace implements Trace {
  readonly id: string;
  readonly name: string;
  readonly startTime: number;
  endTime?: number;
  spans: Span[] = [];
  status: 'unset' | 'ok' | 'error' = 'unset';
  private statusMessage?: string;

  constructor(name: string) {
    this.id = generateId();
    this.name = name;
    this.startTime = Date.now();
  }

  setStatus(status: 'ok' | 'error', message?: string): void {
    this.status = status;
    this.statusMessage = message;
  }

  end(): void {
    this.endTime = Date.now();
  }

  toSnapshot(): TraceSnapshot {
    return {
      traceId: this.id,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.endTime ? this.endTime - this.startTime : undefined,
      status: this.status,
      spans: this.spans.map((s) => ({
        spanId: s.id,
        traceId: s.traceId,
        parentSpanId: s.parentSpanId,
        name: s.name,
        kind: s.kind,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMs: s.endTime ? s.endTime - s.startTime : undefined,
        status: s.status,
        statusMessage: s.statusMessage,
        attributes: { ...s.attributes },
        events: s.events.map((e) => ({ name: e.name, timestamp: e.timestamp, attributes: e.attributes })),
      })),
    };
  }
}

export class DefaultTracer implements Tracer {
  private currentContext: TraceContext | null = null;
  private traces: Trace[] = [];
  private spans: Span[] = [];

  startTrace(name: string, context?: Partial<TraceContext>): Trace {
    const trace = new DefaultTrace(name);
    this.traces.push(trace);
    const span = new DefaultSpan(trace.id, name, 'internal');
    this.spans.push(span);
    trace.spans.push(span);
    const traceContext: TraceContext = context
      ? {
          traceId: context.traceId ?? trace.id,
          spanId: context.spanId ?? span.id,
          parentSpanId: context.parentSpanId,
          sampled: context.sampled ?? true,
          baggage: context.baggage ?? {},
        }
      : span.toContext();
    this.currentContext = traceContext;
    return trace;
  }

  startSpan(name: string, context?: Partial<TraceContext>, kind: SpanKind = 'internal'): Span {
    const traceId = context?.traceId ?? this.currentContext?.traceId ?? generateId();
    const parentSpanId = context?.parentSpanId ?? this.currentContext?.spanId;
    const span = new DefaultSpan(traceId, name, kind, parentSpanId);
    this.spans.push(span);
    this.currentContext = span.toContext();
    return span;
  }

  getContext(): TraceContext | null {
    return this.currentContext;
  }

  setContext(context: TraceContext): void {
    this.currentContext = context;
  }

  clearContext(): void {
    this.currentContext = null;
  }

  activeTraces(): Trace[] {
    return this.traces.filter((t) => !t.endTime);
  }

  activeSpans(): Span[] {
    return this.spans.filter((s) => !s.endTime);
  }

  snapshot(): { traces: TraceSnapshot[]; activeSpans: SpanSnapshot[] } {
    const traceSnapshots = this.traces.map((t) => t.toSnapshot());
    const spanSnapshots: SpanSnapshot[] = this.spans.map((s) => ({
      spanId: s.id,
      traceId: s.traceId,
      parentSpanId: s.parentSpanId,
      name: s.name,
      kind: s.kind,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMs: s.endTime ? s.endTime - s.startTime : undefined,
      status: s.status,
      statusMessage: s.statusMessage,
      attributes: { ...s.attributes },
      events: s.events.map((e) => ({ name: e.name, timestamp: e.timestamp, attributes: e.attributes })),
    }));
    return { traces: traceSnapshots, activeSpans: spanSnapshots };
  }
}