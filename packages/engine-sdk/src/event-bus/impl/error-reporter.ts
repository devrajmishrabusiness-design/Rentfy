import { EngineError, EngineErrorCode } from '../../errors';
import type { EngineError as EngineErrorType } from '../../errors';
import type { HandlerErrorContext, HandlerErrorReporter } from '../interfaces/bus';

export class DefaultHandlerErrorReporter {
  private readonly logger: HandlerErrorReporter | undefined;
  private readonly captured: { context: HandlerErrorContext; error: EngineErrorType }[] = [];
  private readonly captureEnabled: boolean;

  constructor(options?: { logger?: HandlerErrorReporter; capture?: boolean }) {
    this.logger = options?.logger;
    this.captureEnabled = options?.capture === true;
  }

  readonly report: HandlerErrorReporter = (error: EngineError, context: HandlerErrorContext) => {
    if (this.captureEnabled) {
      this.captured.push({ context, error });
    }
    this.logger?.(error, context);
  };

  static fromUnknown(
    type: string,
    unknown: unknown,
    context: HandlerErrorContext,
  ): EngineError {
    const cause = unknown instanceof Error ? unknown : undefined;
    const message = cause ? cause.message : 'Unknown handler error';

    return new EngineError(
      EngineErrorCode.PLUGIN_EXECUTION_FAILED,
      `Event handler for "${type}" failed: ${message}`,
      {
        metadata: {
          eventType: type,
          eventId: context.event.id,
          subscriptionId: context.subscriptionId,
          handlerSource: context.event.source,
          correlationId: context.event.correlationId,
        },
        cause,
      },
    );
  }

  getCaptured(): ReadonlyArray<{ context: HandlerErrorContext; error: EngineErrorType }> {
    return [...this.captured];
  }

  clearCaptured(): void {
    this.captured.length = 0;
  }
}
