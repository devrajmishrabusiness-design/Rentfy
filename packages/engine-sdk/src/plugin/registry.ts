import type { PluginDefinition, PluginRegistry } from '../types';
import { EngineError, EngineErrorCode, PluginError } from '../errors';

export class DefaultPluginRegistry implements PluginRegistry {
  private plugins = new Map<string, PluginDefinition>();
  private enabled = new Set<string>();
  private phases = new Map<string, Set<string>>();

  register<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>): void {
    if (this.plugins.has(plugin.id)) {
      throw new PluginError(plugin.id, EngineErrorCode.PLUGIN_ALREADY_REGISTERED, `Plugin '${plugin.id}' is already registered`);
    }

    this.validatePlugin(plugin);

    this.plugins.set(plugin.id, plugin as PluginDefinition);
    this.enabled.add(plugin.id);

    const phase = plugin.phase || 'default';
    if (!this.phases.has(phase)) {
      this.phases.set(phase, new Set());
    }
    this.phases.get(phase)!.add(plugin.id);
  }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    this.plugins.delete(pluginId);
    this.enabled.delete(pluginId);

    const phase = plugin.phase || 'default';
    this.phases.get(phase)?.delete(pluginId);

    return true;
  }

  get<Input, Output, Config>(pluginId: string): PluginDefinition<Input, Output, Config> | undefined {
    return this.plugins.get(pluginId) as PluginDefinition<Input, Output, Config> | undefined;
  }

  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  getByPhase(phase: string): PluginDefinition[] {
    const pluginIds = this.phases.get(phase) || new Set();
    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is PluginDefinition => p !== undefined);
  }

  getEnabled(): PluginDefinition[] {
    return Array.from(this.enabled)
      .map(id => this.plugins.get(id))
      .filter((p): p is PluginDefinition => p !== undefined);
  }

  isRegistered(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  enable(pluginId: string): boolean {
    if (!this.plugins.has(pluginId)) {
      return false;
    }
    this.enabled.add(pluginId);
    return true;
  }

  disable(pluginId: string): boolean {
    if (!this.plugins.has(pluginId)) {
      return false;
    }
    this.enabled.delete(pluginId);
    return true;
  }

  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const [id, plugin] of this.plugins) {
      graph.set(id, [...(plugin.dependencies || [])]);
    }
    return graph;
  }

  validateDependencies(): { valid: boolean; cycles: string[][]; missing: string[] } {
    const graph = this.getDependencyGraph();
    const cycles: string[][] = [];
    const missing: string[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    for (const [, plugin] of this.plugins) {
      for (const dep of plugin.dependencies || []) {
        if (!this.plugins.has(dep)) {
          missing.push(dep);
        }
      }
    }

    const dfs = (node: string): void => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          dfs(dep);
        } else if (recStack.has(dep)) {
          const cycleStart = path.indexOf(dep);
          cycles.push([...path.slice(cycleStart), dep]);
        }
      }

      recStack.delete(node);
      path.pop();
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return {
      valid: cycles.length === 0 && missing.length === 0,
      cycles,
      missing: [...new Set(missing)],
    };
  }

  clear(): void {
    this.plugins.clear();
    this.enabled.clear();
    this.phases.clear();
  }

  private validatePlugin<Input, Output, Config>(plugin: PluginDefinition<Input, Output, Config>): void {
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid id');
    }
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid name');
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid version');
    }
    if (!plugin.execute || typeof plugin.execute !== 'function') {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have an execute function');
    }
    if (plugin.priority !== undefined && typeof plugin.priority !== 'number') {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin priority must be a number');
    }
    if (plugin.dependencies && !Array.isArray(plugin.dependencies)) {
      throw new EngineError(EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin dependencies must be an array');
    }
  }
}