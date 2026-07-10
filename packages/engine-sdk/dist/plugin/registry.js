"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginRegistry = void 0;
const errors_1 = require("../errors");
class DefaultPluginRegistry {
    plugins = new Map();
    enabled = new Set();
    phases = new Map();
    register(plugin) {
        if (this.plugins.has(plugin.id)) {
            throw new errors_1.PluginError(plugin.id, errors_1.EngineErrorCode.PLUGIN_ALREADY_REGISTERED, `Plugin '${plugin.id}' is already registered`);
        }
        this.validatePlugin(plugin);
        this.plugins.set(plugin.id, plugin);
        this.enabled.add(plugin.id);
        const phase = plugin.phase || 'default';
        if (!this.phases.has(phase)) {
            this.phases.set(phase, new Set());
        }
        this.phases.get(phase).add(plugin.id);
    }
    unregister(pluginId) {
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
    get(pluginId) {
        return this.plugins.get(pluginId);
    }
    getAll() {
        return Array.from(this.plugins.values());
    }
    getByPhase(phase) {
        const pluginIds = this.phases.get(phase) || new Set();
        return Array.from(pluginIds)
            .map(id => this.plugins.get(id))
            .filter((p) => p !== undefined);
    }
    getEnabled() {
        return Array.from(this.enabled)
            .map(id => this.plugins.get(id))
            .filter((p) => p !== undefined);
    }
    isRegistered(pluginId) {
        return this.plugins.has(pluginId);
    }
    enable(pluginId) {
        if (!this.plugins.has(pluginId)) {
            return false;
        }
        this.enabled.add(pluginId);
        return true;
    }
    disable(pluginId) {
        if (!this.plugins.has(pluginId)) {
            return false;
        }
        this.enabled.delete(pluginId);
        return true;
    }
    getDependencyGraph() {
        const graph = new Map();
        for (const [id, plugin] of this.plugins) {
            graph.set(id, [...(plugin.dependencies || [])]);
        }
        return graph;
    }
    validateDependencies() {
        const graph = this.getDependencyGraph();
        const cycles = [];
        const missing = [];
        const visited = new Set();
        const recStack = new Set();
        const path = [];
        for (const [, plugin] of this.plugins) {
            for (const dep of plugin.dependencies || []) {
                if (!this.plugins.has(dep)) {
                    missing.push(dep);
                }
            }
        }
        const dfs = (node) => {
            visited.add(node);
            recStack.add(node);
            path.push(node);
            const dependencies = graph.get(node) || [];
            for (const dep of dependencies) {
                if (!visited.has(dep)) {
                    dfs(dep);
                }
                else if (recStack.has(dep)) {
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
    clear() {
        this.plugins.clear();
        this.enabled.clear();
        this.phases.clear();
    }
    validatePlugin(plugin) {
        if (!plugin.id || typeof plugin.id !== 'string') {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid id');
        }
        if (!plugin.name || typeof plugin.name !== 'string') {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid name');
        }
        if (!plugin.version || typeof plugin.version !== 'string') {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have a valid version');
        }
        if (!plugin.execute || typeof plugin.execute !== 'function') {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin must have an execute function');
        }
        if (plugin.priority !== undefined && typeof plugin.priority !== 'number') {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin priority must be a number');
        }
        if (plugin.dependencies && !Array.isArray(plugin.dependencies)) {
            throw new errors_1.EngineError(errors_1.EngineErrorCode.PLUGIN_REGISTRATION_FAILED, 'Plugin dependencies must be an array');
        }
    }
}
exports.DefaultPluginRegistry = DefaultPluginRegistry;
//# sourceMappingURL=registry.js.map