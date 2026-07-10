import type { StorageProvider } from '../interfaces/provider';
import type { KeyValueRepository } from '../interfaces/repository';
import type { KeyValueModel } from '../models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from '../models/query';
import { buildItemKey } from './key-factory';
import { applyFilters, applySort, applyPagination } from './query-utils';

export class GenericKeyValueRepository<T = unknown> implements KeyValueRepository<KeyValueModel<T>> {
  readonly collection: string;
  readonly provider: StorageProvider;

  constructor(collection: string, provider: StorageProvider) {
    this.collection = collection;
    this.provider = provider;
  }

  async create(item: KeyValueModel<T>): Promise<KeyValueModel<T>> {
    const now = Date.now();
    const saved: KeyValueModel<T> = {
      ...item,
      createdAt: item.createdAt ?? now,
      updatedAt: now,
    };
    await this.provider.set(buildItemKey(this.collection, saved.key), saved);
    return saved;
  }

  async save(item: KeyValueModel<T>): Promise<KeyValueModel<T>> {
    const now = Date.now();
    const saved: KeyValueModel<T> = {
      ...item,
      updatedAt: now,
    };
    await this.provider.set(buildItemKey(this.collection, saved.key), saved);
    return saved;
  }

  async update(id: string, updates: Partial<KeyValueModel<T>>): Promise<KeyValueModel<T> | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    const now = Date.now();
    const updated: KeyValueModel<T> = {
      ...existing,
      ...updates,
      key: id,
      updatedAt: now,
    };
    await this.provider.set(buildItemKey(this.collection, id), updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const key = buildItemKey(this.collection, id);
    const exists = await this.provider.has(key);
    if (!exists) {
      return false;
    }
    await this.provider.delete(key);
    return true;
  }

  async findById(id: string): Promise<KeyValueModel<T> | null> {
    const key = buildItemKey(this.collection, id);
    return this.provider.get<KeyValueModel<T>>(key);
  }

  async find(options?: QueryOptions<KeyValueModel<T>>): Promise<RepositoryQueryResult<KeyValueModel<T>>> {
    const all = await this.getAllItems();
    let result = applyFilters(all, options?.filters ?? []);
    result = applySort(result, options?.sort ?? []);
    const paginated = applyPagination(result, options?.offset ?? 0, options?.limit ?? result.length);
    return {
      items: paginated,
      total: result.length,
      offset: options?.offset ?? 0,
      limit: options?.limit ?? result.length,
      hasMore: paginated.length < result.length,
    };
  }

  async query(filter: QueryFilter<KeyValueModel<T>>): Promise<KeyValueModel<T>[]> {
    const all = await this.getAllItems();
    return applyFilters(all, [filter]);
  }

  async clear(): Promise<void> {
    const keys = await this.provider.keys();
    const prefix = `${this.collection}:`;
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        await this.provider.delete(key);
      }
    }
  }

  async getValue<K extends keyof KeyValueModel<T>>(id: string, field: K): Promise<KeyValueModel<T>[K] | null> {
    const item = await this.findById(id);
    if (!item) return null;
    return item[field] ?? null;
  }

  async setValue<K extends keyof KeyValueModel<T>>(id: string, field: K, value: KeyValueModel<T>[K]): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) return;
    const partial: Partial<KeyValueModel<T>> = {
      [field]: value,
    } as Partial<KeyValueModel<T>>;
    await this.update(id, partial);
  }

  private async getAllItems(): Promise<KeyValueModel<T>[]> {
    const allKeys = await this.provider.keys();
    const prefix = `${this.collection}:`;
    const items: KeyValueModel<T>[] = [];
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        const item = await this.provider.get<KeyValueModel<T>>(key);
        if (item) items.push(item);
      }
    }
    return items;
  }
}