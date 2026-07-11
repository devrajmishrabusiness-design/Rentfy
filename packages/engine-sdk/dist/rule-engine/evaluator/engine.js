"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const events_1 = require("../interfaces/events");
const errors_1 = require("../../errors");
const default_registry_1 = require("../registry/default-registry");
const default_evaluator_1 = require("../conditions/default-evaluator");
const default_executor_1 = require("../actions/default-executor");
class RuleEngine {
    registry;
    conditionEvaluator;
    actionExecutor;
    eventBus;
    jobQueue;
    logger;
    constructor(options = {}) {
        this.registry = options.registry ?? new default_registry_1.DefaultRuleRegistry();
        this.conditionEvaluator = options.conditionEvaluator ?? new default_evaluator_1.DefaultConditionEvaluator();
        this.actionExecutor = options.actionExecutor ?? new default_executor_1.DefaultActionExecutor();
        this.eventBus = options.eventBus;
        this.jobQueue = options.jobQueue;
        this.logger = options.logger ?? createNilLogger();
    }
    async evaluate(eventType, payload, options = {}) {
        const rules = this.findMatchingRules(eventType);
        if (rules.length === 0)
            return [];
        rules.sort((a, b) => b.priority - a.priority);
        const conditionContext = {
            event: {
                type: eventType,
                payload: payload,
                timestamp: Date.now(),
                metadata: options.metadata,
            },
            metadata: options.metadata ?? {},
        };
        const results = [];
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
            publishRuleEvent(this.eventBus, events_1.RuleEventType.RuleTriggered, rule, eventType, payload);
            const evalStart = Date.now();
            const conditionsMet = this.conditionEvaluator.evaluate(rule.conditions, conditionContext);
            if (!conditionsMet) {
                const result = {
                    ruleId: rule.id,
                    success: false,
                    skipped: true,
                    actionResults: [],
                    executionTime: Date.now() - evalStart,
                };
                results.push(result);
                publishRuleEvent(this.eventBus, events_1.RuleEventType.RuleSkipped, rule, eventType, payload);
                this.logger.debug(`Rule ${rule.id} skipped — conditions not met`);
                continue;
            }
            const actionResults = [];
            let ruleSucceeded = true;
            let stopRequested = false;
            const actionContext = {
                ruleId: rule.id,
                event: {
                    type: eventType,
                    payload: payload,
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
                }
                catch (error) {
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
            const result = {
                ruleId: rule.id,
                success: ruleSucceeded,
                skipped: false,
                actionResults,
                executionTime: Date.now() - evalStart,
            };
            results.push(result);
            if (ruleSucceeded) {
                publishRuleEvent(this.eventBus, events_1.RuleEventType.RuleSucceeded, rule, eventType, payload);
            }
            else {
                publishRuleEvent(this.eventBus, events_1.RuleEventType.RuleFailed, rule, eventType, payload);
            }
            if (stopRequested || (options.abortOnFailure && !ruleSucceeded)) {
                this.logger.info(`Rule evaluation stopped — rule ${rule.id}`);
                break;
            }
        }
        return results;
    }
    findMatchingRules(eventType) {
        return this.registry.getEnabledRules().filter((rule) => rule.trigger.eventType === eventType);
    }
}
exports.RuleEngine = RuleEngine;
function createSkippedResult(rule, _reason) {
    return {
        ruleId: rule.id,
        success: false,
        skipped: true,
        actionResults: [],
        executionTime: 0,
    };
}
function publishRuleEvent(eventBus, eventType, rule, triggerEventType, payload) {
    if (!eventBus)
        return;
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
function toRuleError(ruleId, error) {
    if (error instanceof errors_1.EngineError)
        return error;
    const message = error instanceof Error ? error.message : String(error);
    return new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_EXECUTION_FAILED, message, {
        metadata: { ruleId },
        cause: error instanceof Error ? error : undefined,
    });
}
function createNilLogger() {
    const noop = () => { };
    return {
        debug: noop,
        info: noop,
        warn: noop,
        error: noop,
        child: () => createNilLogger(),
    };
}
function createNilEventBus() {
    return {
        publish: () => ({ id: '', type: '', timestamp: 0, source: '', correlationId: '', version: 0, payload: undefined }),
        publishEvent: (e) => e,
        subscribe: () => ({ id: '', type: '', unsubscribe: () => { } }),
        once: () => ({ id: '', type: '', unsubscribe: () => { } }),
        unsubscribe: () => false,
        unsubscribeAll: () => 0,
        clear: () => { },
        listenerCount: () => 0,
        hasListeners: () => false,
        eventTypes: () => [],
        setErrorReporter: () => { },
    };
}
function createNilJobQueue() {
    return {
        enqueue: async () => ({ id: '', type: '', priority: 0, status: 'pending', payload: undefined, metadata: { createdAt: 0, retryCount: 0, maxRetries: 0, timeout: 0 } }),
        dequeue: async () => undefined,
        cancel: async () => false,
        retry: async () => undefined,
        getJob: () => undefined,
        getJobs: () => [],
        clear: async () => { },
        pause: () => { },
        resume: () => { },
        stats: () => ({ total: 0, pending: 0, scheduled: 0, running: 0, completed: 0, failed: 0, cancelled: 0, timedOut: 0 }),
        worker: { isRunning: false, isPaused: false, concurrency: 0, start: async () => { }, stop: async () => { }, pause: () => { }, resume: () => { }, stats: () => ({ active: 0, idle: true, isRunning: false, isPaused: false }) },
        on: () => { },
        off: () => { },
    };
}
//# sourceMappingURL=engine.js.map