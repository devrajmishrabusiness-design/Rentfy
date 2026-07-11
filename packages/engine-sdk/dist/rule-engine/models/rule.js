"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRuleMetadata = createRuleMetadata;
exports.createRule = createRule;
function createRuleMetadata(options = {}) {
    const now = Date.now();
    return {
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: options.tags,
        category: options.category,
        meta: options.meta,
    };
}
function createRule(id, config) {
    return {
        id,
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        priority: config.priority,
        trigger: config.trigger,
        conditions: config.conditions,
        actions: config.actions,
        metadata: { ...createRuleMetadata({ meta: config.metadata?.meta, tags: config.metadata?.tags, category: config.metadata?.category }), ...config.metadata },
    };
}
//# sourceMappingURL=rule.js.map