import type { ConfigSchema } from '../interfaces/provider';
import type { ConfigValidationResult, ConfigValidationError } from '../interfaces/registry';

export class ConfigValidator {
  validate(schemas: Record<string, ConfigSchema>, values: Record<string, unknown>): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];

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
        const typed = raw as Parameters<typeof schema.validate>[0];
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

  private typeCheck(value: unknown, expectedType: string): boolean {
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