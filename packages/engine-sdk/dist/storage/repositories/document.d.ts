import type { StorageProvider } from '../interfaces/provider';
import type { DocumentRepository } from '../interfaces/repository';
import type { DocumentModel } from '../models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from '../models/query';
export declare class GenericDocumentRepository<T = unknown> implements DocumentRepository<DocumentModel<T>> {
    readonly collection: string;
    readonly provider: StorageProvider;
    constructor(collection: string, provider: StorageProvider);
    create(item: DocumentModel<T>): Promise<DocumentModel<T>>;
    save(item: DocumentModel<T>): Promise<DocumentModel<T>>;
    update(id: string, updates: Partial<DocumentModel<T>>): Promise<DocumentModel<T> | null>;
    delete(id: string): Promise<boolean>;
    findById(id: string): Promise<DocumentModel<T> | null>;
    find(options?: QueryOptions<DocumentModel<T>>): Promise<RepositoryQueryResult<DocumentModel<T>>>;
    query(filter: QueryFilter<DocumentModel<T>>): Promise<DocumentModel<T>[]>;
    clear(): Promise<void>;
    search(query: string, fields: (keyof DocumentModel<T>)[]): Promise<DocumentModel<T>[]>;
    count(filter?: QueryFilter<DocumentModel<T>>): Promise<number>;
    private getAllItems;
}
//# sourceMappingURL=document.d.ts.map