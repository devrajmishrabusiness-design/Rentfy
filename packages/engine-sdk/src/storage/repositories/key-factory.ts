export function buildItemKey(collection: string, id: string): string {
  return `${collection}:${id}`;
}

export function parseItemKey(key: string): { collection: string; id: string } | null {
  const idx = key.indexOf(':');
  if (idx <= 0 || idx === key.length - 1) {
    return null;
  }
  return {
    collection: key.slice(0, idx),
    id: key.slice(idx + 1),
  };
}