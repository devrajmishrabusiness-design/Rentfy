import type { EngineEvent, EngineEventHandler, EventBus } from '../types';

export class DefaultEventBus implements EventBus {
  private handlers = new Map<string, Set<EngineEventHandler>>();
  private onceHandlers = new Map<string, Set<EngineEventHandler>>();

  on(event: string, handler: EngineEventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EngineEventHandler): void {
    this.handlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
  }

  emit(event: EngineEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    const onceHandlers = this.onceHandlers.get(event.type);
    if (onceHandlers) {
      for (const handler of onceHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in once event handler for ${event.type}:`, error);
        }
      }
      this.onceHandlers.delete(event.type);
    }
  }

  once(event: string, handler: EngineEventHandler): void {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }
    this.onceHandlers.get(event)!.add(handler);
  }

  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
  }

  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  hasHandlers(event: string): boolean {
    return (this.handlers.get(event)?.size ?? 0) > 0;
  }
}