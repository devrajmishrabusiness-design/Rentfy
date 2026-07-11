import type { StorageProvider } from './interfaces/provider';
import type { KeyValueModel, DocumentModel } from './models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from './models/query';
import { GenericKeyValueRepository } from './repositories/key-value';
import { GenericDocumentRepository } from './repositories/document';
export interface StorageOptions {
    provider?: StorageProvider;
    collections?: string[];
}
export declare class Storage {
    private readonly provider;
    private readonly kvRepos;
    private readonly docRepos;
    constructor(options?: StorageOptions);
    getProvider(): StorageProvider;
    registerKV(collection: string): GenericKeyValueRepository;
    registerDoc(collection: string): GenericDocumentRepository;
    create(collection: string, item: KeyValueModel | DocumentModel): Promise<KeyValueModel | DocumentModel>;
    save(collection: string, item: KeyValueModel | DocumentModel): Promise<KeyValueModel | DocumentModel>;
    update(collection: string, id: string, updates: Partial<KeyValueModel> | Partial<DocumentModel>): Promise<KeyValueModel | DocumentModel | null>;
    delete(collection: string, id: string): Promise<boolean>;
    findById(collection: string, id: string): Promise<KeyValueModel | DocumentModel | null>;
    find(collection: string, options?: QueryOptions): Promise<RepositoryQueryResult>;
    query(collection: string, filter: QueryFilter): Promise<Array<KeyValueModel | DocumentModel>>;
    clear(collection?: string): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
}
//# sourceMappingURL=storage-facade.d.ts.map