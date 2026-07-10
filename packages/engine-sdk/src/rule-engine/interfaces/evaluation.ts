import type { EngineError } from '../../errors';
import type { RuleDefinition } from './rules';

export interface RuleEvaluationContext<TPayload = unknown> {
  readonly rule: RuleDefinition<TPayload>;
  readonly event: {
    readonly type: string;
    readonly payload: TPayload;
    readonly timestamp: number;
    readonly source?: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
  };
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RuleEvaluationResult<TResult = unknown> {
  readonly ruleId: string;
  readonly success: boolean;
  readonly skipped: boolean;
  readonly actionResults: readonly ActionResult[];
  readonly error?: EngineError;
  readonly executionTime: number;
  readonly result?: TResult;
}

export interface ActionResult {
  readonly ruleId: string;
  readonly actionType: string;
  readonly success: boolean;
  readonly output?: unknown;
  readonly error?: EngineError;
  readonly executionTime: number;
}

export interface IRuleEngine {
  evaluate<TPayload = unknown>(eventType: string, payload: TPayload, options?: EvaluationOptions): Promise<RuleEvaluationResult[]>;
}

export interface EvaluationOptions {
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly abortOnFailure?: boolean;
}