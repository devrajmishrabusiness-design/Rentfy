"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageValidationError = exports.StorageNotFoundError = exports.StorageTransactionError = exports.StorageError = exports.Storage = exports.GenericDocumentRepository = exports.GenericKeyValueRepository = exports.MemoryStorageProvider = void 0;
var memory_1 = require("./providers/memory");
Object.defineProperty(exports, "MemoryStorageProvider", { enumerable: true, get: function () { return memory_1.MemoryStorageProvider; } });
var key_value_1 = require("./repositories/key-value");
Object.defineProperty(exports, "GenericKeyValueRepository", { enumerable: true, get: function () { return key_value_1.GenericKeyValueRepository; } });
var document_1 = require("./repositories/document");
Object.defineProperty(exports, "GenericDocumentRepository", { enumerable: true, get: function () { return document_1.GenericDocumentRepository; } });
var storage_facade_1 = require("./storage-facade");
Object.defineProperty(exports, "Storage", { enumerable: true, get: function () { return storage_facade_1.Storage; } });
var storage_errors_1 = require("./errors/storage-errors");
Object.defineProperty(exports, "StorageError", { enumerable: true, get: function () { return storage_errors_1.StorageError; } });
Object.defineProperty(exports, "StorageTransactionError", { enumerable: true, get: function () { return storage_errors_1.StorageTransactionError; } });
Object.defineProperty(exports, "StorageNotFoundError", { enumerable: true, get: function () { return storage_errors_1.StorageNotFoundError; } });
Object.defineProperty(exports, "StorageValidationError", { enumerable: true, get: function () { return storage_errors_1.StorageValidationError; } });
//# sourceMappingURL=index.js.map