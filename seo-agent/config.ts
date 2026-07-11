import { SharedConfig, MemoryConfigProvider } from "@rentfy/engine-sdk";

export const seoConfig = new SharedConfig({ providers: [new MemoryConfigProvider()] });

seoConfig.register("defaultPriority", { type: "number", defaultValue: 100 });

seoConfig.register("report.includeSuccessIssues", { type: "boolean", defaultValue: false });
seoConfig.register("report.topIssuesLimit", { type: "number", defaultValue: 10 });
seoConfig.register("report.recommendationLimit", { type: "number", defaultValue: 5 });
seoConfig.register("report.dedupeStrategy", { type: "string", defaultValue: "best-severity" });

seoConfig.register("report.passedThreshold", { type: "number", defaultValue: 70 });