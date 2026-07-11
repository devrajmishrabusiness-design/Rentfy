import type { ConfigProvider } from '../interfaces/provider';

export class EnvConfigProvider implements ConfigProvider {
  readonly name = 'env';
  readonly priority = 200;
  private readonly prefix: string;

  constructor(prefix: string = 'APP_') {
    this.prefix = prefix;
  }

  async load(namespace?: string): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    const ns = namespace ?? 'default';

    for (const [rawKey, rawValue] of Object.entries(process.env)) {
      if (!rawKey.startsWith(this.prefix)) continue;
      if (rawValue === undefined) continue;

      const key = rawKey.slice(this.prefix.length).toLowerCase();

      const typed = this.coerce(rawValue);

      if (ns === 'default') {
        result[key] = typed;
      } else {
        result[key] = typed;
      }
    }

    return result;
  }

  async has(key: string, _namespace?: string): Promise<boolean> {
    const envKey = `${this.prefix}${key.toUpperCase()}`;
    return process.env[envKey] !== undefined;
  }

  private coerce(value: string): string | number | boolean {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      const n = Number(value);
      if (!isNaN(n)) return n;
    }
    return value;
  }
}