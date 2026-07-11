import type { ConfigRegistry as IConfigRegistry, ConfigValidationResult, ConfigLoaderOptions } from '../interfaces/registry';
import type { ConfigSchema, ConfigSnapshot } from '../interfaces/provider';
import { ConfigValidator } from '../validation/validator';
export interface SharedConfigOptions extends ConfigLoaderOptions {
    readonly validator?: ConfigValidator;
}
export declare class SharedConfig implements IConfigRegistry {
    private readonly schemas;
    private readonly values;
    private readonly provider;
    private readonly providers;
    private readonly validator;
    private readonly namespace;
    constructor(options?: SharedConfigOptions);
    register<T = unknown>(key: string, schema: ConfigSchema<T>): void;
    get<T = unknown>(key: string): T;
    set<T = unknown>(key: string, value: T): void;
    has(key: string): boolean;
    remove(key: string): boolean;
    clear(): void;
    validate(): ConfigValidationResult;
    snapshot(): ConfigSnapshot;
    load(): Promise<void>;
    protected registerSchema<T = unknown>(key: string, schema: ConfigSchema<T>): void;
    private setIfRegistered;
    protected get schemasSnapshot(): Map<string, ConfigSchema>;
}
//# sourceMappingURL=shared-config.d.ts.map