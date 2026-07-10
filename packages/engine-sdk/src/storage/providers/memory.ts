import type { StorageProvider, StorageSnapshot } from '../interfaces/provider';

interface TransactionState {
  active: boolean;
  snapshot: Map<string, unknown>;
  keys: Set<string>;
}

export class MemoryStorageProvider implements StorageProvider {
  readonly name = 'memory';
  private store: Map<string, unknown> = new Map();
  private txn: TransactionState = { active: false, snapshot: new Map(), keys: new Set() };

  async beginTransaction(): Promise<void> {
    if (this.txn.active) {
      return;
    }
    this.txn.active = true;
    this.txn.snapshot = new Map(this.store);
    this.txn.keys = new Set<string>();
  }

  async commitTransaction(): Promise<void> {
    const wasActive = this.txn.active;
    this.txn.active = false;
    this.txn.snapshot = new Map();
    this.txn.keys = new Set();
    if (!wasActive) {
      return;
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.txn.active) {
      return;
    }
    this.store.clear();
    for (const [k, v] of this.txn.snapshot) {
      this.store.set(k, v);
    }
    this.txn.active = false;
    this.txn.snapshot = new Map();
    this.txn.keys = new Set();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.store.get(key);
    return (value as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async snapshot(): Promise<StorageSnapshot> {
    return {
      keys: Array.from(this.store.keys()),
      entries: new Map(this.store),
    };
  }
}