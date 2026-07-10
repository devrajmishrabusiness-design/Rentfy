export const RuleEventType = {
  RuleTriggered: 'rule.triggered',
  RuleSucceeded: 'rule.succeeded',
  RuleFailed: 'rule.failed',
  RuleSkipped: 'rule.skipped',
  RuleRegistered: 'rule.registered',
  RuleUnregistered: 'rule.unregistered',
  RuleEnabled: 'rule.enabled',
  RuleDisabled: 'rule.disabled',
} as const;

export type RuleEventType = (typeof RuleEventType)[keyof typeof RuleEventType];