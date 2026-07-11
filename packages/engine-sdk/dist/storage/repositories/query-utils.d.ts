import type { QueryFilter, QuerySort } from '../models/query';
export declare function applyFilters<T>(items: T[], filters: QueryFilter<T>[]): T[];
export declare function applySort<T>(items: T[], sort: QuerySort<T>[]): T[];
export declare function applyPagination<T>(items: T[], offset: number, limit: number): T[];
//# sourceMappingURL=query-utils.d.ts.map