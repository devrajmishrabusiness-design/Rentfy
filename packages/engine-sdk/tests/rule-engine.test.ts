import { describe, it, expect, beforeEach } from 'vitest';
import {
  RuleEngine,
  DefaultRuleRegistry,
  DefaultConditionEvaluator,
  RuleEventType,
  createRule,
} from '../src/rule-engine';
import { DefaultPlatformEventBus } from '../src/event-bus/impl/default-bus';
import { MemoryEventBusTransport } from '../src/event-bus/transports/memory-event-bus';
import { createJobQueue } from '../src/job-queue/factory';
import type { RuleDefinition } from '../src/rule-engine/interfaces/rules';
import type { ConditionExpression, ConditionGroup, ConditionOperator } from '../src/rule-engine/interfaces/conditions';
import type { ActionDefinition } from '../src/rule-engine/interfaces/actions';
import type { PluginLogger } from '../src/types';

function makeLogger(): PluginLogger & { logs: string[] } {
  const logs: string[] = [];
  return {
    logs,
    debug(msg: string) { logs.push(`debug:${msg}`); },
    info(msg: string) { logs.push(`info:${msg}`); },
    warn(msg: string) { logs.push(`warn:${msg}`); },
    error(msg: string) { logs.push(`error:${msg}`); },
    child() { return this; },
  };
}

function fieldExpr(field: string, operator: ConditionOperator, value?: unknown): ConditionExpression {
  return { field, operator, value };
}

function andGroup(...conditions: (ConditionExpression | ConditionGroup)[]): ConditionGroup {
  return { operator: 'AND', conditions };
}

function orGroup(...conditions: (ConditionExpression | ConditionGroup)[]): ConditionGroup {
  return { operator: 'OR', conditions };
}

function notGroup(condition: ConditionExpression | ConditionGroup): ConditionGroup {
  return { operator: 'NOT', conditions: [condition] };
}

function publishAction(eventType: string, payload?: unknown): ActionDefinition {
  return { type: 'publishEvent', config: { eventType, payload } };
}

function enqueueAction(jobType: string, jobPayload?: unknown): ActionDefinition {
  return { type: 'enqueueJob', config: { jobType, jobPayload } };
}

function logAction(message: string, level?: string): ActionDefinition {
  return { type: 'logMessage', config: { message, level: level ?? 'info' } };
}

function delayAction(ms: number): ActionDefinition {
  return { type: 'delay', config: { ms } };
}

function stopAction(): ActionDefinition {
  return { type: 'stopEvaluation', config: {} };
}

function makeTestRule(id: string, opts: Partial<Omit<RuleDefinition, 'id' | 'metadata'>> = {}): RuleDefinition {
  return createRule(id, {
    name: opts.name ?? `Rule ${id}`,
    enabled: opts.enabled ?? true,
    priority: opts.priority ?? 10,
    trigger: opts.trigger ?? { eventType: 'test.event' },
    conditions: opts.conditions ?? andGroup(fieldExpr('event.payload.count', 'greaterThan', 0)),
    actions: opts.actions ?? [publishAction('rule.passed')],
  });
}

