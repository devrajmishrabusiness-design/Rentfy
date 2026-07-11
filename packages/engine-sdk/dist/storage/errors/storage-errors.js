"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageValidationError = exports.StorageNotFoundError = exports.StorageTransactionError = exports.StorageError = void 0;
const errors_1 = require("../../errors");
class StorageError extends errors_1.BaseEngineError {
    providerName;
    constructor(code, message, options) {
        super(code, message, { metadata: options?.metadata, cause: options?.cause, category: 'storage' });
        this.name = 'StorageError';
        this.providerName = options?.providerName;
        Object.setPrototypeOf(this, StorageError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            providerName: this.providerName,
        };
    }
}
exports.StorageError = StorageError;
class StorageTransactionError extends StorageError {
    transactionPhase;
    constructor(phase, code, message, options) {
        super(code, message, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
        this.name = 'StorageTransactionError';
        this.transactionPhase = phase;
        Object.setPrototypeOf(this, StorageTransactionError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            transactionPhase: this.transactionPhase,
        };
    }
}
exports.StorageTransactionError = StorageTransactionError;
class StorageNotFoundError extends StorageError {
    itemId;
    collection;
    constructor(collection, itemId, options) {
        super(errors_1.EngineErrorCode.UNKNOWN_ERROR, `Item "${itemId}" not found in collection "${collection}"`, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
        this.name = 'StorageNotFoundError';
        this.itemId = itemId;
        this.collection = collection;
        Object.setPrototypeOf(this, StorageNotFoundError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            itemId: this.itemId,
            collection: this.collection,
        };
    }
}
exports.StorageNotFoundError = StorageNotFoundError;
class StorageValidationError extends StorageError {
    collection;
    violations;
    constructor(collection, violations, options) {
        super(errors_1.EngineErrorCode.CONFIG_VALIDATION_FAILED, `Validation failed in "${collection}": ${violations.join('; ')}`, { providerName: options?.providerName, metadata: options?.metadata, cause: options?.cause });
        this.name = 'StorageValidationError';
        this.collection = collection;
        this.violations = violations;
        Object.setPrototypeOf(this, StorageValidationError.prototype);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            collection: this.collection,
            violations: this.violations,
        };
    }
}
exports.StorageValidationError = StorageValidationError;
//# sourceMappingURL=storage-errors.js.map