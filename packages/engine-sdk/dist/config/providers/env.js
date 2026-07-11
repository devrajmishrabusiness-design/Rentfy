"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvConfigProvider = void 0;
class EnvConfigProvider {
    name = 'env';
    priority = 200;
    prefix;
    constructor(prefix = 'APP_') {
        this.prefix = prefix;
    }
    async load(namespace) {
        const result = {};
        const ns = namespace ?? 'default';
        for (const [rawKey, rawValue] of Object.entries(process.env)) {
            if (!rawKey.startsWith(this.prefix))
                continue;
            if (rawValue === undefined)
                continue;
            const key = rawKey.slice(this.prefix.length).toLowerCase();
            const typed = this.coerce(rawValue);
            if (ns === 'default') {
                result[key] = typed;
            }
            else {
                result[key] = typed;
            }
        }
        return result;
    }
    async has(key, _namespace) {
        const envKey = `${this.prefix}${key.toUpperCase()}`;
        return process.env[envKey] !== undefined;
    }
    coerce(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            const n = Number(value);
            if (!isNaN(n))
                return n;
        }
        return value;
    }
}
exports.EnvConfigProvider = EnvConfigProvider;
//# sourceMappingURL=env.js.map