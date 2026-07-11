"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginStorage = void 0;
const storage_1 = require("../storage");
class DefaultPluginStorage {
    provider;
    constructor(provider) {
        this.provider = provider ?? new storage_1.MemoryStorageProvider();
    }
    getProvider() {
        return this.provider;
    }
    async get(key) {
        return this.provider.get(key);
    }
    async set(key, value) {
        return this.provider.set(key, value);
    }
    async delete(key) {
        return this.provider.delete(key);
    }
    async clear() {
        return this.provider.clear();
    }
    async has(key) {
        return this.provider.has(key);
    }
    async keys() {
        return this.provider.keys();
    }
}
exports.DefaultPluginStorage = DefaultPluginStorage;
//# sourceMappingURL=storage.js.map