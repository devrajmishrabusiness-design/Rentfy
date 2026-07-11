import type { RuleEvaluationResult, EvaluationOptions, IRuleEngine } from '../interfaces/evaluation';
import type { RuleRegistry } from '../interfaces/registry';
import type { ConditionEvaluator } from '../interfaces/conditions';
import type { ActionExecutor } from '../interfaces/actions';
import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import type { JobQueue } from '../../job-queue/interfaces/queue';
import type { PluginLogger } from '../../types';
export interface RuleEngineOptions {
    eventBus?: PlatformEventBus;
    jobQueue?: JobQueue;
    logger?: PluginLogger;
    registry?: RuleRegistry;
    conditionEvaluator?: ConditionEvaluator;
    actionExecutor?: ActionExecutor;
}
export declare class RuleEngine implements IRuleEngine {
    readonly registry: RuleRegistry;
    readonly conditionEvaluator: ConditionEvaluator;
    readonly actionExecutor: ActionExecutor;
    private readonly eventBus?;
    private readonly jobQueue?;
    private readonly logger;
    constructor(options?: RuleEngineOptions);
    evaluate<TPayload = unknown>(eventType: string, payload: TPayload, options?: EvaluationOptions): Promise<RuleEvaluationResult[]>;
    private findMatchingRules;
}
//# sourceMappingURL=engine.d.ts.map