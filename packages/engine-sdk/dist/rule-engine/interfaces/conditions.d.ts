export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'greaterOrEqual' | 'lessThan' | 'lessOrEqual' | 'exists' | 'regex';
export type LogicalOperator = 'AND' | 'OR' | 'NOT';
export interface ConditionExpression {
    readonly field: string;
    readonly operator: ConditionOperator;
    readonly value?: unknown;
}
export interface ConditionGroup {
    readonly operator: LogicalOperator;
    readonly conditions: readonly (ConditionExpression | ConditionGroup)[];
    readonly negate?: boolean;
}
export interface ConditionContext {
    readonly event: {
        readonly type: string;
        readonly payload: unknown;
        readonly timestamp: number;
        readonly source?: string;
        readonly metadata?: Readonly<Record<string, unknown>>;
    };
    readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ConditionEvaluator {
    evaluate(group: ConditionGroup, context: ConditionContext): boolean;
    evaluateExpression(expr: ConditionExpression, context: ConditionContext): boolean;
}
//# sourceMappingURL=conditions.d.ts.map