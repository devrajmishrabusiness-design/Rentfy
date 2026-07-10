import type { RuleDefinition } from '../interfaces/rules';
import type { RuleRegistry } from '../interfaces/registry';

export class DefaultRuleRegistry implements RuleRegistry {
  private readonly rules: Map<string, RuleDefinition> = new Map();

  registerRule(rule: RuleDefinition): void {
    this.rules.set(rule.id, rule);
  }

  unregisterRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    const updated: RuleDefinition = { ...rule, enabled: true, metadata: { ...rule.metadata, updatedAt: Date.now() } };
    this.rules.set(ruleId, updated);
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    const updated: RuleDefinition = { ...rule, enabled: false, metadata: { ...rule.metadata, updatedAt: Date.now() } };
    this.rules.set(ruleId, updated);
    return true;
  }

  getRule(ruleId: string): RuleDefinition | undefined {
    return this.rules.get(ruleId);
  }

  getRules(): RuleDefinition[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(): RuleDefinition[] {
    return Array.from(this.rules.values()).filter((r) => r.enabled);
  }

  clear(): void {
    this.rules.clear();
  }
}