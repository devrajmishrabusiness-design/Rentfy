"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const key_value_1 = require("./repositories/key-value");
const document_1 = require("./repositories/document");
const memory_1 = require("./providers/memory");
const storage_errors_1 = require("./errors/storage-errors");
class Storage {
    provider;
    kvRepos = new Map();
    docRepos = new Map();
    constructor(options = {}) {
        this.provider = options.provider ?? new memory_1.MemoryStorageProvider();
        for (const col of options.collections ?? []) {
            this.kvRepos.set(col, new key_value_1.GenericKeyValueRepository(col, this.provider));
            this.docRepos.set(col, new document_1.GenericDocumentRepository(col, this.provider));
        }
    }
    getProvider() {
        return this.provider;
    }
    registerKV(collection) {
        if (this.kvRepos.has(collection)) {
            return this.kvRepos.get(collection);
        }
        const repo = new key_value_1.GenericKeyValueRepository(collection, this.provider);
        this.kvRepos.set(collection, repo);
        return repo;
    }
    registerDoc(collection) {
        if (this.docRepos.has(collection)) {
            return this.docRepos.get(collection);
        }
        const repo = new document_1.GenericDocumentRepository(collection, this.provider);
        this.docRepos.set(collection, repo);
        return repo;
    }
    // Public API
    async create(collection, item) {
        if ('key' in item) {
            const repo = this.registerKV(collection);
            return repo.create(item);
        }
        const repo = this.registerDoc(collection);
        return repo.create(item);
    }
    async save(collection, item) {
        if ('key' in item) {
            const repo = this.registerKV(collection);
            return repo.save(item);
        }
        const repo = this.registerDoc(collection);
        return repo.save(item);
    }
    async update(collection, id, updates) {
        const kvRepo = this.kvRepos.get(collection);
        if (kvRepo) {
            const result = await kvRepo.update(id, updates);
            if (result)
                return result;
        }
        const docRepo = this.docRepos.get(collection);
        if (docRepo) {
            const result = await docRepo.update(id, updates);
            if (result)
                return result;
        }
        throw new storage_errors_1.StorageNotFoundError(collection, id);
    }
    async delete(collection, id) {
        const kvRepo = this.kvRepos.get(collection);
        if (kvRepo) {
            const deleted = await kvRepo.delete(id);
            if (deleted)
                return true;
        }
        const docRepo = this.docRepos.get(collection);
        if (docRepo) {
            const deleted = await docRepo.delete(id);
            if (deleted)
                return true;
        }
        return false;
    }
    async findById(collection, id) {
        const kvRepo = this.kvRepos.get(collection);
        if (kvRepo) {
            const item = await kvRepo.findById(id);
            if (item)
                return item;
        }
        const docRepo = this.docRepos.get(collection);
        if (docRepo) {
            const item = await docRepo.findById(id);
            if (item)
                return item;
        }
        return null;
    }
    async find(collection, options) {
        const kvRepo = this.kvRepos.get(collection);
        if (kvRepo) {
            return kvRepo.find(options);
        }
        const docRepo = this.docRepos.get(collection);
        if (docRepo) {
            return docRepo.find(options);
        }
        return { items: [], total: 0, offset: 0, limit: 0, hasMore: false };
    }
    async query(collection, filter) {
        const kvRepo = this.kvRepos.get(collection);
        if (kvRepo) {
            return kvRepo.query(filter);
        }
        const docRepo = this.docRepos.get(collection);
        if (docRepo) {
            return docRepo.query(filter);
        }
        return [];
    }
    async clear(collection) {
        if (collection) {
            const kvRepo = this.kvRepos.get(collection);
            if (kvRepo)
                await kvRepo.clear();
            const docRepo = this.docRepos.get(collection);
            if (docRepo)
                await docRepo.clear();
            return;
        }
        await this.provider.clear();
        this.kvRepos.clear();
        this.docRepos.clear();
    }
    async beginTransaction() {
        return this.provider.beginTransaction();
    }
    async commitTransaction() {
        return this.provider.commitTransaction();
    }
    async rollbackTransaction() {
        return this.provider.rollbackTransaction();
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage-facade.js.map