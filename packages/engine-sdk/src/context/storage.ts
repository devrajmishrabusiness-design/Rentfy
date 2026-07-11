import type { PluginStorage } from '../types';
import { MemoryStorageProvider, type StorageProvider } from '../storage';

export interface EngineStorage extends PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

export class DefaultPluginStorage implements EngineStorage {
  private provider: StorageProvider;

  constructor(provider?: StorageProvider) {
    this.provider = provider ?? new MemoryStorageProvider();
  }

  getProvider(): StorageProvider {
    return this.provider;
  }

  async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.provider.set(key, value);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async clear(): Promise<void> {
    return this.provider.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.provider.has(key);
  }

  async keys(): Promise<string[]> {
    return this.provider.keys();
  }
}