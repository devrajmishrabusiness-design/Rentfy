import type { ConfigProvider } from '../interfaces/provider';

export class MemoryConfigProvider implements ConfigProvider {
  readonly name = 'memory';
  readonly priority = 100;
  private readonly store: Map<string, Record<string, unknown>> = new Map();

  async load(namespace?: string): Promise<Record<string, unknown>> {
    const ns = namespace ?? 'default';
    return this.store.get(ns) ?? {};
  }

  async has(key: string, namespace?: string): Promise<boolean> {
    const ns = namespace ?? 'default';
    const data = this.store.get(ns);
    return data !== undefined && key in data;
  }

  set(key: string, value: unknown, namespace?: string): void {
    const ns = namespace ?? 'default';
    let data = this.store.get(ns);
    if (!data) {
      data = {};
      this.store.set(ns, data);
    }
    data[key] = value;
  }

  clear(namespace?: string): void {
    if (namespace) {
      this.store.delete(namespace);
    } else {
      this.store.clear();
    }
  }
}