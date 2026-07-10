import type { ConditionGroup } from './conditions';
import type { ActionDefinition } from './actions';
import type { RuleEvaluationContext, RuleEvaluationResult } from './evaluation';

export enum RuleStatus {
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export interface RuleMetadata {
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
  readonly tags?: readonly string[];
  readonly category?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface RuleDefinition<_TPayload = unknown, _TResult = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly trigger: TriggerDefinition;
  readonly conditions: ConditionGroup;
  readonly actions: readonly ActionDefinition[];
  readonly metadata: RuleMetadata;
}

export interface TriggerDefinition {
  readonly eventType: string;
  readonly filter?: ConditionGroup;
}

export type RuleHandler<TPayload = unknown, TResult = unknown> = (
  context: RuleEvaluationContext<TPayload>,
) => Promise<RuleEvaluationResult<TResult>>;