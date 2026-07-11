"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTracer = void 0;
const id_generator_1 = require("../utils/id-generator");
class DefaultSpan {
    id;
    traceId;
    parentSpanId;
    name;
    kind;
    startTime;
    endTime;
    status = 'unset';
    statusMessage;
    attributes = {};
    events = [];
    links = [];
    constructor(traceId, name, kind, parentSpanId) {
        this.id = (0, id_generator_1.generateId)();
        this.traceId = traceId;
        this.name = name;
        this.kind = kind;
        this.parentSpanId = parentSpanId;
        this.startTime = Date.now();
    }
    setAttribute(key, value) {
        this.attributes[key] = value;
        return this;
    }
    addEvent(name, attributes) {
        this.events.push({ name, timestamp: Date.now(), attributes });
        return this;
    }
    addLink(traceId, spanId, attributes) {
        this.links.push({ traceId, spanId, attributes });
        return this;
    }
    setStatus(status, message) {
        this.status = status;
        if (message !== undefined) {
            this.statusMessage = message;
        }
        return this;
    }
    end() {
        this.endTime = Date.now();
    }
    toContext() {
        return {
            traceId: this.traceId,
            spanId: this.id,
            parentSpanId: this.parentSpanId,
            sampled: true,
            baggage: {},
        };
    }
}
class DefaultTrace {
    id;
    name;
    startTime;
    endTime;
    spans = [];
    status = 'unset';
    statusMessage;
    constructor(name) {
        this.id = (0, id_generator_1.generateId)();
        this.name = name;
        this.startTime = Date.now();
    }
    setStatus(status, message) {
        this.status = status;
        this.statusMessage = message;
    }
    end() {
        this.endTime = Date.now();
    }
    toSnapshot() {
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
class DefaultTracer {
    currentContext = null;
    traces = [];
    spans = [];
    startTrace(name, context) {
        const trace = new DefaultTrace(name);
        this.traces.push(trace);
        const span = new DefaultSpan(trace.id, name, 'internal');
        this.spans.push(span);
        trace.spans.push(span);
        const traceContext = context
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
    startSpan(name, context, kind = 'internal') {
        const traceId = context?.traceId ?? this.currentContext?.traceId ?? (0, id_generator_1.generateId)();
        const parentSpanId = context?.parentSpanId ?? this.currentContext?.spanId;
        const span = new DefaultSpan(traceId, name, kind, parentSpanId);
        this.spans.push(span);
        this.currentContext = span.toContext();
        return span;
    }
    getContext() {
        return this.currentContext;
    }
    setContext(context) {
        this.currentContext = context;
    }
    clearContext() {
        this.currentContext = null;
    }
    activeTraces() {
        return this.traces.filter((t) => !t.endTime);
    }
    activeSpans() {
        return this.spans.filter((s) => !s.endTime);
    }
    snapshot() {
        const traceSnapshots = this.traces.map((t) => t.toSnapshot());
        const spanSnapshots = this.spans.map((s) => ({
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
exports.DefaultTracer = DefaultTracer;
//# sourceMappingURL=tracer.js.map