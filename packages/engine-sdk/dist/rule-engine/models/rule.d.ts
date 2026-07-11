import type { RuleDefinition, RuleMetadata } from '../interfaces/rules';
export declare function createRuleMetadata(options?: {
    meta?: Readonly<Record<string, unknown>>;
    tags?: readonly string[];
    category?: string;
}): RuleMetadata;
export declare function createRule(id: string, config: Omit<RuleDefinition, 'id' | 'metadata'> & {
    metadata?: Partial<RuleMetadata>;
}): RuleDefinition;
//# sourceMappingURL=rule.d.ts.map