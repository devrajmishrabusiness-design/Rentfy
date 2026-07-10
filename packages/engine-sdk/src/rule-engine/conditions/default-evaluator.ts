import type { ConditionEvaluator, ConditionExpression, ConditionGroup, ConditionContext } from '../interfaces/conditions';

export class DefaultConditionEvaluator implements ConditionEvaluator {
  evaluate(group: ConditionGroup, context: ConditionContext): boolean {
    const items = group.conditions;
    if (items.length === 0) return true;

    const results = items.map((item) => {
      if ('field' in item) {
        return this.evaluateExpression(item as ConditionExpression, context);
      }
      return this.evaluate(item as ConditionGroup, context);
    });

    let result: boolean;
    if (group.operator === 'AND') {
      result = results.every((r) => r);
    } else if (group.operator === 'OR') {
      result = results.some((r) => r);
    } else {
      result = !results[0];
    }

    return group.negate ? !result : result;
  }

  evaluateExpression(expr: ConditionExpression, context: ConditionContext): boolean {
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
          } catch {
            return false;
          }
        }
        return false;
      }

      default:
        return false;
    }
  }

  private resolveField(field: string, context: ConditionContext): unknown {
    const parts = field.split('.');
    let current: unknown = context;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private compareValues(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const aStr = String(a);
    const bStr = String(b);
    return aStr.localeCompare(bStr);
  }

  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object' && a !== null && b !== null) {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this.deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
    }
    return false;
  }
}