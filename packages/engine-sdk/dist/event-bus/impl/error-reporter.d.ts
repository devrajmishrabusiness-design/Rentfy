import { EngineError } from '../../errors';
import type { EngineError as EngineErrorType } from '../../errors';
import type { HandlerErrorContext, HandlerErrorReporter } from '../interfaces/bus';
export declare class DefaultHandlerErrorReporter {
    private readonly logger;
    private readonly captured;
    private readonly captureEnabled;
    constructor(options?: {
        logger?: HandlerErrorReporter;
        capture?: boolean;
    });
    readonly report: HandlerErrorReporter;
    static fromUnknown(type: string, unknown: unknown, context: HandlerErrorContext): EngineError;
    getCaptured(): ReadonlyArray<{
        context: HandlerErrorContext;
        error: EngineErrorType;
    }>;
    clearCaptured(): void;
}
//# sourceMappingURL=error-reporter.d.ts.map