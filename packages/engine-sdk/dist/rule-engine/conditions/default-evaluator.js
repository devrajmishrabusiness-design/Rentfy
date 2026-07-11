"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultConditionEvaluator = void 0;
class DefaultConditionEvaluator {
    evaluate(group, context) {
        const items = group.conditions;
        if (items.length === 0)
            return true;
        const results = items.map((item) => {
            if ('field' in item) {
                return this.evaluateExpression(item, context);
            }
            return this.evaluate(item, context);
        });
        let result;
        if (group.operator === 'AND') {
            result = results.every((r) => r);
        }
        else if (group.operator === 'OR') {
            result = results.some((r) => r);
        }
        else {
            result = !results[0];
        }
        return group.negate ? !result : result;
    }
    evaluateExpression(expr, context) {
        const fieldValue = this.resolveField(expr.field, context);
        switch (expr.operator) {
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'equals':
                return this.deepEquals(fieldValue, expr.value);
            case 'notEquals':
                return !this.deepEquals(fieldValue, expr.value);
            case 'contains': {
                if (typeof fieldValue === 'string' && typeof expr.value === 'string') {
                    return fieldValue.includes(expr.value);
                }
                if (Array.isArray(fieldValue)) {
                    return fieldValue.includes(expr.value);
                }
                return false;
            }
            case 'startsWith': {
                if (typeof fieldValue === 'string' && typeof expr.value === 'string') {
                    return fieldValue.startsWith(expr.value);
                }
                return false;
            }
            case 'endsWith': {
                if (typeof fieldValue === 'string' && typeof expr.value === 'string') {
                    return fieldValue.endsWith(expr.value);
                }
                return false;
            }
            case 'greaterThan':
                return this.compareValues(fieldValue, expr.value) > 0;
            case 'greaterOrEqual':
                return this.compareValues(fieldValue, expr.value) >= 0;
            case 'lessThan':
                return this.compareValues(fieldValue, expr.value) < 0;
            case 'lessOrEqual':
                return this.compareValues(fieldValue, expr.value) <= 0;
            case 'regex': {
                if (typeof fieldValue === 'string' && typeof expr.value === 'string') {
                    try {
                        const regex = new RegExp(expr.value);
                        return regex.test(fieldValue);
                    }
                    catch {
                        return false;
                    }
                }
                return false;
            }
            default:
                return false;
        }
    }
    resolveField(field, context) {
        const parts = field.split('.');
        let current = context;
        for (const part of parts) {
            if (current === null || current === undefined)
                return undefined;
            if (typeof current === 'object') {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    compareValues(a, b) {
        if (typeof a === 'number' && typeof b === 'number')
            return a - b;
        const aStr = String(a);
        const bStr = String(b);
        return aStr.localeCompare(bStr);
    }
    deepEquals(a, b) {
        if (a === b)
            return true;
        if (typeof a !== typeof b)
            return false;
        if (typeof a === 'object' && a !== null && b !== null) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length)
                return false;
            return keysA.every((key) => this.deepEquals(a[key], b[key]));
        }
        return false;
    }
}
exports.DefaultConditionEvaluator = DefaultConditionEvaluator;
//# sourceMappingURL=default-evaluator.js.map