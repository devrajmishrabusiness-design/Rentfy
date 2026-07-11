import type { StorageProvider } from '../interfaces/provider';
import type { KeyValueRepository } from '../interfaces/repository';
import type { KeyValueModel } from '../models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from '../models/query';
export declare class GenericKeyValueRepository<T = unknown> implements KeyValueRepository<KeyValueModel<T>> {
    readonly collection: string;
    readonly provider: StorageProvider;
    constructor(collection: string, provider: StorageProvider);
    create(item: KeyValueModel<T>): Promise<KeyValueModel<T>>;
    save(item: KeyValueModel<T>): Promise<KeyValueModel<T>>;
    update(id: string, updates: Partial<KeyValueModel<T>>): Promise<KeyValueModel<T> | null>;
    delete(id: string): Promise<boolean>;
    findById(id: string): Promise<KeyValueModel<T> | null>;
    find(options?: QueryOptions<KeyValueModel<T>>): Promise<RepositoryQueryResult<KeyValueModel<T>>>;
    query(filter: QueryFilter<KeyValueModel<T>>): Promise<KeyValueModel<T>[]>;
    clear(): Promise<void>;
    getValue<K extends keyof KeyValueModel<T>>(id: string, field: K): Promise<KeyValueModel<T>[K] | null>;
    setValue<K extends keyof KeyValueModel<T>>(id: string, field: K, value: KeyValueModel<T>[K]): Promise<void>;
    private getAllItems;
}
//# sourceMappingURL=key-value.d.ts.map