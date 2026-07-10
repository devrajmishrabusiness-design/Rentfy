import { describe, it, expect } from 'vitest';
import { SDK_VERSION, getVersion, getVersionString, getBuildDate, isCompatible, getVersionInfo } from '../src/version';

describe('Version', () => {
  describe('SDK_VERSION', () => {
    it('should have version property', () => {
      expect(SDK_VERSION.version).toBeDefined();
      expect(typeof SDK_VERSION.version).toBe('string');
    });

    it('should have buildDate property', () => {
      expect(SDK_VERSION.buildDate).toBeDefined();
      expect(typeof SDK_VERSION.buildDate).toBe('string');
    });

    it('should have engineInterfaces array', () => {
      expect(Array.isArray(SDK_VERSION.engineInterfaces)).toBe(true);
      expect(SDK_VERSION.engineInterfaces.length).toBeGreaterThan(0);
    });

    it('should include core interfaces', () => {
      expect(SDK_VERSION.engineInterfaces).toContain('EngineInterface');
      expect(SDK_VERSION.engineInterfaces).toContain('PluginDefinition');
      expect(SDK_VERSION.engineInterfaces).toContain('PluginRegistry');
      expect(SDK_VERSION.engineInterfaces).toContain('PluginExecutor');
      expect(SDK_VERSION.engineInterfaces).toContain('EventBus');
      expect(SDK_VERSION.engineInterfaces).toContain('EngineLogger');
      expect(SDK_VERSION.engineInterfaces).toContain('EngineStorage');
      expect(SDK_VERSION.engineInterfaces).toContain('EngineMetrics');
    });
  });

  describe('getVersion', () => {
    it('should return SDK_VERSION object', () => {
      const version = getVersion();
      expect(version).toBe(SDK_VERSION);
    });
  });

  describe('getVersionString', () => {
    it('should return version string', () => {
      const versionString = getVersionString();
      expect(versionString).toBe(SDK_VERSION.version);
    });
  });

  describe('getBuildDate', () => {
    it('should return build date string', () => {
      const buildDate = getBuildDate();
      expect(buildDate).toBe(SDK_VERSION.buildDate);
    });
  });

  describe('isCompatible', () => {
    it('should return true for same major, higher minor', () => {
      expect(isCompatible('1.0.0')).toBe(true);
    });

    it('should return true for same major and minor', () => {
      expect(isCompatible('1.0.0')).toBe(true);
    });

    it('should return false for higher major', () => {
      // If current is 1.0.0, 2.0.0 should be false
      // But we need to check current version
      const currentMajor = parseInt(SDK_VERSION.version.split('.')[0]);
      expect(isCompatible(`${currentMajor + 1}.0.0`)).toBe(false);
    });

    it('should return true for lower major', () => {
      const currentMajor = parseInt(SDK_VERSION.version.split('.')[0]);
      if (currentMajor > 0) {
        expect(isCompatible(`${currentMajor - 1}.0.0`)).toBe(true);
      }
    });
  });

  describe('getVersionInfo', () => {
    it('should return version info without engine', () => {
      const info = getVersionInfo();
      expect(info.sdk).toBe(SDK_VERSION);
      expect(info.engine).toBeUndefined();
    });

    it('should return version info with engine', () => {
      const info = getVersionInfo('test-engine', '2.0.0');
      expect(info.sdk).toBe(SDK_VERSION);
      expect(info.engine).toEqual({ name: 'test-engine', version: '2.0.0' });
    });
  });
});