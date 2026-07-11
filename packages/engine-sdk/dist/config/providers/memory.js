"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryConfigProvider = void 0;
class MemoryConfigProvider {
    name = 'memory';
    priority = 100;
    store = new Map();
    async load(namespace) {
        const ns = namespace ?? 'default';
        return this.store.get(ns) ?? {};
    }
    async has(key, namespace) {
        const ns = namespace ?? 'default';
        const data = this.store.get(ns);
        return data !== undefined && key in data;
    }
    set(key, value, namespace) {
        const ns = namespace ?? 'default';
        let data = this.store.get(ns);
        if (!data) {
            data = {};
            this.store.set(ns, data);
        }
        data[key] = value;
    }
    clear(namespace) {
        if (namespace) {
            this.store.delete(namespace);
        }
        else {
            this.store.clear();
        }
    }
}
exports.MemoryConfigProvider = MemoryConfigProvider;
//# sourceMappingURL=memory.js.map