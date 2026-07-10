import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultPluginRegistry } from '../src/plugin/registry';
import type { PluginDefinition } from '../src/types';
import { EngineErrorCode } from '../src/errors';

describe('Plugin Registry', () => {
  let registry: DefaultPluginRegistry;

  beforeEach(() => {
    registry = new DefaultPluginRegistry();
  });

  const createTestPlugin = <Input, Output, Config>(overrides: Partial<PluginDefinition<Input, Output, Config>> = {}): PluginDefinition<Input, Output, Config> => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    execute: vi.fn(),
    ...overrides,
  });

  describe('register', () => {
    it('should register a valid plugin', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      expect(registry.isRegistered('test-plugin')).toBe(true);
      expect(registry.get('test-plugin')).toBe(plugin);
    });

    it('should throw if plugin already registered', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      expect(() => registry.register(plugin)).toThrow('already registered');
    });

    it('should throw if plugin missing required fields', () => {
      expect(() => registry.register(createTestPlugin({ id: '' }))).toThrow('valid id');
      expect(() => registry.register(createTestPlugin({ name: '' }))).toThrow('valid name');
      expect(() => registry.register(createTestPlugin({ version: '' }))).toThrow('valid version');
      expect(() => registry.register(createTestPlugin({ execute: undefined as unknown as () => void }))).toThrow('execute function');
    });

    it('should add plugin to default phase', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      const defaultPhasePlugins = registry.getByPhase('default');
      expect(defaultPhasePlugins).toContain(plugin);
    });

    it('should add plugin to custom phase', () => {
      const plugin = createTestPlugin({ phase: 'pre-process' });
      registry.register(plugin);

      const phasePlugins = registry.getByPhase('pre-process');
      expect(phasePlugins).toContain(plugin);
    });
  });

  describe('unregister', () => {
    it('should unregister existing plugin', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      const result = registry.unregister('test-plugin');

      expect(result).toBe(true);
      expect(registry.isRegistered('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('enable/disable', () => {
    it('should disable enabled plugin', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      const result = registry.disable('test-plugin');

      expect(result).toBe(true);
      expect(registry.getEnabled()).not.toContain(plugin);
    });

    it('should enable disabled plugin', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);
      registry.disable('test-plugin');

      const result = registry.enable('test-plugin');

      expect(result).toBe(true);
      expect(registry.getEnabled()).toContain(plugin);
    });

    it('should return false for non-existent plugin', () => {
      expect(registry.enable('non-existent')).toBe(false);
      expect(registry.disable('non-existent')).toBe(false);
    });
  });

  describe('getByPhase', () => {
    it('should return plugins for phase', () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1', phase: 'phase-a' });
      const plugin2 = createTestPlugin({ id: 'plugin-2', phase: 'phase-a' });
      const plugin3 = createTestPlugin({ id: 'plugin-3', phase: 'phase-b' });

      registry.register(plugin1);
      registry.register(plugin2);
      registry.register(plugin3);

      expect(registry.getByPhase('phase-a')).toHaveLength(2);
      expect(registry.getByPhase('phase-b')).toHaveLength(1);
      expect(registry.getByPhase('non-existent')).toHaveLength(0);
    });
  });

  describe('getEnabled', () => {
    it('should return only enabled plugins', () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1' });
      const plugin2 = createTestPlugin({ id: 'plugin-2' });

      registry.register(plugin1);
      registry.register(plugin2);
      registry.disable('plugin-1');

      const enabled = registry.getEnabled();

      expect(enabled).toHaveLength(1);
      expect(enabled).toContain(plugin2);
      expect(enabled).not.toContain(plugin1);
    });
  });

  describe('validateDependencies', () => {
    it('should return valid for no dependencies', () => {
      const plugin = createTestPlugin({ dependencies: [] });
      registry.register(plugin);

      const result = registry.validateDependencies();

      expect(result.valid).toBe(true);
      expect(result.cycles).toHaveLength(0);
      expect(result.missing).toHaveLength(0);
    });

    it('should detect dependency cycles', () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1', dependencies: ['plugin-2'] });
      const plugin2 = createTestPlugin({ id: 'plugin-2', dependencies: ['plugin-1'] });

      registry.register(plugin1);
      registry.register(plugin2);

      const result = registry.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('should detect missing dependencies', () => {
      const plugin = createTestPlugin({ dependencies: ['missing-plugin'] });
      registry.register(plugin);

      const result = registry.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('missing-plugin');
    });
  });

  describe('getDependencyGraph', () => {
    it('should return dependency graph', () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1', dependencies: ['plugin-2'] });
      const plugin2 = createTestPlugin({ id: 'plugin-2', dependencies: [] });

      registry.register(plugin1);
      registry.register(plugin2);

      const graph = registry.getDependencyGraph();

      expect(graph.get('plugin-1')).toEqual(['plugin-2']);
      expect(graph.get('plugin-2')).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all plugins', () => {
      const plugin = createTestPlugin();
      registry.register(plugin);

      registry.clear();

      expect(registry.isRegistered('test-plugin')).toBe(false);
      expect(registry.getEnabled()).toHaveLength(0);
    });
  });
});