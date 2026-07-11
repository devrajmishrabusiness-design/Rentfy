"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorageProvider = void 0;
class MemoryStorageProvider {
    name = 'memory';
    store = new Map();
    txn = { active: false, snapshot: new Map(), keys: new Set() };
    async beginTransaction() {
        if (this.txn.active) {
            return;
        }
        this.txn.active = true;
        this.txn.snapshot = new Map(this.store);
        this.txn.keys = new Set();
    }
    async commitTransaction() {
        const wasActive = this.txn.active;
        this.txn.active = false;
        this.txn.snapshot = new Map();
        this.txn.keys = new Set();
        if (!wasActive) {
            return;
        }
    }
    async rollbackTransaction() {
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
    async snapshot() {
        return {
            keys: Array.from(this.store.keys()),
            entries: new Map(this.store),
        };
    }
}
exports.MemoryStorageProvider = MemoryStorageProvider;
//# sourceMappingURL=memory.js.map