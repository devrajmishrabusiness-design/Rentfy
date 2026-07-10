"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_VERSION = void 0;
exports.getVersion = getVersion;
exports.getVersionString = getVersionString;
exports.getBuildDate = getBuildDate;
exports.isCompatible = isCompatible;
exports.getVersionInfo = getVersionInfo;
exports.SDK_VERSION = {
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
function getVersion() {
    return exports.SDK_VERSION;
}
function getVersionString() {
    return exports.SDK_VERSION.version;
}
function getBuildDate() {
    return exports.SDK_VERSION.buildDate;
}
function isCompatible(requiredVersion) {
    const [currentMajor, currentMinor] = exports.SDK_VERSION.version.split('.').map(Number);
    const [requiredMajor, requiredMinor] = requiredVersion.split('.').map(Number);
    if (isNaN(currentMajor) || isNaN(currentMinor) || isNaN(requiredMajor) || isNaN(requiredMinor)) {
        return false;
    }
    if (currentMajor > requiredMajor)
        return true;
    if (currentMajor < requiredMajor)
        return false;
    return currentMinor >= requiredMinor;
}
function getVersionInfo(engineName, engineVersion) {
    return {
        sdk: exports.SDK_VERSION,
        engine: engineName && engineVersion ? { name: engineName, version: engineVersion } : undefined,
    };
}
//# sourceMappingURL=index.js.map