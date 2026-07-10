import type { ActionExecutor, ActionDefinition, ActionContext } from '../interfaces/actions';

export class DefaultActionExecutor implements ActionExecutor {
  async execute(action: ActionDefinition, context: ActionContext): Promise<void> {
    switch (action.type) {
      case 'publishEvent': {
        const eventType = action.config['eventType'] as string | undefined;
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
        const jobType = action.config['jobType'] as string | undefined;
        const jobPayload = action.config['jobPayload'] ?? {};
        const jobOptions: Record<string, unknown> = (action.config['jobOptions'] as Record<string, unknown>) ?? {};
        if (jobType) {
          await context.jobQueue.enqueue(jobType, jobPayload, {
            priority: (jobOptions['priority'] as number | undefined),
            delay: (jobOptions['delay'] as number | undefined),
            timeout: (jobOptions['timeout'] as number | undefined),
            maxRetries: (jobOptions['maxRetries'] as number | undefined),
            metadata: {
              ruleId: context.ruleId,
              eventType: context.event.type,
              ...(jobOptions['metadata'] as Record<string, unknown> ?? {}),
            },
          });
        }
        break;
      }

      case 'logMessage': {
        const level = (action.config['level'] as string | undefined) ?? 'info';
        const message = (action.config['message'] as string | undefined) ?? '';
        const meta = (action.config['meta'] as Record<string, unknown> | undefined) ?? {};
        context.logger[level as 'debug' | 'info' | 'warn' | 'error'](message, { ruleId: context.ruleId, ...meta });
        break;
      }

      case 'delay': {
        const ms = (action.config['ms'] as number | undefined) ?? 0;
        if (ms > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, ms));
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