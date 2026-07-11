export declare const RuleEventType: {
    readonly RuleTriggered: "rule.triggered";
    readonly RuleSucceeded: "rule.succeeded";
    readonly RuleFailed: "rule.failed";
    readonly RuleSkipped: "rule.skipped";
    readonly RuleRegistered: "rule.registered";
    readonly RuleUnregistered: "rule.unregistered";
    readonly RuleEnabled: "rule.enabled";
    readonly RuleDisabled: "rule.disabled";
};
export type RuleEventType = (typeof RuleEventType)[keyof typeof RuleEventType];
//# sourceMappingURL=events.d.ts.map