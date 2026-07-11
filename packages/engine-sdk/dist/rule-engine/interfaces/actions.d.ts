import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import type { JobQueue } from '../../job-queue/interfaces/queue';
import type { PluginLogger } from '../../types';
export type ActionType = 'publishEvent' | 'enqueueJob' | 'logMessage' | 'delay' | 'stopEvaluation';
export interface ActionDefinition {
    readonly type: ActionType;
    readonly config: Record<string, unknown>;
    readonly timeout?: number;
    readonly retryCount?: number;
}
export interface ActionContext {
    readonly ruleId: string;
    readonly event: {
        readonly type: string;
        readonly payload: unknown;
        readonly timestamp: number;
        readonly source?: string;
        readonly metadata?: Readonly<Record<string, unknown>>;
    };
    readonly eventBus: PlatformEventBus;
    readonly jobQueue: JobQueue;
    readonly logger: PluginLogger;
    readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ActionExecutor {
    execute(action: ActionDefinition, context: ActionContext): Promise<void>;
}
//# sourceMappingURL=actions.d.ts.map