import type {
  EventHandler,
  PlatformEvent,
  PlatformEventType,
} from '../interfaces/event';
import type { Subscription } from '../interfaces/subscription';
import type { EventBusTransport } from '../interfaces/bus';

class TransportSubscription implements Subscription {
  public readonly id: string;
  public readonly type: PlatformEventType;
  private readonly cancel: () => void;

  constructor(id: string, type: PlatformEventType, cancel: () => void) {
    this.id = id;
    this.type = type;
    this.cancel = cancel;
  }

  unsubscribe(): void {
    this.cancel();
  }
}

interface Entry {
  readonly id: string;
  readonly handler: EventHandler;
  readonly once: boolean;
  cancelled: boolean;
}

export class MemoryEventBusTransport implements EventBusTransport {
  public readonly kind = 'memory';

  private readonly entries = new Map<PlatformEventType, Entry[]>();
  private readonly entryBySub = new Map<string, Entry>();
  private subscriptionCounter = 0;
  private iterationToken = 0;

  publish(event: PlatformEvent): void {
    const type = event.type;
    const snapshot = this.entries.get(type);
    if (!snapshot || snapshot.length === 0) {
      return;
    }

    const token = ++this.iterationToken;

    for (const entry of snapshot) {
      if (entry.cancelled) continue;

      if (entry.once) {
        entry.cancelled = true;
      }

      this.invokeSafely(entry, event);
    }

    if (this.iterationToken === token) {
      this.compact(type);
    }
  }

  on(type: PlatformEventType, handler: EventHandler): Subscription {
    return this.register(type, handler, false);
  }

  off(subscription: Subscription): void {
    const entry = this.entryBySub.get(subscription.id);
    if (!entry) return;
    entry.cancelled = true;
    for (const [t, list] of this.entries) {
      if (list.includes(entry)) {
        this.compact(t);
        return;
      }
    }
  }

  clear(): void {
    this.entries.clear();
    this.entryBySub.clear();
  }

  listenerCount(type: PlatformEventType): number {
    const list = this.entries.get(type);
    if (!list) return 0;
    let n = 0;
    for (const e of list) {
      if (!e.cancelled) n++;
    }
    return n;
  }

  trackedTypes(): readonly PlatformEventType[] {
    return Array.from(this.entries.keys());
  }

  private register(type: PlatformEventType, handler: EventHandler, once: boolean): Subscription {
    const subId = `sub_${++this.subscriptionCounter}`;
    const entry: Entry = {
      id: subId,
      handler,
      once,
      cancelled: false,
    };
    const list = this.entries.get(type);
    if (list) {
      list.push(entry);
    } else {
      this.entries.set(type, [entry]);
    }
    this.entryBySub.set(subId, entry);
    return new TransportSubscription(subId, type, () => {
      entry.cancelled = true;
    });
  }

  private invokeSafely(entry: Entry, event: PlatformEvent): void {
    const wrappedHandler = wrapHandlerForIsolation(entry.handler);
    wrappedHandler(event);
  }

  private compact(type: PlatformEventType): void {
    const list = this.entries.get(type);
    if (!list) return;
    const survivors = list.filter((e) => !e.cancelled);
    for (const e of list) {
      if (e.cancelled) {
        this.entryBySub.delete(e.id);
      }
    }
    if (survivors.length === 0) {
      this.entries.delete(type);
    } else if (survivors.length !== list.length) {
      this.entries.set(type, survivors);
    }
  }
}

function wrapHandlerForIsolation(handler: EventHandler): EventHandler {
  return ((event: PlatformEvent) => {
    try {
      const result = handler(event);
      if (result && typeof (result as Promise<void>).then === 'function') {
        (result as Promise<void>).catch(() => {
          /* swallowed — reporter at bus level handles this */
        });
      }
    } catch {
      /* swallowed — reporter at bus level handles this */
    }
  }) as EventHandler;
}