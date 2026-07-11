import type { ConfigSchema } from '../interfaces/provider';
import type { ConfigValidationResult } from '../interfaces/registry';
export declare class ConfigValidator {
    validate(schemas: Record<string, ConfigSchema>, values: Record<string, unknown>): ConfigValidationResult;
    private typeCheck;
}
//# sourceMappingURL=validator.d.ts.map