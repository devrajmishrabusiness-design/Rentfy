export type QueryOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';

export interface QueryFilter<T = unknown> {
  field: keyof T;
  operator: QueryOperator;
  value: unknown;
}

export interface QuerySort<T = unknown> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

export interface QueryOptions<T = unknown> {
  filters?: QueryFilter<T>[];
  sort?: QuerySort<T>[];
  limit?: number;
  offset?: number;
}

export interface RepositoryQueryResult<T = unknown> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}