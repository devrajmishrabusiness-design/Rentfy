import type { StorageProvider } from '../interfaces/provider';
import type { DocumentRepository } from '../interfaces/repository';
import type { DocumentModel } from '../models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from '../models/query';
import { buildItemKey } from './key-factory';
import { applyFilters, applySort, applyPagination } from './query-utils';

export class GenericDocumentRepository<T = unknown> implements DocumentRepository<DocumentModel<T>> {
  readonly collection: string;
  readonly provider: StorageProvider;

  constructor(collection: string, provider: StorageProvider) {
    this.collection = collection;
    this.provider = provider;
  }

  async create(item: DocumentModel<T>): Promise<DocumentModel<T>> {
    const now = Date.now();
    const saved: DocumentModel<T> = {
      ...item,
      createdAt: item.createdAt ?? now,
      updatedAt: now,
    };
    await this.provider.set(buildItemKey(this.collection, saved.id), saved);
    return saved;
  }

  async save(item: DocumentModel<T>): Promise<DocumentModel<T>> {
    const now = Date.now();
    const saved: DocumentModel<T> = {
      ...item,
      updatedAt: now,
    };
    await this.provider.set(buildItemKey(this.collection, saved.id), saved);
    return saved;
  }

  async update(id: string, updates: Partial<DocumentModel<T>>): Promise<DocumentModel<T> | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }
    const now = Date.now();
    const updated: DocumentModel<T> = {
      ...existing,
      ...updates,
      id,
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

  async findById(id: string): Promise<DocumentModel<T> | null> {
    const key = buildItemKey(this.collection, id);
    return this.provider.get<DocumentModel<T>>(key);
  }

  async find(options?: QueryOptions<DocumentModel<T>>): Promise<RepositoryQueryResult<DocumentModel<T>>> {
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

  async query(filter: QueryFilter<DocumentModel<T>>): Promise<DocumentModel<T>[]> {
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

  async search(query: string, fields: (keyof DocumentModel<T>)[]): Promise<DocumentModel<T>[]> {
    const all = await this.getAllItems();
    const lower = query.toLowerCase();
    return all.filter((item) => {
      return fields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lower);
        }
        return false;
      });
    });
  }

  async count(filter?: QueryFilter<DocumentModel<T>>): Promise<number> {
    if (!filter) {
      const keys = await this.provider.keys();
      const prefix = `${this.collection}:`;
      return keys.filter((k) => k.startsWith(prefix)).length;
    }
    const filtered = await this.query(filter);
    return filtered.length;
  }

  private async getAllItems(): Promise<DocumentModel<T>[]> {
    const allKeys = await this.provider.keys();
    const prefix = `${this.collection}:`;
    const items: DocumentModel<T>[] = [];
    for (const key of allKeys) {
      if (key.startsWith(prefix)) {
        const item = await this.provider.get<DocumentModel<T>>(key);
        if (item) items.push(item);
      }
    }
    return items;
  }
}