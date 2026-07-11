import type { StorageProvider } from './provider';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from '../models/query';
export interface Repository<T> {
    readonly collection: string;
    readonly provider: StorageProvider;
    create(item: T): Promise<T>;
    save(item: T): Promise<T>;
    update(id: string, updates: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    findById(id: string): Promise<T | null>;
    find(options?: QueryOptions<T>): Promise<RepositoryQueryResult<T>>;
    query(filter: QueryFilter<T>): Promise<T[]>;
    clear(): Promise<void>;
}
export interface KeyValueRepository<T> extends Repository<T> {
    getValue<K extends keyof T>(id: string, field: K): Promise<T[K] | null>;
    setValue<K extends keyof T>(id: string, field: K, value: T[K]): Promise<void>;
}
export interface DocumentRepository<T> extends Repository<T> {
    search(query: string, fields: (keyof T)[]): Promise<T[]>;
    count(filter?: QueryFilter<T>): Promise<number>;
}
//# sourceMappingURL=repository.d.ts.map