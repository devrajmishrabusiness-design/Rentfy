export interface StorageSnapshot<T = unknown> {
  readonly keys: string[];
  readonly entries: ReadonlyMap<string, T>;
}

export interface StorageProvider {
  readonly name: string;

  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  snapshot(): Promise<StorageSnapshot>;
}