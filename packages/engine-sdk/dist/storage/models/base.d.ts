export interface KeyValueModel<T = unknown> {
    key: string;
    value: T;
    metadata?: Record<string, unknown>;
    createdAt?: number;
    updatedAt?: number;
}
export interface DocumentModel<T = unknown> {
    id: string;
    content: T;
    metadata?: Record<string, unknown>;
    createdAt?: number;
    updatedAt?: number;
}
export type StorageModel<T = unknown> = KeyValueModel<T> | DocumentModel<T>;
//# sourceMappingURL=base.d.ts.map