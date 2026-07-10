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
export declare const SDK_VERSION: SDKVersion;
export declare function getVersion(): SDKVersion;
export declare function getVersionString(): string;
export declare function getBuildDate(): string;
export declare function isCompatible(requiredVersion: string): boolean;
export declare function getVersionInfo(engineName?: string, engineVersion?: string): VersionInfo;
//# sourceMappingURL=index.d.ts.map