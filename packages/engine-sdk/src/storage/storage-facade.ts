import type { StorageProvider } from './interfaces/provider';
import type { KeyValueModel, DocumentModel } from './models/base';
import type { QueryFilter, QueryOptions, RepositoryQueryResult } from './models/query';
import { GenericKeyValueRepository } from './repositories/key-value';
import { GenericDocumentRepository } from './repositories/document';
import { MemoryStorageProvider } from './providers/memory';
import { StorageNotFoundError } from './errors/storage-errors';

export interface StorageOptions {
  provider?: StorageProvider;
  collections?: string[];
}

export class Storage {
  private readonly provider: StorageProvider;
  private readonly kvRepos: Map<string, GenericKeyValueRepository> = new Map();
  private readonly docRepos: Map<string, GenericDocumentRepository> = new Map();

  constructor(options: StorageOptions = {}) {
    this.provider = options.provider ?? new MemoryStorageProvider();
    for (const col of options.collections ?? []) {
      this.kvRepos.set(col, new GenericKeyValueRepository(col, this.provider));
      this.docRepos.set(col, new GenericDocumentRepository(col, this.provider));
    }
  }

  getProvider(): StorageProvider {
    return this.provider;
  }

  registerKV(collection: string): GenericKeyValueRepository {
    if (this.kvRepos.has(collection)) {
      return this.kvRepos.get(collection)!;
    }
    const repo = new GenericKeyValueRepository(collection, this.provider);
    this.kvRepos.set(collection, repo);
    return repo;
  }

  registerDoc(collection: string): GenericDocumentRepository {
    if (this.docRepos.has(collection)) {
      return this.docRepos.get(collection)!;
    }
    const repo = new GenericDocumentRepository(collection, this.provider);
    this.docRepos.set(collection, repo);
    return repo;
  }

  // Public API

  async create(collection: string, item: KeyValueModel | DocumentModel): Promise<KeyValueModel | DocumentModel> {
    if ('key' in item) {
      const repo = this.registerKV(collection);
      return repo.create(item as KeyValueModel);
    }
    const repo = this.registerDoc(collection);
    return repo.create(item as DocumentModel);
  }

  async save(collection: string, item: KeyValueModel | DocumentModel): Promise<KeyValueModel | DocumentModel> {
    if ('key' in item) {
      const repo = this.registerKV(collection);
      return repo.save(item as KeyValueModel);
    }
    const repo = this.registerDoc(collection);
    return repo.save(item as DocumentModel);
  }

  async update(collection: string, id: string, updates: Partial<KeyValueModel> | Partial<DocumentModel>): Promise<KeyValueModel | DocumentModel | null> {
    const kvRepo = this.kvRepos.get(collection);
    if (kvRepo) {
      const result = await kvRepo.update(id, updates as Partial<KeyValueModel>);
      if (result) return result;
    }
    const docRepo = this.docRepos.get(collection);
    if (docRepo) {
      const result = await docRepo.update(id, updates as Partial<DocumentModel>);
      if (result) return result;
    }
    throw new StorageNotFoundError(collection, id);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const kvRepo = this.kvRepos.get(collection);
    if (kvRepo) {
      const deleted = await kvRepo.delete(id);
      if (deleted) return true;
    }
    const docRepo = this.docRepos.get(collection);
    if (docRepo) {
      const deleted = await docRepo.delete(id);
      if (deleted) return true;
    }
    return false;
  }

  async findById(collection: string, id: string): Promise<KeyValueModel | DocumentModel | null> {
    const kvRepo = this.kvRepos.get(collection);
    if (kvRepo) {
      const item = await kvRepo.findById(id);
      if (item) return item;
    }
    const docRepo = this.docRepos.get(collection);
    if (docRepo) {
      const item = await docRepo.findById(id);
      if (item) return item;
    }
    return null;
  }

  async find(collection: string, options?: QueryOptions): Promise<RepositoryQueryResult> {
    const kvRepo = this.kvRepos.get(collection);
    if (kvRepo) {
      return kvRepo.find(options as QueryOptions<KeyValueModel>);
    }
    const docRepo = this.docRepos.get(collection);
    if (docRepo) {
      return docRepo.find(options as QueryOptions<DocumentModel>);
    }
    return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
  }

  async query(collection: string, filter: QueryFilter): Promise<Array<KeyValueModel | DocumentModel>> {
    const kvRepo = this.kvRepos.get(collection);
    if (kvRepo) {
      return kvRepo.query(filter as QueryFilter<KeyValueModel>);
    }
    const docRepo = this.docRepos.get(collection);
    if (docRepo) {
      return docRepo.query(filter as QueryFilter<DocumentModel>);
    }
    return [];
  }

  async clear(collection?: string): Promise<void> {
    if (collection) {
      const kvRepo = this.kvRepos.get(collection);
      if (kvRepo) await kvRepo.clear();
      const docRepo = this.docRepos.get(collection);
      if (docRepo) await docRepo.clear();
      return;
    }
    await this.provider.clear();
    this.kvRepos.clear();
    this.docRepos.clear();
  }

  async beginTransaction(): Promise<void> {
    return this.provider.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    return this.provider.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    return this.provider.rollbackTransaction();
  }
}