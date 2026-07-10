import { describe, it, expect, beforeEach } from 'vitest';
import {
  SharedConfig,
  ConfigValidator,
  MemoryConfigProvider,
  EnvConfigProvider,
} from '../src/config';
import type {
  ConfigSchema,
  ConfigValidationResult,
} from '../src/config/interfaces/provider';

describe('SharedConfig', () => {
  describe('ConfigValidator', () => {
    let validator: ConfigValidator;

    beforeEach(() => {
      validator = new ConfigValidator();
    });

    it('should pass valid values', () => {
      const result = validator.validate(
        { port: { type: 'number', required: true } },
        { port: 3000 },
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required keys', () => {
      const result = validator.validate(
        { port: { type: 'number', required: true } },
        {},
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe('MISSING_REQUIRED');
    });

    it('should allow missing optional keys', () => {
      const result = validator.validate(
        { name: { type: 'string' } },
        {},
      );
      expect(result.valid).toBe(true);
    });

    it('should detect type mismatch — string expected, number given', () => {
      const result = validator.validate(
        { name: { type: 'string' } },
        { name: 123 },
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe('TYPE_MISMATCH');
    });

    it('should detect type mismatch — number expected, string given', () => {
      const result = validator.validate(
        { port: { type: 'number' } },
        { port: 'not-a-number' },
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe('TYPE_MISMATCH');
    });

    it('should validate boolean type', () => {
      const result = validator.validate(
        { debug: { type: 'boolean' } },
        { debug: true },
      );
      expect(result.valid).toBe(true);
    });

    it('should validate object type', () => {
      const result = validator.validate(
        { opts: { type: 'object' } },
        { opts: { a: 1 } },
      );
      expect(result.valid).toBe(true);

      const fail = validator.validate(
        { opts: { type: 'object' } },
        { opts: 'string' },
      );
      expect(fail.valid).toBe(false);
    });

    it('should validate array type', () => {
      const result = validator.validate(
        { items: { type: 'array' } },
        { items: [1, 2, 3] },
      );
      expect(result.valid).toBe(true);

      const fail = validator.validate(
        { items: { type: 'array' } },
        { items: { x: 1 } },
      );
      expect(fail.valid).toBe(false);
    });

    it('should run custom validation', () => {
      const result = validator.validate(
        {
          email: {
            type: 'string',
            validate: (v: string) => (v.includes('@') ? null : ['invalid email']),
          },
        },
        { email: 'bad' },
      );
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe('CUSTOM_VALIDATION');
    });

    it('should pass custom validation when ok', () => {
      const result = validator.validate(
        {
          email: {
            type: 'string',
            validate: (v: string) => (v.includes('@') ? null : ['invalid email']),
          },
        },
        { email: 'good@test.com' },
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('SharedConfig — registration', () => {
    let config: SharedConfig;

    beforeEach(() => {
      config = new SharedConfig();
    });

    it('should register a config key with schema', () => {
      config.register('port', { type: 'number', defaultValue: 8080 });
      expect(config.get('port')).toBe(8080);
    });

    it('should register with string default', () => {
      config.register('host', { type: 'string', defaultValue: 'localhost' });
      expect(config.get('host')).toBe('localhost');
    });

    it('should throw on duplicate registration', () => {
      config.register('key', { type: 'string', defaultValue: 'a' });
      expect(() => config.register('key', { type: 'string', defaultValue: 'b' })).toThrow();
    });

    it('should set value after registration', () => {
      config.register('port', { type: 'number' });
      config.set('port', 3000);
      expect(config.get('port')).toBe(3000);
    });

    it('should throw on set unregistered key', () => {
      expect(() => config.set('unknown', 1)).toThrow();
    });

    it('should throw on get unregistered key', () => {
      expect(() => config.get('unknown')).toThrow();
    });

    it('should throw on get registered key with no value', () => {
      config.register('name', { type: 'string' });
      expect(() => config.get('name')).toThrow();
    });

    it('should check has', () => {
      config.register('key', { type: 'string', defaultValue: 'val' });
      expect(config.has('key')).toBe(true);
      expect(config.has('nonexistent')).toBe(false);
    });

    it('should remove key', () => {
      config.register('key', { type: 'string', defaultValue: 'val' });
      expect(config.remove('key')).toBe(true);
      expect(config.has('key')).toBe(false);
    });

    it('should clear all keys', () => {
      config.register('a', { type: 'string', defaultValue: '1' });
      config.register('b', { type: 'string', defaultValue: '2' });
      config.clear();
      expect(config.has('a')).toBe(false);
      expect(config.has('b')).toBe(false);
    });
  });

  describe('SharedConfig — validate', () => {
    it('should validate registered keys', () => {
      const config = new SharedConfig();
      config.register('port', { type: 'number', required: true, defaultValue: 3000 });
      config.register('host', { type: 'string', defaultValue: 'localhost' });

      const result = config.validate();
      expect(result.valid).toBe(true);
    });

    it('should report missing required keys', () => {
      const config = new SharedConfig();
      config.register('port', { type: 'number', required: true });

      const result = config.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED')).toBe(true);
    });

    it('should report type mismatch', () => {
      const config = new SharedConfig();
      config.register('port', { type: 'number', defaultValue: 'bad' as unknown as number });
      const result = config.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('SharedConfig — snapshot', () => {
    it('should produce a snapshot', () => {
      const config = new SharedConfig();
      config.register('port', { type: 'number', defaultValue: 3000 });
      config.register('host', { type: 'string', defaultValue: 'localhost' });

      const snap = config.snapshot();
      expect(snap).toBeDefined();
      expect(snap['default']).toBeDefined();
      expect(snap['default']!['port']).toBe(3000);
      expect(snap['default']!['host']).toBe('localhost');
    });
  });

  describe('SharedConfig — load from providers', () => {
    it('should load from memory provider', async () => {
      const mem = new MemoryConfigProvider();
      mem.set('port', 9090);

      const config = new SharedConfig({
        providers: [mem],
        schemas: { port: { type: 'number' } },
      });

      await config.load();
      expect(config.get('port')).toBe(9090);
    });

    it('should load from env provider', async () => {
      const original = process.env['APP_PORT'];
      process.env['APP_PORT'] = '4000';

      const env = new EnvConfigProvider('APP_');
      const config = new SharedConfig({
        providers: [env],
        schemas: { port: { type: 'number' } },
      });

      await config.load();

      if (original !== undefined) {
        process.env['APP_PORT'] = original;
      } else {
        delete process.env['APP_PORT'];
      }

      expect(config.get('port')).toBe(4000);
    });

    it('should load from multiple providers with memory overriding env', async () => {
      const original = process.env['APP_PORT'];
      process.env['APP_PORT'] = '5000';

      const env = new EnvConfigProvider('APP_');
      const mem = new MemoryConfigProvider();
      mem.set('port', 9999);

      const config = new SharedConfig({
        providers: [env, mem],
        schemas: { port: { type: 'number' } },
      });

      await config.load();

      if (original !== undefined) {
        process.env['APP_PORT'] = original;
      } else {
        delete process.env['APP_PORT'];
      }

      expect(config.get('port')).toBe(9999);
    });
  });

  describe('EnvConfigProvider', () => {
    it('should load env vars with prefix', async () => {
      const original = process.env['APP_TEST_KEY'];
      process.env['APP_TEST_KEY'] = 'hello';

      const provider = new EnvConfigProvider('APP_');
      const data = await provider.load();

      if (original !== undefined) {
        process.env['APP_TEST_KEY'] = original;
      } else {
        delete process.env['APP_TEST_KEY'];
      }

      expect(data['test_key']).toBe('hello');
    });

    it('should coerce booleans', async () => {
      const orig = process.env['APP_DEBUG'];
      process.env['APP_DEBUG'] = 'true';

      const provider = new EnvConfigProvider('APP_');
      const data = await provider.load();

      if (orig !== undefined) {
        process.env['APP_DEBUG'] = orig;
      } else {
        delete process.env['APP_DEBUG'];
      }

      expect(data['debug']).toBe(true);
    });

    it('should coerce numbers', async () => {
      const orig = process.env['APP_COUNT'];
      process.env['APP_COUNT'] = '42';

      const provider = new EnvConfigProvider('APP_');
      const data = await provider.load();

      if (orig !== undefined) {
        process.env['APP_COUNT'] = orig;
      } else {
        delete process.env['APP_COUNT'];
      }

      expect(data['count']).toBe(42);
    });

    it('should check has', async () => {
      const orig = process.env['APP_EXISTS'];
      process.env['APP_EXISTS'] = 'yes';

      const provider = new EnvConfigProvider('APP_');
      const has = await provider.has('exists');

      if (orig !== undefined) {
        process.env['APP_EXISTS'] = orig;
      } else {
        delete process.env['APP_EXISTS'];
      }

      expect(has).toBe(true);
    });
  });

  describe('MemoryConfigProvider', () => {
    it('should set and load values', async () => {
      const provider = new MemoryConfigProvider();
      provider.set('name', 'test');
      const data = await provider.load();
      expect(data['name']).toBe('test');
    });

    it('should check has', async () => {
      const provider = new MemoryConfigProvider();
      provider.set('key', 'val');
      expect(await provider.has('key')).toBe(true);
      expect(await provider.has('missing')).toBe(false);
    });

    it('should support namespaces', async () => {
      const provider = new MemoryConfigProvider();
      provider.set('key', 'global', 'default');
      provider.set('key', 'ns-value', 'custom');

      const def = await provider.load('default');
      const ns = await provider.load('custom');

      expect(def['key']).toBe('global');
      expect(ns['key']).toBe('ns-value');
    });

    it('should clear specific namespace', async () => {
      const provider = new MemoryConfigProvider();
      provider.set('key', 'val', 'ns1');
      provider.set('key', 'val2', 'ns2');

      provider.clear('ns1');

      expect(await provider.load('ns1')).toEqual({});
      expect((await provider.load('ns2'))['key']).toBe('val2');
    });
  });

  describe('SharedConfig — default values', () => {
    it('should return default values from schema', () => {
      const config = new SharedConfig();
      config.register('retryCount', { type: 'number', defaultValue: 3 });
      config.register('timeout', { type: 'number', defaultValue: 5000 });
      expect(config.get('retryCount')).toBe(3);
      expect(config.get('timeout')).toBe(5000);
    });

    it('should allow override of default', () => {
      const config = new SharedConfig();
      config.register('retryCount', { type: 'number', defaultValue: 3 });
      config.set('retryCount', 10);
      expect(config.get('retryCount')).toBe(10);
    });
  });

  describe('SharedConfig — register array', () => {
    it('should register multiple keys', () => {
      const config = new SharedConfig();
      config.register('a', { type: 'string', defaultValue: 'a' });
      config.register('b', { type: 'string', defaultValue: 'b' });
      config.register('c', { type: 'number', defaultValue: 1 });

      config.set('a', 'updated-a');
      expect(config.get('a')).toBe('updated-a');
      expect(config.get('b')).toBe('b');
      expect(config.get('c')).toBe(1);
    });
  });
});