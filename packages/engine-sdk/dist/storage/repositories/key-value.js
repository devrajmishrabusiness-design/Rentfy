"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericKeyValueRepository = void 0;
const key_factory_1 = require("./key-factory");
const query_utils_1 = require("./query-utils");
class GenericKeyValueRepository {
    collection;
    provider;
    constructor(collection, provider) {
        this.collection = collection;
        this.provider = provider;
    }
    async create(item) {
        const now = Date.now();
        const saved = {
            ...item,
            createdAt: item.createdAt ?? now,
            updatedAt: now,
        };
        await this.provider.set((0, key_factory_1.buildItemKey)(this.collection, saved.key), saved);
        return saved;
    }
    async save(item) {
        const now = Date.now();
        const saved = {
            ...item,
            updatedAt: now,
        };
        await this.provider.set((0, key_factory_1.buildItemKey)(this.collection, saved.key), saved);
        return saved;
    }
    async update(id, updates) {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }
        const now = Date.now();
        const updated = {
            ...existing,
            ...updates,
            key: id,
            updatedAt: now,
        };
        await this.provider.set((0, key_factory_1.buildItemKey)(this.collection, id), updated);
        return updated;
    }
    async delete(id) {
        const key = (0, key_factory_1.buildItemKey)(this.collection, id);
        const exists = await this.provider.has(key);
        if (!exists) {
            return false;
        }
        await this.provider.delete(key);
        return true;
    }
    async findById(id) {
        const key = (0, key_factory_1.buildItemKey)(this.collection, id);
        return this.provider.get(key);
    }
    async find(options) {
        const all = await this.getAllItems();
        let result = (0, query_utils_1.applyFilters)(all, options?.filters ?? []);
        result = (0, query_utils_1.applySort)(result, options?.sort ?? []);
        const paginated = (0, query_utils_1.applyPagination)(result, options?.offset ?? 0, options?.limit ?? result.length);
        return {
            items: paginated,
            total: result.length,
            offset: options?.offset ?? 0,
            limit: options?.limit ?? result.length,
            hasMore: paginated.length < result.length,
        };
    }
    async query(filter) {
        const all = await this.getAllItems();
        return (0, query_utils_1.applyFilters)(all, [filter]);
    }
    async clear() {
        const keys = await this.provider.keys();
        const prefix = `${this.collection}:`;
        for (const key of keys) {
            if (key.startsWith(prefix)) {
                await this.provider.delete(key);
            }
        }
    }
    async getValue(id, field) {
        const item = await this.findById(id);
        if (!item)
            return null;
        return item[field] ?? null;
    }
    async setValue(id, field, value) {
        const existing = await this.findById(id);
        if (!existing)
            return;
        const partial = {
            [field]: value,
        };
        await this.update(id, partial);
    }
    async getAllItems() {
        const allKeys = await this.provider.keys();
        const prefix = `${this.collection}:`;
        const items = [];
        for (const key of allKeys) {
            if (key.startsWith(prefix)) {
                const item = await this.provider.get(key);
                if (item)
                    items.push(item);
            }
        }
        return items;
    }
}
exports.GenericKeyValueRepository = GenericKeyValueRepository;
//# sourceMappingURL=key-value.js.map