"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedConfig = void 0;
const validator_1 = require("../validation/validator");
const memory_1 = require("../providers/memory");
const errors_1 = require("../../errors");
class SharedConfig {
    schemas = new Map();
    values = new Map();
    provider;
    providers;
    validator;
    namespace;
    constructor(options = {}) {
        this.namespace = options.namespace ?? 'default';
        this.validator = options.validator ?? new validator_1.ConfigValidator();
        this.provider = new memory_1.MemoryConfigProvider();
        this.providers = options.providers ?? [];
        if (options.schemas) {
            for (const [key, schema] of Object.entries(options.schemas)) {
                this.registerSchema(key, schema);
            }
        }
    }
    register(key, schema) {
        const existing = this.schemas.get(key);
        if (existing) {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_ALREADY_REGISTERED, `Configuration key ${key} is already registered`);
        }
        this.registerSchema(key, schema);
        if (schema.defaultValue !== undefined) {
            this.set(key, schema.defaultValue);
        }
    }
    get(key) {
        if (!this.schemas.has(key)) {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_NOT_FOUND, `Configuration key ${key} is not registered`);
        }
        if (this.values.has(key)) {
            return this.values.get(key);
        }
        throw new errors_1.EngineError(errors_1.EngineErrorCode.CONFIG_VALIDATION_FAILED, `No value set for configuration key ${key}`);
    }
    set(key, value) {
        if (!this.schemas.has(key)) {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_NOT_FOUND, `Configuration key ${key} is not registered`);
        }
        this.values.set(key, value);
    }
    has(key) {
        return this.values.has(key);
    }
    remove(key) {
        return this.values.delete(key);
    }
    clear() {
        this.values.clear();
        this.schemas.clear();
    }
    validate() {
        const schemaObj = {};
        for (const [key, schema] of this.schemas) {
            schemaObj[key] = schema;
        }
        const valueObj = {};
        for (const [key, value] of this.values) {
            valueObj[key] = value;
        }
        return this.validator.validate(schemaObj, valueObj);
    }
    snapshot() {
        const result = {};
        result[this.namespace] = {};
        for (const [key, value] of this.values) {
            result[this.namespace][key] = value;
        }
        return result;
    }
    async load() {
        for (const provider of this.providers) {
            const data = await provider.load(this.namespace);
            for (const [key, value] of Object.entries(data)) {
                this.setIfRegistered(key, value);
            }
        }
    }
    registerSchema(key, schema) {
        this.schemas.set(key, schema);
    }
    setIfRegistered(key, value) {
        if (this.schemas.has(key)) {
            this.values.set(key, value);
        }
    }
    get schemasSnapshot() {
        return this.schemas;
    }
}
exports.SharedConfig = SharedConfig;
//# sourceMappingURL=shared-config.js.map