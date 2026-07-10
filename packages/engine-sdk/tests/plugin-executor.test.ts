import type { PluginLogger } from '../src/types';
import { DefaultPluginExecutor } from '../src/plugin/executor';
import type { PluginDefinition, PluginInitContext, PluginExecutionContext, PluginShutdownContext, PluginResult } from '../src/types';
import { EngineError, EngineErrorCode, PluginError, LifecycleError } from '../src/errors';

describe('Plugin Executor', () => {
  let executor: DefaultPluginExecutor;
  let mockLogger: PluginLogger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    executor = new DefaultPluginExecutor(mockLogger);
  });

  const createTestPlugin = <Input, Output, Config>(overrides: Partial<PluginDefinition<Input, Output, Config>> = {}): PluginDefinition<Input, Output, Config> => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    execute: vi.fn(),
    ...overrides,
  });

  const createInitContext = <Config>(plugin: PluginDefinition): PluginInitContext<Config> => ({
    engineId: 'test-engine',
    engineVersion: '1.0.0',
    pluginId: plugin.id,
    config: plugin.config as Config,
    logger: mockLogger,
    storage: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), clear: vi.fn(), keys: vi.fn() },
    metrics: { increment: vi.fn(), decrement: vi.fn(), gauge: vi.fn(), histogram: vi.fn(), timing: vi.fn() },
    signals: new AbortController().signal,
  });

  const createExecutionContext = <Config>(plugin: PluginDefinition): PluginExecutionContext<Config> => ({
    engineId: 'test-engine',
    engineVersion: '1.0.0',
    runId: 'run-1',
    pluginId: plugin.id,
    config: plugin.config as Config,
    logger: mockLogger,
    storage: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), clear: vi.fn(), keys: vi.fn() },
    metrics: { increment: vi.fn(), decrement: vi.fn(), gauge: vi.fn(), histogram: vi.fn(), timing: vi.fn() },
    signals: new AbortController().signal,
    metadata: {},
  });

  const createShutdownContext = (plugin: PluginDefinition): PluginShutdownContext => ({
    engineId: 'test-engine',
    pluginId: plugin.id,
    logger: mockLogger,
  });

  describe('initialize', () => {
    it('should call onInit if provided', async () => {
      const onInit = vi.fn().mockResolvedValue(undefined);
      const plugin = createTestPlugin({ onInit });

      await executor.initialize(plugin, createInitContext(plugin));

      expect(onInit).toHaveBeenCalled();
    });

    it('should not fail if onInit not provided', async () => {
      const plugin = createTestPlugin({ onInit: undefined });

      await expect(executor.initialize(plugin, createInitContext(plugin))).resolves.not.toThrow();
    });

    it('should wrap onInit error in PluginError', async () => {
      const plugin = createTestPlugin({ onInit: vi.fn().mockRejectedValue(new Error('Init failed')) });

      await expect(executor.initialize(plugin, createInitContext(plugin)))
        .rejects.toThrow(PluginError);
    });

    it('should timeout if onInit takes too long', async () => {
      vi.useFakeTimers();
      try {
        const plugin = createTestPlugin({
          onInit: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 50000))),
        });

        const initPromise = executor.initialize(plugin, createInitContext(plugin));
        const rejection = expect(initPromise).rejects.toThrow(LifecycleError);

        // Production init timeout is 30s; advance virtual time past it so the
        // executor's internal timer fires before the 50s plugin delay resolves.
        await vi.advanceTimersByTimeAsync(30001);

        await rejection;
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('execute', () => {
    it('should execute plugin and return success result', async () => {
      const plugin = createTestPlugin({
        execute: vi.fn().mockResolvedValue('output'),
      });

      const result = await executor.execute(plugin, 'input', createExecutionContext(plugin));

      expect(result.success).toBe(true);
      expect(result.output).toBe('output');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.skipped).toBe(false);
    });

    it('should call validateConfig if provided', async () => {
      const validateConfig = vi.fn().mockReturnValue(true);
      const plugin = createTestPlugin({ validateConfig });

      await executor.execute(plugin, 'input', createExecutionContext(plugin));

      expect(validateConfig).toHaveBeenCalled();
    });

    it('should fail if validateConfig returns false', async () => {
      const plugin = createTestPlugin({ validateConfig: vi.fn().mockReturnValue(false) });

      const result = await executor.execute(plugin, 'input', createExecutionContext(plugin));

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(EngineErrorCode.PLUGIN_EXECUTION_FAILED);
    });

    it('should return error result if plugin throws', async () => {
      const plugin = createTestPlugin({
        execute: vi.fn().mockRejectedValue(new Error('Execution failed')),
      });

      const result = await executor.execute(plugin, 'input', createExecutionContext(plugin));

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(EngineError);
      expect(result.error?.code).toBe(EngineErrorCode.PLUGIN_EXECUTION_FAILED);
    });

    it('should pass through EngineError if plugin throws it', async () => {
      const engineError = new EngineError(EngineErrorCode.TIMEOUT, 'Custom error');
      const plugin = createTestPlugin({
        execute: vi.fn().mockRejectedValue(engineError),
      });

      const result = await executor.execute(plugin, 'input', createExecutionContext(plugin));

      expect(result.success).toBe(false);
      expect(result.error).toBe(engineError);
    });

    it('should timeout if execution takes too long', async () => {
      vi.useFakeTimers();
      try {
        const plugin = createTestPlugin({
          execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500000))),
        });

        const execPromise = executor.execute(plugin, 'input', createExecutionContext(plugin));

        // Production execute timeout is 300s; advance virtual time past it so
        // the executor's internal timer fires before the 500s plugin delay.
        await vi.advanceTimersByTimeAsync(300001);

        const result = await execPromise;

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(EngineErrorCode.TIMEOUT);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should respect abort signal', async () => {
      const controller = new AbortController();
      const plugin = createTestPlugin({
        execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('output'), 100))),
      });
      const context = createExecutionContext(plugin);
      context.signals = controller.signal;

      const execPromise = executor.execute(plugin, 'input', context);
      controller.abort();

      const result = await execPromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(EngineErrorCode.ABORTED);
    });
  });

  describe('shutdown', () => {
    it('should call onShutdown if provided', async () => {
      const onShutdown = vi.fn().mockResolvedValue(undefined);
      const plugin = createTestPlugin({ onShutdown });

      await executor.shutdown(plugin, createShutdownContext(plugin));

      expect(onShutdown).toHaveBeenCalled();
    });

    it('should not fail if onShutdown not provided', async () => {
      const plugin = createTestPlugin({ onShutdown: undefined });

      await expect(executor.shutdown(plugin, createShutdownContext(plugin))).resolves.not.toThrow();
    });

    it('should log error if onShutdown fails', async () => {
      const plugin = createTestPlugin({ onShutdown: vi.fn().mockRejectedValue(new Error('Shutdown failed')) });

      await executor.shutdown(plugin, createShutdownContext(plugin));

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should timeout if onShutdown takes too long', async () => {
      vi.useFakeTimers();
      try {
        const plugin = createTestPlugin({
          onShutdown: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 20000))),
        });

        const shutdownPromise = executor.shutdown(plugin, createShutdownContext(plugin));

        // Production shutdown timeout is 10s; advance virtual time past it so
        // the executor's internal timer fires before the 20s plugin delay.
        await vi.advanceTimersByTimeAsync(10001);

        await shutdownPromise;

        expect(mockLogger.error).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('abort', () => {
    it('should abort specific plugin execution', async () => {
      const plugin = createTestPlugin({
        execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('output'), 100))),
      });
      const context = createExecutionContext(plugin);

      const execPromise = executor.execute(plugin, 'input', context);
      executor.abort(plugin.id);

      const result = await execPromise;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(EngineErrorCode.ABORTED);
    });

    it('should abort all executions', async () => {
      const plugin1 = createTestPlugin({ id: 'plugin-1', execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('output'), 100))) });
      const plugin2 = createTestPlugin({ id: 'plugin-2', execute: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('output'), 100))) });

      const exec1 = executor.execute(plugin1, 'input', createExecutionContext(plugin1));
      const exec2 = executor.execute(plugin2, 'input', createExecutionContext(plugin2));

      executor.abortAll();

      const [result1, result2] = await Promise.all([exec1, exec2]);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });
});