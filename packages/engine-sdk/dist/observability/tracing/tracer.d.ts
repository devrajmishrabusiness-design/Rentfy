import type { Tracer, Trace, Span, TraceContext, SpanKind, TraceSnapshot, SpanSnapshot } from '../interfaces/tracing';
export declare class DefaultTracer implements Tracer {
    private currentContext;
    private traces;
    private spans;
    startTrace(name: string, context?: Partial<TraceContext>): Trace;
    startSpan(name: string, context?: Partial<TraceContext>, kind?: SpanKind): Span;
    getContext(): TraceContext | null;
    setContext(context: TraceContext): void;
    clearContext(): void;
    activeTraces(): Trace[];
    activeSpans(): Span[];
    snapshot(): {
        traces: TraceSnapshot[];
        activeSpans: SpanSnapshot[];
    };
}
//# sourceMappingURL=tracer.d.ts.map