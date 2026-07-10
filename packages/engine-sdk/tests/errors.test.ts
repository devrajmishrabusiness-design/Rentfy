import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EngineError, EngineErrorCode, PluginError, LifecycleError } from '../src/errors';

describe('Error Model', () => {
  describe('EngineError', () => {
    it('should create error with code and message', () => {
      const error = new EngineError(EngineErrorCode.ENGINE_NOT_INITIALIZED, 'Engine not initialized');

      expect(error.code).toBe(EngineErrorCode.ENGINE_NOT_INITIALIZED);
      expect(error.message).toBe('Engine not initialized');
      expect(error.name).toBe('EngineError');
    });

    it('should include details and cause', () => {
      const cause = new Error('Original error');
      const error = new EngineError(EngineErrorCode.ENGINE_START_FAILED, 'Start failed', {
        details: { reason: 'config invalid' },
        cause,
      });

      expect(error.details).toEqual({ reason: 'config invalid' });
      expect(error.cause).toBe(cause);
    });

    it('should have toJSON method', () => {
      const error = new EngineError(EngineErrorCode.TIMEOUT, 'Operation timed out', {
        details: { timeout: 5000 },
      });

      const json = error.toJSON();

      expect(json.name).toBe('EngineError');
      expect(json.code).toBe(EngineErrorCode.TIMEOUT);
      expect(json.message).toBe('Operation timed out');
      expect(json.details).toEqual({ timeout: 5000 });
    });

    it('should support static isEngineError check', () => {
      const error = new EngineError(EngineErrorCode.UNKNOWN_ERROR, 'Unknown');
      const regularError = new Error('Regular');

      expect(EngineError.isEngineError(error)).toBe(true);
      expect(EngineError.isEngineError(regularError)).toBe(false);
      expect(EngineError.isEngineError(null)).toBe(false);
    });
  });

  describe('PluginError', () => {
    it('should include pluginId', () => {
      const error = new PluginError('my-plugin', EngineErrorCode.PLUGIN_EXECUTION_FAILED, 'Plugin failed');

      expect(error.pluginId).toBe('my-plugin');
      expect(error.name).toBe('PluginError');
    });

    it('should include pluginId in toJSON', () => {
      const error = new PluginError('test-plugin', EngineErrorCode.PLUGIN_NOT_FOUND, 'Not found');
      const json = error.toJSON();

      expect(json.pluginId).toBe('test-plugin');
    });
  });

  describe('LifecycleError', () => {
    it('should include phase', () => {
      const error = new LifecycleError('initialization', EngineErrorCode.LIFECYCLE_HOOK_FAILED, 'Init failed');

      expect(error.phase).toBe('initialization');
      expect(error.name).toBe('LifecycleError');
    });

    it('should include phase in toJSON', () => {
      const error = new LifecycleError('shutdown', EngineErrorCode.TIMEOUT, 'Shutdown timeout');
      const json = error.toJSON();

      expect(json.phase).toBe('shutdown');
    });
  });
});

describe('EngineErrorCode', () => {
  it('should have all required error codes', () => {
    const codes = Object.values(EngineErrorCode);

    expect(codes).toContain('ENGINE_NOT_INITIALIZED');
    expect(codes).toContain('ENGINE_ALREADY_RUNNING');
    expect(codes).toContain('ENGINE_START_FAILED');
    expect(codes).toContain('ENGINE_STOP_FAILED');
    expect(codes).toContain('ENGINE_CONFIG_INVALID');
    expect(codes).toContain('PLUGIN_NOT_FOUND');
    expect(codes).toContain('PLUGIN_ALREADY_REGISTERED');
    expect(codes).toContain('PLUGIN_REGISTRATION_FAILED');
    expect(codes).toContain('PLUGIN_EXECUTION_FAILED');
    expect(codes).toContain('PLUGIN_DEPENDENCY_CYCLE');
    expect(codes).toContain('PLUGIN_DEPENDENCY_MISSING');
    expect(codes).toContain('PLUGIN_VERSION_INCOMPATIBLE');
    expect(codes).toContain('LIFECYCLE_HOOK_FAILED');
    expect(codes).toContain('CONTEXT_CREATION_FAILED');
    expect(codes).toContain('INVALID_STATE_TRANSITION');
    expect(codes).toContain('TIMEOUT');
    expect(codes).toContain('UNKNOWN_ERROR');
  });
});