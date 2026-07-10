import type { RuleDefinition, RuleMetadata } from '../interfaces/rules';

export function createRuleMetadata(options: {
  meta?: Readonly<Record<string, unknown>>;
  tags?: readonly string[];
  category?: string;
} = {}): RuleMetadata {
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

export function createRule<TPayload = unknown>(
  id: string,
  config: Omit<RuleDefinition<TPayload>, 'id' | 'metadata'> & { metadata?: Partial<RuleMetadata> },
): RuleDefinition<TPayload> {
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