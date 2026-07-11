import type { ConfigProvider } from '../interfaces/provider';
export declare class MemoryConfigProvider implements ConfigProvider {
    readonly name = "memory";
    readonly priority = 100;
    private readonly store;
    load(namespace?: string): Promise<Record<string, unknown>>;
    has(key: string, namespace?: string): Promise<boolean>;
    set(key: string, value: unknown, namespace?: string): void;
    clear(namespace?: string): void;
}
//# sourceMappingURL=memory.d.ts.map