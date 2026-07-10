export interface SDKVersion {
  version: string;
  buildDate: string;
  commit?: string;
  engineInterfaces: string[];
}

export interface VersionInfo {
  sdk: SDKVersion;
  engine?: {
    name: string;
    version: string;
  };
}

export const SDK_VERSION: SDKVersion = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  engineInterfaces: [
    'EngineInterface',
    'PluginDefinition',
    'PluginRegistry',
    'PluginExecutor',
    'EventBus',
    'EngineLogger',
    'EngineStorage',
    'EngineMetrics',
  ],
};

export function getVersion(): SDKVersion {
  return SDK_VERSION;
}

export function getVersionString(): string {
  return SDK_VERSION.version;
}

export function getBuildDate(): string {
  return SDK_VERSION.buildDate;
}

export function isCompatible(requiredVersion: string): boolean {
  const [currentMajor, currentMinor] = SDK_VERSION.version.split('.').map(Number);
  const [requiredMajor, requiredMinor] = requiredVersion.split('.').map(Number);

  if (isNaN(currentMajor) || isNaN(currentMinor) || isNaN(requiredMajor) || isNaN(requiredMinor)) {
    return false;
  }

  if (currentMajor > requiredMajor) return true;
  if (currentMajor < requiredMajor) return false;
  return currentMinor >= requiredMinor;
}

export function getVersionInfo(engineName?: string, engineVersion?: string): VersionInfo {
  return {
    sdk: SDK_VERSION,
    engine: engineName && engineVersion ? { name: engineName, version: engineVersion } : undefined,
  };
}