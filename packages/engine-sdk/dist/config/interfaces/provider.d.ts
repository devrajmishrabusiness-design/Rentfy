export interface ConfigSchema<T = unknown> {
    readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    readonly required?: boolean;
    readonly defaultValue?: T;
    readonly description?: string;
    readonly validate?: (value: T) => string[] | null;
    readonly sensitive?: boolean;
}
export interface ConfigNamespace {
    readonly name: string;
    readonly description?: string;
}
export interface ConfigEntry<T = unknown> {
    readonly key: string;
    readonly namespace?: string;
    schema?: ConfigSchema<T>;
    value: T;
    readonly source?: string;
    readonly updatedAt?: number;
}
export interface ConfigSnapshot {
    [key: string]: {
        [subkey: string]: unknown;
    };
}
export interface ConfigProvider {
    readonly name: string;
    readonly priority: number;
    load(namespace?: string): Promise<Record<string, unknown>>;
    has(key: string, namespace?: string): Promise<boolean>;
}
//# sourceMappingURL=provider.d.ts.map