describe('RuleEngine', () => {
  describe('RuleRegistry', () => {
    let registry: DefaultRuleRegistry;

    beforeEach(() => {
      registry = new DefaultRuleRegistry();
    });

    it('should register a rule', () => {
      const rule = makeTestRule('r1');
      registry.registerRule(rule);
      expect(registry.getRules()).toHaveLength(1);
      expect(registry.getRule('r1')).toBe(rule);
    });

    it('should unregister a rule', () => {
      registry.registerRule(makeTestRule('r1'));
      expect(registry.unregisterRule('r1')).toBe(true);
      expect(registry.getRules()).toHaveLength(0);
    });

    it('should return false for missing unregister', () => {
      expect(registry.unregisterRule('missing')).toBe(false);
    });

    it('should enable/disable rules', () => {
      registry.registerRule(makeTestRule('r1', { enabled: false }));
      expect(registry.enableRule('r1')).toBe(true);
      expect(registry.getRule('r1')!.enabled).toBe(true);

      expect(registry.disableRule('r1')).toBe(true);
      expect(registry.getRule('r1')!.enabled).toBe(false);
    });

    it('should return false for missing enable/disable', () => {
      expect(registry.enableRule('missing')).toBe(false);
      expect(registry.disableRule('missing')).toBe(false);
    });

    it('should get only enabled rules', () => {
      registry.registerRule(makeTestRule('r1', { enabled: true }));
      registry.registerRule(makeTestRule('r2', { enabled: false }));
      registry.registerRule(makeTestRule('r3', { enabled: true }));
      expect(registry.getEnabledRules()).toHaveLength(2);
    });

    it('should clear all rules', () => {
      registry.registerRule(makeTestRule('r1'));
      registry.registerRule(makeTestRule('r2'));
      registry.clear();
      expect(registry.getRules()).toHaveLength(0);
    });

    it('should update metadata on enable/disable', () => {
      registry.registerRule(makeTestRule('r1'));
      const before = registry.getRule('r1')!.metadata.updatedAt;
      registry.disableRule('r1');
      const after = registry.getRule('r1')!.metadata.updatedAt;
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  describe('DefaultConditionEvaluator — operators', () => {
    let evaluator: DefaultConditionEvaluator;
    const ctx = {
      event: { type: 't', payload: { count: 5, name: 'test', items: ['a', 'b', 'c'], nested: { val: 42 } }, timestamp: 0 },
      metadata: {},
    };

    beforeEach(() => {
      evaluator = new DefaultConditionEvaluator();
    });

    it('equals — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'equals', 5), ctx)).toBe(true);
    });

    it('equals — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'equals', 10), ctx)).toBe(false);
    });

    it('notEquals — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'notEquals', 10), ctx)).toBe(true);
    });

    it('notEquals — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'notEquals', 5), ctx)).toBe(false);
    });

    it('contains — string', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'contains', 'te'), ctx)).toBe(true);
    });

    it('contains — array', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.items', 'contains', 'b'), ctx)).toBe(true);
    });

    it('contains — not found', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'contains', 'xx'), ctx)).toBe(false);
    });

    it('startsWith — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'startsWith', 'te'), ctx)).toBe(true);
    });

    it('startsWith — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'startsWith', 'es'), ctx)).toBe(false);
    });

    it('endsWith — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'endsWith', 'st'), ctx)).toBe(true);
    });

    it('endsWith — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'endsWith', 'te'), ctx)).toBe(false);
    });

    it('greaterThan — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'greaterThan', 3), ctx)).toBe(true);
    });

    it('greaterThan — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'greaterThan', 5), ctx)).toBe(false);
    });

    it('greaterOrEqual — true equal', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'greaterOrEqual', 5), ctx)).toBe(true);
    });

    it('lessThan — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'lessThan', 10), ctx)).toBe(true);
    });

    it('lessOrEqual — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'lessOrEqual', 5), ctx)).toBe(true);
    });

    it('exists — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'exists'), ctx)).toBe(true);
    });

    it('exists — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.missing', 'exists'), ctx)).toBe(false);
    });

    it('regex — true', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'regex', '^te'), ctx)).toBe(true);
    });

    it('regex — false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'regex', '^ba'), ctx)).toBe(false);
    });

    it('regex — invalid pattern returns false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.name', 'regex', '['), ctx)).toBe(false);
    });

    it('nested field resolution', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.nested.val', 'equals', 42), ctx)).toBe(true);
    });

    it('unknown field returns undefined', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.missing', 'equals', undefined), ctx)).toBe(true);
    });

    it('contains — non-string non-array returns false', () => {
      expect(evaluator.evaluateExpression(fieldExpr('event.payload.count', 'contains', 'x'), ctx)).toBe(false);
    });
  });

  describe('DefaultConditionEvaluator — logical groups', () => {
    let evaluator: DefaultConditionEvaluator;
    const ctx = {
      event: { type: 't', payload: { a: true, b: false, c: 10, d: 20 }, timestamp: 0 },
      metadata: {},
    };

    beforeEach(() => {
      evaluator = new DefaultConditionEvaluator();
    });

    it('AND — all true', () => {
      expect(evaluator.evaluate(andGroup(
        fieldExpr('event.payload.a', 'equals', true),
        fieldExpr('event.payload.c', 'greaterThan', 5),
      ), ctx)).toBe(true);
    });

    it('AND — one false', () => {
      expect(evaluator.evaluate(andGroup(
        fieldExpr('event.payload.a', 'equals', true),
        fieldExpr('event.payload.b', 'equals', true),
      ), ctx)).toBe(false);
    });

    it('OR — any true', () => {
      expect(evaluator.evaluate(orGroup(
        fieldExpr('event.payload.b', 'equals', true),
        fieldExpr('event.payload.a', 'equals', true),
      ), ctx)).toBe(true);
    });

    it('OR — all false', () => {
      expect(evaluator.evaluate(orGroup(
        fieldExpr('event.payload.b', 'equals', true),
        fieldExpr('event.payload.c', 'lessThan', 0),
      ), ctx)).toBe(false);
    });

    it('NOT — negates', () => {
      expect(evaluator.evaluate(notGroup(fieldExpr('event.payload.b', 'equals', true)), ctx)).toBe(true);
    });

    it('nested groups', () => {
      expect(evaluator.evaluate(andGroup(
        fieldExpr('event.payload.a', 'equals', true),
        orGroup(
          fieldExpr('event.payload.b', 'equals', true),
          fieldExpr('event.payload.c', 'greaterThan', 5),
        ),
      ), ctx)).toBe(true);
    });

    it('negate group', () => {
      const negated: ConditionGroup = { operator: 'AND', conditions: [fieldExpr('event.payload.a', 'equals', true), fieldExpr('event.payload.b', 'equals', true)], negate: true };
      expect(evaluator.evaluate(negated, ctx)).toBe(true);
    });

    it('empty group returns true', () => {
      expect(evaluator.evaluate({ operator: 'AND', conditions: [] }, ctx)).toBe(true);
    });
  });

  describe('RuleEngine — evaluation', () => {
    it('should evaluate matching rules and execute actions', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });
      const rule = createRule('test-1', {
        name: 'Test Rule',
        enabled: true,
        priority: 10,
        trigger: { eventType: 'user.created' },
        conditions: andGroup(fieldExpr('event.payload.age', 'greaterOrEqual', 18)),
        actions: [publishAction('user.adult')],
      });

      ruleEngine.registry.registerRule(rule);

      const published: string[] = [];
      eventBus.subscribe('user.adult', () => published.push('user.adult'));

      const results = await ruleEngine.evaluate('user.created', { age: 25 });
      expect(results).toHaveLength(1);
      expect(results[0]!.ruleId).toBe('test-1');
      expect(results[0]!.success).toBe(true);
      expect(results[0]!.skipped).toBe(false);
      expect(published).toContain('user.adult');
    });

    it('should skip rules when conditions not met', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const rule = createRule('test-2', {
        name: 'Test Rule',
        enabled: true,
        priority: 10,
        trigger: { eventType: 'user.created' },
        conditions: andGroup(fieldExpr('event.payload.age', 'greaterOrEqual', 18)),
        actions: [publishAction('user.adult')],
      });
      ruleEngine.registry.registerRule(rule);

      const results = await ruleEngine.evaluate('user.created', { age: 12 });
      expect(results).toHaveLength(1);
      expect(results[0]!.skipped).toBe(true);
    });

    it('should skip disabled rules', async () => {
      const ruleEngine = new RuleEngine();
      const rule = makeTestRule('r5', { enabled: false });
      ruleEngine.registry.registerRule(rule);

      const results = await ruleEngine.evaluate('test.event', { count: 10 });
      expect(results).toHaveLength(0);
    });

    it('should process rules in priority order', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const executed: string[] = [];
      eventBus.subscribe(RuleEventType.RuleTriggered, (ev) => {
        executed.push((ev.payload as Record<string, unknown>).ruleId as string);
      });

      ruleEngine.registry.registerRule(makeTestRule('low', { priority: 1 }));
      ruleEngine.registry.registerRule(makeTestRule('high', { priority: 100 }));
      ruleEngine.registry.registerRule(makeTestRule('mid', { priority: 50 }));

      await ruleEngine.evaluate('test.event', { count: 10 });
      expect(executed[0]).toBe('high');
      expect(executed[1]).toBe('mid');
      expect(executed[2]).toBe('low');
    });

    it('should only match rules with matching trigger eventType', async () => {
      const ruleEngine = new RuleEngine();
      ruleEngine.registry.registerRule(makeTestRule('r1', { trigger: { eventType: 'order.created' } }));
      ruleEngine.registry.registerRule(makeTestRule('r2', { trigger: { eventType: 'invoice.paid' } }));

      const results = await ruleEngine.evaluate('order.created', { count: 10 });
      expect(results).toHaveLength(1);
      expect(results[0]!.ruleId).toBe('r1');
    });

    it('should evaluate trigger filter before conditions', async () => {
      const ruleEngine = new RuleEngine();
      const rule = createRule('filtered', {
        name: 'Filtered Rule',
        enabled: true,
        priority: 10,
        trigger: {
          eventType: 'order.created',
          filter: andGroup(fieldExpr('event.payload.shop', 'equals', 'west')),
        },
        conditions: andGroup(fieldExpr('event.payload.amount', 'greaterThan', 0)),
        actions: [publishAction('done')],
      });
      ruleEngine.registry.registerRule(rule);

      let results = await ruleEngine.evaluate('order.created', { shop: 'east', amount: 100 });
      expect(results[0]!.skipped).toBe(true);

      results = await ruleEngine.evaluate('order.created', { shop: 'west', amount: 100 });
      expect(results[0]!.skipped).toBe(false);
    });
  });

  describe('RuleEngine — actions', () => {
    it('should execute publishEvent action', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const rule = makeTestRule('r1', {
        conditions: andGroup(fieldExpr('event.payload.count', 'exists')),
        actions: [publishAction('custom.event', { hello: 'world' })],
      });
      ruleEngine.registry.registerRule(rule);

      const captured: unknown[] = [];
      eventBus.subscribe('custom.event', (ev) => {
        captured.push(ev.payload);
      });

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(captured).toHaveLength(1);
      expect(captured[0]).toEqual({ hello: 'world' });
    });

    it('should execute enqueueJob action', async () => {
      const jobQueue = createJobQueue('memory');
      const ruleEngine = new RuleEngine({ jobQueue });

      const rule = makeTestRule('r1', {
        conditions: andGroup(fieldExpr('event.payload.count', 'exists')),
        actions: [enqueueAction('send.email', { to: 'user' })],
      });
      ruleEngine.registry.registerRule(rule);

      await ruleEngine.evaluate('test.event', { count: 1 });

      const jobs = jobQueue.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]!.type).toBe('send.email');
      expect(jobs[0]!.payload).toEqual({ to: 'user' });
    });

    it('should execute logMessage action', async () => {
      const logger = makeLogger();
      const ruleEngine = new RuleEngine({ logger });

      const rule = makeTestRule('r1', {
        conditions: andGroup(fieldExpr('event.payload.count', 'exists')),
        actions: [logAction('Rule executed', 'info')],
      });
      ruleEngine.registry.registerRule(rule);

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(logger.logs.some((l) => l.includes('Rule executed'))).toBe(true);
    });

    it('should execute delay action', async () => {
      const ruleEngine = new RuleEngine();
      const rule = makeTestRule('r1', {
        conditions: andGroup(fieldExpr('event.payload.count', 'exists')),
        actions: [delayAction(50)],
      });
      ruleEngine.registry.registerRule(rule);

      const start = Date.now();
      await ruleEngine.evaluate('test.event', { count: 1 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('should execute stopEvaluation action', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const rule = createRule('r1', {
        name: 'Stopper',
        enabled: true,
        priority: 100,
        trigger: { eventType: 'test.event' },
        conditions: andGroup(fieldExpr('event.payload.count', 'exists')),
        actions: [stopAction(), publishAction('never.fires')],
      });
      ruleEngine.registry.registerRule(rule);

      const rule2 = makeTestRule('r2', { priority: 50 });
      ruleEngine.registry.registerRule(rule2);

      const triggered: string[] = [];
      eventBus.subscribe(RuleEventType.RuleTriggered, (ev) => {
        triggered.push((ev.payload as Record<string, unknown>).ruleId as string);
      });

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(triggered).toHaveLength(1);
      expect(triggered[0]).toBe('r1');
    });
  });

  describe('RuleEngine — event bus integration', () => {
    it('should publish RuleTriggered and RuleSucceeded events', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const events: string[] = [];
      eventBus.subscribe(RuleEventType.RuleTriggered, () => events.push('triggered'));
      eventBus.subscribe(RuleEventType.RuleSucceeded, () => events.push('succeeded'));

      ruleEngine.registry.registerRule(makeTestRule('r1'));
      await ruleEngine.evaluate('test.event', { count: 1 });

      expect(events).toContain('triggered');
      expect(events).toContain('succeeded');
    });

    it('should publish RuleFailed when action fails', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      let failed = false;
      eventBus.subscribe(RuleEventType.RuleFailed, () => { failed = true; });

      const rule = makeTestRule('r1', {
        actions: [{
          type: 'unknownType' as 'publishEvent',
          config: {},
        }],
      });
      ruleEngine.registry.registerRule(rule);

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(failed).toBe(true);
    });

    it('should publish RuleSkipped when conditions not met', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      let skipped = false;
      eventBus.subscribe(RuleEventType.RuleSkipped, () => { skipped = true; });

      const rule = createRule('r1', {
        name: 'Skipper',
        enabled: true,
        priority: 10,
        trigger: { eventType: 'test.event' },
        conditions: andGroup(fieldExpr('event.payload.x', 'exists')),
        actions: [publishAction('nope')],
      });
      ruleEngine.registry.registerRule(rule);

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(skipped).toBe(true);
    });
  });

  describe('RuleEngine — error handling', () => {
    it('should not stop evaluation when one rule fails', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const triggered: string[] = [];
      eventBus.subscribe(RuleEventType.RuleTriggered, (ev) => {
        triggered.push((ev.payload as Record<string, unknown>).ruleId as string);
      });

      ruleEngine.registry.registerRule(makeTestRule('failing', {
        actions: [{ type: 'unknownType' as never, config: {} }],
      }));
      ruleEngine.registry.registerRule(makeTestRule('ok', { priority: 5 }));

      await ruleEngine.evaluate('test.event', { count: 1 });
      expect(triggered).toContain('failing');
      expect(triggered).toContain('ok');
    });
  });

  describe('RuleEngine — metadata', () => {
    it('should pass metadata through', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      ruleEngine.registry.registerRule(makeTestRule('r1'));
      const results = await ruleEngine.evaluate('test.event', { count: 1 }, { metadata: { source: 'api' } });
      expect(results).toHaveLength(1);
    });
  });

  describe('RuleEngine — multiple rules', () => {
    it('should evaluate all matching rules', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      for (let i = 0; i < 5; i++) {
        ruleEngine.registry.registerRule(makeTestRule(`r${i}`, { priority: i }));
      }

      const results = await ruleEngine.evaluate('test.event', { count: 1 });
      expect(results).toHaveLength(5);
    });
  });

  describe('RuleEngine — no matching triggers', () => {
    it('should return empty array when no triggers match', async () => {
      const ruleEngine = new RuleEngine();
      ruleEngine.registry.registerRule(makeTestRule('r1'));
      const results = await ruleEngine.evaluate('unrelated.event', { count: 1 });
      expect(results).toHaveLength(0);
    });
  });

  describe('RuleEngine — abortOnFailure', () => {
    it('should stop evaluation on failure with abortOnFailure', async () => {
      const eventBus = new DefaultPlatformEventBus({ transport: new MemoryEventBusTransport(), defaultSource: 'test' });
      const ruleEngine = new RuleEngine({ eventBus });

      const triggered: string[] = [];
      eventBus.subscribe(RuleEventType.RuleTriggered, (ev) => {
        triggered.push((ev.payload as Record<string, unknown>).ruleId as string);
      });

      ruleEngine.registry.registerRule(makeTestRule('fail', {
        actions: [{ type: 'unknownType' as never, config: {} }],
        priority: 100,
      }));
      ruleEngine.registry.registerRule(makeTestRule('never', { priority: 1 }));

      await ruleEngine.evaluate('test.event', { count: 1 }, { abortOnFailure: true });
      expect(triggered).not.toContain('never');
    });
  });

  describe('createRule helper', () => {
    it('should create a valid rule with metadata', () => {
      const rule = makeTestRule('helper-test');
      expect(rule.id).toBe('helper-test');
      expect(rule.name).toBe('Rule helper-test');
      expect(rule.enabled).toBe(true);
      expect(rule.metadata.version).toBe(1);
      expect(rule.metadata.createdAt).toBeGreaterThan(0);
    });
  });
});