import { BaseEngineError, EngineErrorCode } from '../../errors';

export class StorageError extends BaseEngineError {
  public readonly providerName?: string;

  constructor(code: EngineErrorCode, message: string, options?: { providerName?: string; metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { metadata: options?.metadata, cause: options?.cause, category: 'storage' });
    this.name = 'StorageError';
    this.providerName = options?.providerName;
    Object.setPrototypeOf(this, StorageError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      providerName: this.providerName,
    };
  }
}

export class StorageTransactionError extends StorageError {
  public readonly transactionPhase: 'begin' | 'commit' | 'rollback';

  constructor(phase: 'begin' | 'commit' | 'rollback', code: EngineErrorCode, message: string, options?: { providerName?: string; metadata?: Record<string, unknown>; cause?: Error }) {
    super(code, message, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
    this.name = 'StorageTransactionError';
    this.transactionPhase = phase;
    Object.setPrototypeOf(this, StorageTransactionError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      transactionPhase: this.transactionPhase,
    };
  }
}

export class StorageNotFoundError extends StorageError {
  public readonly itemId: string;
  public readonly collection: string;

  constructor(collection: string, itemId: string, options?: { providerName?: string; metadata?: Record<string, unknown>; cause?: Error }) {
    super(EngineErrorCode.UNKNOWN_ERROR, `Item "${itemId}" not found in collection "${collection}"`, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
    this.name = 'StorageNotFoundError';
    this.itemId = itemId;
    this.collection = collection;
    Object.setPrototypeOf(this, StorageNotFoundError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      itemId: this.itemId,
      collection: this.collection,
    };
  }
}

export class StorageValidationError extends StorageError {
  public readonly collection: string;
  public readonly violations: string[];

  constructor(collection: string, violations: string[], options?: { providerName?: string; metadata?: Record<string, unknown>; cause?: Error }) {
    super(EngineErrorCode.CONFIG_VALIDATION_FAILED, `Validation failed in "${collection}": ${violations.join('; ')}`, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
    this.name = 'StorageValidationError';
    this.collection = collection;
    this.violations = violations;
    Object.setPrototypeOf(this, StorageValidationError.prototype);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      collection: this.collection,
      violations: this.violations,
    };
  }
}