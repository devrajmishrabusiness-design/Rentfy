"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultActionExecutor = void 0;
class DefaultActionExecutor {
    async execute(action, context) {
        switch (action.type) {
            case 'publishEvent': {
                const eventType = action.config['eventType'];
                const payload = action.config['payload'];
                if (eventType) {
                    context.eventBus.publish(eventType, payload ?? {}, {
                        source: 'rule-engine',
                        metadata: {
                            ruleId: context.ruleId,
                            eventType: context.event.type,
                        },
                    });
                }
                break;
            }
            case 'enqueueJob': {
                const jobType = action.config['jobType'];
                const jobPayload = action.config['jobPayload'] ?? {};
                const jobOptions = action.config['jobOptions'] ?? {};
                if (jobType) {
                    await context.jobQueue.enqueue(jobType, jobPayload, {
                        priority: jobOptions['priority'],
                        delay: jobOptions['delay'],
                        timeout: jobOptions['timeout'],
                        maxRetries: jobOptions['maxRetries'],
                        metadata: {
                            ruleId: context.ruleId,
                            eventType: context.event.type,
                            ...(jobOptions['metadata'] ?? {}),
                        },
                    });
                }
                break;
            }
            case 'logMessage': {
                const level = action.config['level'] ?? 'info';
                const message = action.config['message'] ?? '';
                const meta = action.config['meta'] ?? {};
                context.logger[level](message, { ruleId: context.ruleId, ...meta });
                break;
            }
            case 'delay': {
                const ms = action.config['ms'] ?? 0;
                if (ms > 0) {
                    await new Promise((resolve) => setTimeout(resolve, ms));
                }
                break;
            }
            case 'stopEvaluation': {
                break;
            }
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
}
exports.DefaultActionExecutor = DefaultActionExecutor;
//# sourceMappingURL=default-executor.js.map