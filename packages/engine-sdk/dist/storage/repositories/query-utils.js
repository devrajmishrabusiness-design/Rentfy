"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFilters = applyFilters;
exports.applySort = applySort;
exports.applyPagination = applyPagination;
function applyFilters(items, filters) {
    if (!filters.length)
        return items;
    let remaining = items;
    for (const filter of filters) {
        remaining = remaining.filter((item) => evaluateFilter(item, filter));
    }
    return remaining;
}
function applySort(items, sort) {
    if (!sort.length)
        return items;
    const clone = [...items];
    clone.sort((a, b) => {
        for (const s of sort) {
            const aVal = a[s.field];
            const bVal = b[s.field];
            let cmp = 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                cmp = aVal - bVal;
            }
            else if (typeof aVal === 'string' && typeof bVal === 'string') {
                cmp = aVal.localeCompare(bVal);
            }
            else {
                cmp = String(aVal).localeCompare(String(bVal));
            }
            if (cmp !== 0)
                return s.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
    });
    return clone;
}
function applyPagination(items, offset, limit) {
    return items.slice(offset, offset + limit);
}
function evaluateFilter(item, filter) {
    const fieldValue = item[filter.field];
    const testValue = filter.value;
    switch (filter.operator) {
        case 'eq': return fieldValue === testValue;
        case 'neq': return fieldValue !== testValue;
        case 'gt': return fieldValue > testValue;
        case 'gte': return fieldValue >= testValue;
        case 'lt': return fieldValue < testValue;
        case 'lte': return fieldValue <= testValue;
        case 'contains': return typeof fieldValue === 'string' && typeof testValue === 'string' && fieldValue.includes(testValue);
        case 'startsWith': return typeof fieldValue === 'string' && typeof testValue === 'string' && fieldValue.startsWith(testValue);
        case 'endsWith': return typeof fieldValue === 'string' && typeof testValue === 'string' && fieldValue.endsWith(testValue);
        case 'in': return Array.isArray(testValue) && testValue.includes(fieldValue);
        case 'notIn': return Array.isArray(testValue) && !testValue.includes(fieldValue);
        default: return false;
    }
}
//# sourceMappingURL=query-utils.js.map