"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildItemKey = buildItemKey;
exports.parseItemKey = parseItemKey;
function buildItemKey(collection, id) {
    return `${collection}:${id}`;
}
function parseItemKey(key) {
    const idx = key.indexOf(':');
    if (idx <= 0 || idx === key.length - 1) {
        return null;
    }
    return {
        collection: key.slice(0, idx),
        id: key.slice(idx + 1),
    };
}
//# sourceMappingURL=key-factory.js.map