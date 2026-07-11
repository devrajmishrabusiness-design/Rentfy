import type { RuleDefinition, RuleMetadata } from '../interfaces/rules';
export declare function createRuleMetadata(options?: {
    meta?: Readonly<Record<string, unknown>>;
    tags?: readonly string[];
    category?: string;
}): RuleMetadata;
export declare function createRule<TPayload = unknown>(id: string, config: Omit<RuleDefinition<TPayload>, 'id' | 'metadata'> & {
    metadata?: Partial<RuleMetadata>;
}): RuleDefinition<TPayload>;
//# sourceMappingURL=rule.d.ts.map