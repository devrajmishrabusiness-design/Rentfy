import type { EngineEvent, EngineEventHandler, EventBus } from '../types';
import { DefaultPlatformEventBus, MemoryEventBusTransport } from '../event-bus';
import type { PlatformEvent, Subscription } from '../event-bus';

export class DefaultEventBus implements EventBus {
  private readonly bus = new DefaultPlatformEventBus({
    transport: new MemoryEventBusTransport(),
  });

  private readonly handlerSubs = new Map<EngineEventHandler, Subscription[]>();

  on(event: string, handler: EngineEventHandler): void {
    const wrapped = (platformEvent: PlatformEvent<EngineEvent>) => {
      const engineEvent = platformEvent.payload as EngineEvent;
      handler(engineEvent);
    };
    const sub = this.bus.subscribe(event, wrapped);
    this.trackSub(handler, sub);
  }

  off(event: string, handler: EngineEventHandler): void {
    const subs = this.handlerSubs.get(handler);
    if (subs) {
      const remaining: Subscription[] = [];
      for (const sub of subs) {
        if (sub.type === event) {
          sub.unsubscribe();
        } else {
          remaining.push(sub);
        }
      }
      if (remaining.length === 0) {
        this.handlerSubs.delete(handler);
      } else {
        this.handlerSubs.set(handler, remaining);
      }
    }
  }

  emit(event: EngineEvent): void {
    this.bus.publish(event.type, event, { source: event.source });
  }

  once(event: string, handler: EngineEventHandler): void {
    const wrapped = (platformEvent: PlatformEvent<EngineEvent>) => {
      const engineEvent = platformEvent.payload as EngineEvent;
      handler(engineEvent);
    };
    const sub = this.bus.once(event, wrapped);
    this.trackSub(handler, sub);
  }

  clear(): void {
    this.handlerSubs.clear();
    this.bus.clear();
  }

  getHandlerCount(event: string): number {
    return this.bus.listenerCount(event);
  }

  hasHandlers(event: string): boolean {
    return this.bus.hasListeners(event);
  }

  private trackSub(handler: EngineEventHandler, sub: Subscription): void {
    const subs = this.handlerSubs.get(handler);
    if (subs) {
      subs.push(sub);
    } else {
      this.handlerSubs.set(handler, [sub]);
    }
  }
}