import type { RuleDefinition } from './rules';
export interface RuleRegistry {
    registerRule(rule: RuleDefinition): void;
    unregisterRule(ruleId: string): boolean;
    enableRule(ruleId: string): boolean;
    disableRule(ruleId: string): boolean;
    getRule(ruleId: string): RuleDefinition | undefined;
    getRules(): RuleDefinition[];
    getEnabledRules(): RuleDefinition[];
    clear(): void;
}
//# sourceMappingURL=registry.d.ts.map