import type { StorageProvider, StorageSnapshot } from '../interfaces/provider';
export declare class MemoryStorageProvider implements StorageProvider {
    readonly name = "memory";
    private store;
    private txn;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
    snapshot(): Promise<StorageSnapshot>;
}
//# sourceMappingURL=memory.d.ts.map