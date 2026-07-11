import type { MetricsSnapshot } from './metrics';
export interface OpenTelemetryExporter {
    exportLogs(entries: Array<{
        timestamp: number;
        body: string;
        severityNumber: number;
    }>): Promise<void>;
    exportMetrics(snapshot: MetricsSnapshot): Promise<void>;
    exportTraces(spans: Array<{
        traceId: string;
        spanId: string;
        parentSpanId?: string;
        name: string;
        startTime: number;
        endTime?: number;
        status: number;
    }>): Promise<void>;
}
export interface PrometheusExporter {
    registerMetric(name: string, type: 'counter' | 'gauge' | 'histogram', help: string, labelNames?: string[]): void;
    expose(): string;
}
export interface GrafanaExporter {
    pushMetrics(endpoint: string, snapshot: MetricsSnapshot, credentials?: {
        username: string;
        apiKey: string;
    }): Promise<void>;
}
export interface DatadogExporter {
    sendLogs(logs: Array<{
        message: string;
        status: string;
        timestamp: number;
        ddsource: string;
        service: string;
    }>): Promise<void>;
    sendMetrics(metrics: Array<{
        metric: string;
        points: Array<[number, number]>;
        type: string;
        tags: string[];
    }>): Promise<void>;
    sendSpans(spans: Array<{
        name: string;
        service: string;
        resource: string;
        traceId: string;
        spanId: string;
        parentId?: string;
        start: number;
        duration: number;
        error?: number;
    }>): Promise<void>;
}
export interface CloudWatchExporter {
    putMetricData(namespace: string, metrics: Array<{
        metricName: string;
        value: number;
        unit: string;
        timestamp: Date;
        dimensions?: Array<{
            name: string;
            value: string;
        }>;
    }>): Promise<void>;
    putLogEvents(logGroupName: string, logStreamName: string, events: Array<{
        timestamp: number;
        message: string;
    }>): Promise<void>;
}
export interface AzureMonitorExporter {
    trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void;
    trackMetric(name: string, value: number, properties?: Record<string, string>): void;
    trackTrace(message: string, severityLevel: number, properties?: Record<string, string>): void;
    trackException(exception: Error, properties?: Record<string, string>): void;
    flush(): Promise<void>;
}
//# sourceMappingURL=extensions.d.ts.map