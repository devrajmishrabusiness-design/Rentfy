import type { ConfigProvider } from '../interfaces/provider';
export declare class EnvConfigProvider implements ConfigProvider {
    readonly name = "env";
    readonly priority = 200;
    private readonly prefix;
    constructor(prefix?: string);
    load(namespace?: string): Promise<Record<string, unknown>>;
    has(key: string, _namespace?: string): Promise<boolean>;
    private coerce;
}
//# sourceMappingURL=env.d.ts.map