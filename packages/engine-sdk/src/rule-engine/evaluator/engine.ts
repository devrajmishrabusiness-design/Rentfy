import type { RuleEvaluationResult, EvaluationOptions, IRuleEngine, ActionResult } from '../interfaces/evaluation';
import type { RuleDefinition } from '../interfaces/rules';
import type { RuleRegistry } from '../interfaces/registry';
import type { ConditionEvaluator, ConditionContext } from '../interfaces/conditions';
import type { ActionExecutor, ActionContext } from '../interfaces/actions';
import type { PlatformEventBus } from '../../event-bus/interfaces/bus';
import type { JobQueue } from '../../job-queue/interfaces/queue';
import type { PluginLogger } from '../../types';
import { RuleEventType } from '../interfaces/events';
import { EngineErrorCode, EngineError } from '../../errors';
import { DefaultRuleRegistry } from '../registry/default-registry';
import { DefaultConditionEvaluator } from '../conditions/default-evaluator';
import { DefaultActionExecutor } from '../actions/default-executor';

export interface RuleEngineOptions {
  eventBus?: PlatformEventBus;
  jobQueue?: JobQueue;
  logger?: PluginLogger;
  registry?: RuleRegistry;
  conditionEvaluator?: ConditionEvaluator;
  actionExecutor?: ActionExecutor;
}

export class RuleEngine implements IRuleEngine {
  readonly registry: RuleRegistry;
  readonly conditionEvaluator: ConditionEvaluator;
  readonly actionExecutor: ActionExecutor;
  private readonly eventBus?: PlatformEventBus;
  private readonly jobQueue?: JobQueue;
  private readonly logger: PluginLogger;

  constructor(options: RuleEngineOptions = {}) {
    this.registry = options.registry ?? new DefaultRuleRegistry();
    this.conditionEvaluator = options.conditionEvaluator ?? new DefaultConditionEvaluator();
    this.actionExecutor = options.actionExecutor ?? new DefaultActionExecutor();
    this.eventBus = options.eventBus;
    this.jobQueue = options.jobQueue;
    this.logger = options.logger ?? createNilLogger();
  }

  async evaluate<TPayload = unknown>(
    eventType: string,
    payload: TPayload,
    options: EvaluationOptions = {},
  ): Promise<RuleEvaluationResult[]> {
    const rules = this.findMatchingRules(eventType);
    if (rules.length === 0) return [];

    rules.sort((a, b) => b.priority - a.priority);

    const conditionContext: ConditionContext = {
      event: {
        type: eventType,
        payload: payload as unknown,
        timestamp: Date.now(),
        metadata: options.metadata,
      },
      metadata: options.metadata ?? {},
    };

    const results: RuleEvaluationResult[] = [];

    for (const rule of rules) {
      if (!rule.enabled) {
        results.push(createSkippedResult(rule, 'disabled'));
        this.logger.debug(`Rule ${rule.id} skipped — disabled`);
        continue;
      }

      const triggerFilter = rule.trigger.filter;
      if (triggerFilter) {
        const filterMatch = this.conditionEvaluator.evaluate(triggerFilter, conditionContext);
        if (!filterMatch) {
          results.push(createSkippedResult(rule, 'filter_mismatch'));
          this.logger.debug(`Rule ${rule.id} skipped — trigger filter mismatch`);
          continue;
        }
      }

      publishRuleEvent(this.eventBus, RuleEventType.RuleTriggered, rule, eventType, payload as unknown);

      const evalStart = Date.now();

      const conditionsMet = this.conditionEvaluator.evaluate(rule.conditions, conditionContext);

      if (!conditionsMet) {
        const result: RuleEvaluationResult = {
          ruleId: rule.id,
          success: false,
          skipped: true,
          reason: 'conditions_not_met',
          actionResults: [],
          executionTime: Date.now() - evalStart,
        };
        results.push(result);
        publishRuleEvent(this.eventBus, RuleEventType.RuleSkipped, rule, eventType, payload as unknown);
        this.logger.debug(`Rule ${rule.id} skipped — conditions not met`);
        continue;
      }

      const actionResults: ActionResult[] = [];
      let ruleSucceeded = true;
      let stopRequested = false;

      const actionContext: ActionContext = {
        ruleId: rule.id,
        event: {
          type: eventType,
          payload: payload as unknown,
          timestamp: Date.now(),
          metadata: options.metadata,
        },
        eventBus: this.eventBus ?? createNilEventBus(),
        jobQueue: this.jobQueue ?? createNilJobQueue(),
        logger: this.logger,
        metadata: options.metadata ?? {},
      };

      for (const action of rule.actions) {
        const actStart = Date.now();
        try {
          await this.actionExecutor.execute(action, actionContext);
          actionResults.push({
            ruleId: rule.id,
            actionType: action.type,
            success: true,
            executionTime: Date.now() - actStart,
          });

          if (action.type === 'stopEvaluation') {
            stopRequested = true;
          }
        } catch (error: unknown) {
          const err = toRuleError(rule.id, error);
          actionResults.push({
            ruleId: rule.id,
            actionType: action.type,
            success: false,
            error: err,
            executionTime: Date.now() - actStart,
          });
          ruleSucceeded = false;
          this.logger.error(`Rule ${rule.id} action ${action.type} failed: ${err.message}`);
        }
      }

      const result: RuleEvaluationResult = {
        ruleId: rule.id,
        success: ruleSucceeded,
        skipped: false,
        actionResults,
        executionTime: Date.now() - evalStart,
      };

      results.push(result);

      if (ruleSucceeded) {
        publishRuleEvent(this.eventBus, RuleEventType.RuleSucceeded, rule, eventType, payload as unknown);
      } else {
        publishRuleEvent(this.eventBus, RuleEventType.RuleFailed, rule, eventType, payload as unknown);
      }

      if (stopRequested || (options.abortOnFailure && !ruleSucceeded)) {
        this.logger.info(`Rule evaluation stopped — rule ${rule.id}`);
        break;
      }
    }

    return results;
  }

