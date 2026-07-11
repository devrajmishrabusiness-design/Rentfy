"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultRuleRegistry = void 0;
class DefaultRuleRegistry {
    rules = new Map();
    registerRule(rule) {
        this.rules.set(rule.id, rule);
    }
    unregisterRule(ruleId) {
        return this.rules.delete(ruleId);
    }
    enableRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        const updated = { ...rule, enabled: true, metadata: { ...rule.metadata, updatedAt: Date.now() } };
        this.rules.set(ruleId, updated);
        return true;
    }
    disableRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule)
            return false;
        const updated = { ...rule, enabled: false, metadata: { ...rule.metadata, updatedAt: Date.now() } };
        this.rules.set(ruleId, updated);
        return true;
    }
    getRule(ruleId) {
        return this.rules.get(ruleId);
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getEnabledRules() {
        return Array.from(this.rules.values()).filter((r) => r.enabled);
    }
    clear() {
        this.rules.clear();
    }
}
exports.DefaultRuleRegistry = DefaultRuleRegistry;
//# sourceMappingURL=default-registry.js.map