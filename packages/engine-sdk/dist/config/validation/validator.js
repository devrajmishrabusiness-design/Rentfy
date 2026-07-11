"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidator = void 0;
class ConfigValidator {
    validate(schemas, values) {
        const errors = [];
        for (const [key, schema] of Object.entries(schemas)) {
            const raw = values[key];
            if (raw === undefined) {
                if (schema.required) {
                    errors.push({
                        key,
                        message: `${key} is required but not present`,
                        code: 'MISSING_REQUIRED',
                    });
                }
                continue;
            }
            if (!this.typeCheck(raw, schema.type)) {
                errors.push({
                    key,
                    message: `${key} must be of type ${schema.type}, got ${typeof raw}`,
                    code: 'TYPE_MISMATCH',
                });
                continue;
            }
            if (schema.validate) {
                const typed = raw;
                const result = schema.validate(typed);
                if (result && result.length > 0) {
                    for (const msg of result) {
                        errors.push({ key, message: msg, code: 'CUSTOM_VALIDATION' });
                    }
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    typeCheck(value, expectedType) {
        switch (expectedType) {
            case 'string': return typeof value === 'string';
            case 'number': return typeof value === 'number';
            case 'boolean': return typeof value === 'boolean';
            case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'array': return Array.isArray(value);
            default: return false;
        }
    }
}
exports.ConfigValidator = ConfigValidator;
//# sourceMappingURL=validator.js.map