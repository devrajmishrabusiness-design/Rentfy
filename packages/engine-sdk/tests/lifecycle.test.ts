import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultLifecycleManager, EngineStatus } from '../src/lifecycle';
import type { PluginDefinition, PluginInitContext, PluginExecutionContext, PluginShutdownContext } from '../src/types';
import { EngineErrorCode, PluginError } from '../src/errors';

function createTestPlugin<Input = unknown, Output = unknown, Config = unknown>(overrides: Partial<PluginDefinition<Input, Output, Config>> = {}): PluginDefinition<Input, Output, Config> {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    execute: vi.fn().mockResolvedValue('output'),
    ...overrides,
  };
}

function createInitContext<Config = unknown>(overrides: Partial<PluginInitContext<Config>> = {}): PluginInitContext<Config> {
  return {
    engineId: 'test-engine',
    engineVersion: '1.0.0',
    pluginId: 'test-plugin',
    config: {} as Config,
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    storage: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      keys: vi.fn(),
    },
    eventBus: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn(),
    },
    metrics: {
      increment: vi.fn(),
      decrement: vi.fn(),
      gauge: vi.fn(),
      histogram: vi.fn(),
      timing: vi.fn(),
    },
    signals: { aborted: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() } as unknown as AbortSignal,
    ...overrides,
  };
}

function createExecutionContext<Config = unknown>(overrides: Partial<PluginExecutionContext<Config>> = {}): PluginExecutionContext<Config> {
  return {
    engineId: 'test-engine',
    engineVersion: '1.0.0',
    runId: 'test-run',
    pluginId: 'test-plugin',
    config: {} as Config,
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    storage: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      keys: vi.fn(),
    },
    eventBus: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn(),
    },
    metrics: {
      increment: vi.fn(),
      decrement: vi.fn(),
      gauge: vi.fn(),
      histogram: vi.fn(),
      timing: vi.fn(),
    },
    signals: { aborted: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() } as unknown as AbortSignal,
    metadata: {},
    ...overrides,
  };
}

function createShutdownContext(overrides: Partial<PluginShutdownContext> = {}): PluginShutdownContext {
  return {
    engineId: 'test-engine',
    pluginId: 'test-plugin',
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    ...overrides,
  };
}

describe('DefaultLifecycleManager', () => {
  let manager: DefaultLifecycleManager;

  beforeEach(() => {
    manager = new DefaultLifecycleManager();
  });

  describe('initialize', () => {
    it('should initialize with valid plugins', async () => {
      const plugin = createTestPlugin();

      await manager.initialize([plugin]);

      expect(manager.getStatus()).toBe(EngineStatus.RUNNING);
    });

    it('should call onInit for each plugin', async () => {
      const onInit = vi.fn().mockResolvedValue(undefined);
      const plugin = createTestPlugin({ onInit });

      await manager.initialize([plugin]);

      expect(onInit).toHaveBeenCalled();
    });

    it('should validate dependencies and throw on cycle', async () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1', dependencies: ['plugin-2'] });
      const plugin2 = createTestPlugin({ id: 'plugin-2', dependencies: ['plugin-1'] });

      await expect(manager.initialize([plugin1, plugin2])).rejects.toThrow(PluginError);
      expect(manager.getStatus()).toBe(EngineStatus.ERROR);
    });

    it('should throw on missing dependency', async () => {
      const plugin = createTestPlugin({ id: 'plugin-1', dependencies: ['missing-plugin'] });

      await expect(manager.initialize([plugin])).rejects.toThrow(PluginError);
      expect(manager.getStatus()).toBe(EngineStatus.ERROR);
    });

    it('should throw if already initialized', async () => {
      const plugin = createTestPlugin();

      await manager.initialize([plugin]);
      await expect(manager.initialize([plugin])).rejects.toThrow('already initialized');
    });
  });

  describe('execute', () => {
    it('should execute plugin and return result', async () => {
      const plugin = createTestPlugin();
      await manager.initialize([plugin]);

      const result = await manager.execute(plugin, 'input');

      expect(result.success).toBe(true);
      expect(result.output).toBe('output');
    });

    it('should throw if not running', async () => {
      const plugin = createTestPlugin();

      await expect(manager.execute(plugin, 'input')).rejects.toThrow('not running');
    });

    it('should respect abort signal', async () => {
      const plugin = createTestPlugin({
        execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('output'), 100))),
      });
      await manager.initialize([plugin]);

      const execPromise = manager.execute(plugin, 'input');
      manager.abortAll();

      const result = await execPromise;

      expect(result.success).toBe(false);
    });
  });

  describe('shutdown', () => {
    it('should shutdown plugins in reverse order', async () => {
      const onShutdown1 = vi.fn().mockResolvedValue(undefined);
      const onShutdown2 = vi.fn().mockResolvedValue(undefined);
      const plugin1 = createTestPlugin({ id: 'plugin-1', onShutdown: onShutdown1 });
      const plugin2 = createTestPlugin({ id: 'plugin-2', onShutdown: onShutdown2 });

      await manager.initialize([plugin1, plugin2]);
      await manager.shutdown();

      expect(onShutdown1).toHaveBeenCalled();
      expect(onShutdown2).toHaveBeenCalled();
    });

    it('should set status to stopped', async () => {
      const plugin = createTestPlugin();

      await manager.initialize([plugin]);
      await manager.shutdown();

      expect(manager.getStatus()).toBe(EngineStatus.STOPPED);
    });

    it('should be idempotent', async () => {
      const plugin = createTestPlugin();

      await manager.initialize([plugin]);
      await manager.shutdown();
      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return basic metrics', async () => {
      const plugin = createTestPlugin();

      await manager.initialize([plugin]);

      const metrics = manager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.pluginCount).toBe(1);
    });
  });
});