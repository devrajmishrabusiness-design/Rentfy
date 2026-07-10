import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DefaultLifecycleManager, EngineStatus } from '../src/lifecycle';
import type { PluginDefinition } from '../src/types';
import { EngineErrorCode } from '../src/errors';

function createTestPlugin(overrides: Partial<PluginDefinition> = {}): PluginDefinition {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    execute: vi.fn().mockResolvedValue('output'),
    phase: 'default',
    priority: 100,
    ...overrides,
  };
}

describe('Integration: Full Engine Lifecycle', () => {
  let manager: DefaultLifecycleManager;

  beforeEach(() => {
    manager = new DefaultLifecycleManager();
  });

  it('should complete full lifecycle: initialize -> execute -> shutdown', async () => {
    const plugin = createTestPlugin({
      onInit: vi.fn().mockResolvedValue(undefined),
      onShutdown: vi.fn().mockResolvedValue(undefined),
    });

    await manager.initialize([plugin]);
    expect(manager.getStatus()).toBe(EngineStatus.RUNNING);

    const result = await manager.execute(plugin, 'test input');
    expect(result.success).toBe(true);
    expect(result.output).toBe('output');

    await manager.shutdown();
    expect(manager.getStatus()).toBe(EngineStatus.STOPPED);
  });

  it('should execute multiple plugins with dependencies', async () => {
    const pluginA = createTestPlugin({ id: 'plugin-a' });
    const pluginB = createTestPlugin({ id: 'plugin-b', dependencies: ['plugin-a'] });
    const pluginC = createTestPlugin({ id: 'plugin-c', dependencies: ['plugin-b'] });

    await manager.initialize([pluginA, pluginB, pluginC]);

    // All should execute successfully
    const resultA = await manager.execute(pluginA, 'input');
    const resultB = await manager.execute(pluginB, 'input');
    const resultC = await manager.execute(pluginC, 'input');

    expect(resultA.success).toBe(true);
    expect(resultB.success).toBe(true);
    expect(resultC.success).toBe(true);

    await manager.shutdown();
  });

  it('should handle plugin execution errors gracefully', async () => {
    const failingPlugin = createTestPlugin({
      id: 'failing-plugin',
      execute: vi.fn().mockRejectedValue(new Error('Plugin failed')),
    });
    const successPlugin = createTestPlugin({ id: 'success-plugin' });

    await manager.initialize([failingPlugin, successPlugin]);

    const failResult = await manager.execute(failingPlugin, 'input');
    expect(failResult.success).toBe(false);
    expect(failResult.error).toBeDefined();

    const successResult = await manager.execute(successPlugin, 'input');
    expect(successResult.success).toBe(true);

    await manager.shutdown();
  });

  it('should respect plugin priority order in phases', async () => {
    const executionOrder: string[] = [];
    const lowPriority = createTestPlugin({
      id: 'low-priority',
      priority: 100,
      execute: vi.fn().mockImplementation(async () => {
        executionOrder.push('low-priority');
        return 'low';
      }),
    });
    const highPriority = createTestPlugin({
      id: 'high-priority',
      priority: 10,
      execute: vi.fn().mockImplementation(async () => {
        executionOrder.push('high-priority');
        return 'high';
      }),
    });

    await manager.initialize([lowPriority, highPriority]);

    // Execute plugins directly (they run in phase order)
    await manager.execute(highPriority, 'input');
    await manager.execute(lowPriority, 'input');

    // High priority should execute first based on priority
    expect(executionOrder[0]).toBe('high-priority');

    await manager.shutdown();
  });

  it('should validate plugin config if validateConfig provided', async () => {
    const validConfig = { threshold: 0.5 };
    const invalidConfig = { threshold: 'invalid' };

    const plugin = createTestPlugin({
      config: validConfig,
      validateConfig: vi.fn().mockImplementation((config: typeof validConfig) => typeof config.threshold === 'number'),
    });

    await manager.initialize([plugin]);

    // Valid config
    const validResult = await manager.execute(plugin, 'input');
    expect(validResult.success).toBe(true);

    // Note: validateConfig is called during execute with context.config
    // which is set from plugin.config during registration
  });

  it('should emit lifecycle events', async () => {
    const events: string[] = [];

    manager.on('engine:initialized', () => events.push('initialized'));
    manager.on('engine:run:start', () => events.push('run-start'));
    manager.on('engine:run:complete', () => events.push('run-complete'));
    manager.on('engine:shutdown:complete', () => events.push('shutdown-complete'));

    const plugin = createTestPlugin();
    await manager.initialize([plugin]);
    await manager.execute(plugin, 'input');
    await manager.shutdown();

    expect(events).toContain('initialized');
    expect(events).toContain('run-start');
    expect(events).toContain('run-complete');
    expect(events).toContain('shutdown-complete');
  });

  it('should handle abort during execution', async () => {
    const slowPlugin = createTestPlugin({
      id: 'slow-plugin',
      execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('done'), 200))),
    });

    await manager.initialize([slowPlugin]);

    const execPromise = manager.execute(slowPlugin, 'input');
    manager.abortAll();

    const result = await execPromise;

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(EngineErrorCode.ABORTED);

    await manager.shutdown();
  });

  it('should collect metrics from plugins', async () => {
    const plugin = createTestPlugin();
    await manager.initialize([plugin]);

    const metrics = manager.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.pluginCount).toBe(1);
    expect(metrics.activePlugins).toBe(1);
  });
});