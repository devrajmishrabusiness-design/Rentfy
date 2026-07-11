import type { PluginStorage } from '../types';
import { type StorageProvider } from '../storage';
export interface EngineStorage extends PluginStorage {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
}
export declare class DefaultPluginStorage implements EngineStorage {
    private provider;
    constructor(provider?: StorageProvider);
    getProvider(): StorageProvider;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    keys(): Promise<string[]>;
}
//# sourceMappingURL=storage.d.ts.map