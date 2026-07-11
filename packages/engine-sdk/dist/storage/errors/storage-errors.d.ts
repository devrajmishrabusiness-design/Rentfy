import { BaseEngineError, EngineErrorCode } from '../../errors';
export declare class StorageError extends BaseEngineError {
    readonly providerName?: string;
    constructor(code: EngineErrorCode, message: string, options?: {
        providerName?: string;
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
export declare class StorageTransactionError extends StorageError {
    readonly transactionPhase: 'begin' | 'commit' | 'rollback';
    constructor(phase: 'begin' | 'commit' | 'rollback', code: EngineErrorCode, message: string, options?: {
        providerName?: string;
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
export declare class StorageNotFoundError extends StorageError {
    readonly itemId: string;
    readonly collection: string;
    constructor(collection: string, itemId: string, options?: {
        providerName?: string;
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
export declare class StorageValidationError extends StorageError {
    readonly collection: string;
    readonly violations: string[];
    constructor(collection: string, violations: string[], options?: {
        providerName?: string;
        metadata?: Record<string, unknown>;
        cause?: Error;
    });
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=storage-errors.d.ts.map