"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginStorage = void 0;
class DefaultPluginStorage {
    store = new Map();
    async get(key) {
        const value = this.store.get(key);
        return value ?? null;
    }
    async set(key, value) {
        this.store.set(key, value);
    }
    async delete(key) {
        this.store.delete(key);
    }
    async clear() {
        this.store.clear();
    }
    async has(key) {
        return this.store.has(key);
    }
    async keys() {
        return Array.from(this.store.keys());
    }
}
exports.DefaultPluginStorage = DefaultPluginStorage;
//# sourceMappingURL=storage.js.map