  private findMatchingRules(eventType: string): RuleDefinition[] {
    return this.registry.getEnabledRules().filter((rule) => rule.trigger.eventType === eventType);
  }
}

function createSkippedResult(rule: RuleDefinition, reason: string): RuleEvaluationResult {
  return {
    ruleId: rule.id,
    success: false,
    skipped: true,
    reason,
    actionResults: [],
    executionTime: 0,
  };
}

function publishRuleEvent(
  eventBus: PlatformEventBus | undefined,
  eventType: string,
  rule: RuleDefinition,
  triggerEventType: string,
  payload: unknown,
): void {
  if (!eventBus) return;
  eventBus.publish(eventType, {
    ruleId: rule.id,
    ruleName: rule.name,
    triggerEventType,
    payload,
  }, {
    source: 'rule-engine',
    metadata: {
      ruleId: rule.id,
      ruleName: rule.name,
      eventType,
    },
  });
}

function toRuleError(ruleId: string, error: unknown): EngineError {
  if (error instanceof EngineError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new EngineError(EngineErrorCode.PLUGIN_EXECUTION_FAILED, message, {
    metadata: { ruleId },
    cause: error instanceof Error ? error : undefined,
  });
}

function createNilLogger(): PluginLogger {
  const noop = () => {};
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => createNilLogger(),
  } as PluginLogger;
}

function createNilEventBus(): PlatformEventBus {
  return {
    publish: () => ({ id: '', type: '', timestamp: 0, source: '', correlationId: '', version: 0, payload: undefined }),
    publishEvent: (e: object) => e as ReturnType<PlatformEventBus['publishEvent']>,
    subscribe: () => ({ id: '', type: '', unsubscribe: () => {} }),
    once: () => ({ id: '', type: '', unsubscribe: () => {} }),
    unsubscribe: () => false,
    unsubscribeAll: () => 0,
    clear: () => {},
    listenerCount: () => 0,
    hasListeners: () => false,
    eventTypes: () => [],
    setErrorReporter: () => {},
  } as unknown as PlatformEventBus;
}

function createNilJobQueue(): JobQueue {
  return {
    enqueue: async () => ({ id: '', type: '', priority: 0, status: 'pending' as never, payload: undefined, metadata: { createdAt: 0, retryCount: 0, maxRetries: 0, timeout: 0 } }),
    dequeue: async () => undefined,
    cancel: async () => false,
    retry: async () => undefined,
    getJob: () => undefined,
    getJobs: () => [],
    clear: async () => {},
    pause: () => {},
    resume: () => {},
    stats: () => ({ total: 0, pending: 0, scheduled: 0, running: 0, completed: 0, failed: 0, cancelled: 0, timedOut: 0 }),
    worker: { isRunning: false, isPaused: false, concurrency: 0, start: async () => {}, stop: async () => {}, pause: () => {}, resume: () => {}, stats: () => ({ active: 0, idle: true, isRunning: false, isPaused: false }) },
    on: () => {},
    off: () => {},
  } as unknown as JobQueue;
}