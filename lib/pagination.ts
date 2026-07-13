const DEFAULT_PAGE_SIZE = 12;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function clampPage(raw: unknown, totalPages: number | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  if (totalPages !== null && n > totalPages) return totalPages;
  return n;
}

function clampPageSize(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(n, 1), 100);
}

export function extractPagination(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  defaultSize = DEFAULT_PAGE_SIZE
): PaginationParams {
  const get = (key: string) => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(key);
    const val = searchParams[key];
    return Array.isArray(val) ? val[0] : val ?? null;
  };
  const page = clampPage(get("page"), null);
  const pageSize = clampPageSize(get("pageSize")) ?? defaultSize;
  return { page, pageSize };
}

export function toRange(params: PaginationParams): [number, number] {
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  return [from, to];
}

export function respondPaginated<T>(
  items: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const page = clampPage(params.page, totalPages);
  return {
    items,
    page,
    pageSize: params.pageSize,
    totalCount,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}