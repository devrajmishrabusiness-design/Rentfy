import type { ConditionEvaluator, ConditionExpression, ConditionGroup, ConditionContext } from '../interfaces/conditions';
export declare class DefaultConditionEvaluator implements ConditionEvaluator {
    evaluate(group: ConditionGroup, context: ConditionContext): boolean;
    evaluateExpression(expr: ConditionExpression, context: ConditionContext): boolean;
    private resolveField;
    private compareValues;
    private deepEquals;
}
//# sourceMappingURL=default-evaluator.d.ts.map