import type { RuleDefinition } from '../interfaces/rules';
import type { RuleRegistry } from '../interfaces/registry';
export declare class DefaultRuleRegistry implements RuleRegistry {
    private readonly rules;
    registerRule(rule: RuleDefinition): void;
    unregisterRule(ruleId: string): boolean;
    enableRule(ruleId: string): boolean;
    disableRule(ruleId: string): boolean;
    getRule(ruleId: string): RuleDefinition | undefined;
    getRules(): RuleDefinition[];
    getEnabledRules(): RuleDefinition[];
    clear(): void;
}
//# sourceMappingURL=default-registry.d.ts.map