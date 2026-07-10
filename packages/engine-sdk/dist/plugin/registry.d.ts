import type { PluginDefinition, PluginRegistry } from '../types';
export declare class DefaultPluginRegistry implements PluginRegistry {
    private plugins;
    private enabled;
    private phases;
    register<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>): void;
    unregister(pluginId: string): boolean;
    get<Input, Output, Config>(pluginId: string): PluginDefinition<Input, Output, Config> | undefined;
    getAll(): PluginDefinition[];
    getByPhase(phase: string): PluginDefinition[];
    getEnabled(): PluginDefinition[];
    isRegistered(pluginId: string): boolean;
    enable(pluginId: string): boolean;
    disable(pluginId: string): boolean;
    getDependencyGraph(): Map<string, string[]>;
    validateDependencies(): {
        valid: boolean;
        cycles: string[][];
        missing: string[];
    };
    clear(): void;
    private validatePlugin;
}
//# sourceMappingURL=registry.d.ts.map