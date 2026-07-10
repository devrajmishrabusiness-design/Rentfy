export {
  type StorageProvider,
  type StorageSnapshot,
} from './interfaces/provider';

export {
  type Repository,
  type KeyValueRepository,
  type DocumentRepository,
} from './interfaces/repository';

export {
  type KeyValueModel,
  type DocumentModel,
  type StorageModel,
} from './models/base';

export {
  type QueryOperator,
  type QueryFilter,
  type QuerySort,
  type QueryOptions,
  type RepositoryQueryResult,
} from './models/query';

export { MemoryStorageProvider } from './providers/memory';

export { GenericKeyValueRepository } from './repositories/key-value';
export { GenericDocumentRepository } from './repositories/document';

export { Storage, type StorageOptions } from './storage-facade';

export {
  StorageError,
  StorageTransactionError,
  StorageNotFoundError,
  StorageValidationError,
} from './errors/storage-errors';