import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageProvider } from '../src/storage/providers/memory';
import { Storage } from '../src/storage/storage-facade';
import { StorageNotFoundError } from '../src/storage/errors/storage-errors';
import type {
  KeyValueModel,
  DocumentModel,
  QueryFilter,
  QueryOptions,
} from '../src/storage';

describe('Shared Storage', () => {
  describe('MemoryStorageProvider', () => {
    let provider: MemoryStorageProvider;

    beforeEach(() => {
      provider = new MemoryStorageProvider();
    });

    it('should set and get a value', async () => {
      await provider.set('key1', 'hello');
      const result = await provider.get<string>('key1');
      expect(result).toBe('hello');
    });

    it('should return null for non-existent key', async () => {
      const result = await provider.get('missing');
      expect(result).toBeNull();
    });

    it('should check key existence', async () => {
      await provider.set('key1', 'value');
      expect(await provider.has('key1')).toBe(true);
      expect(await provider.has('key2')).toBe(false);
    });

    it('should delete a key', async () => {
      await provider.set('key1', 'value');
      await provider.delete('key1');
      expect(await provider.has('key1')).toBe(false);
    });

    it('should list all keys', async () => {
      await provider.set('key1', 'v1');
      await provider.set('key2', 'v2');
      const keys = await provider.keys();
      expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
      expect(keys).toHaveLength(2);
    });

    it('should clear all entries', async () => {
      await provider.set('key1', 'v1');
      await provider.set('key2', 'v2');
      await provider.clear();
      const keys = await provider.keys();
      expect(keys).toHaveLength(0);
    });

    it('should provide a snapshot', async () => {
      await provider.set('a', 1);
      await provider.set('b', 2);
      const snap = await provider.snapshot();
      expect(snap.keys).toEqual(expect.arrayContaining(['a', 'b']));
      expect(snap.keys).toHaveLength(2);
      expect(snap.entries.get('a')).toBe(1);
    });
  });

  describe('MemoryStorageProvider — Transactions', () => {
    let provider: MemoryStorageProvider;

    beforeEach(() => {
      provider = new MemoryStorageProvider();
    });

    it('should commit transaction', async () => {
      await provider.set('name', 'initial');
      await provider.beginTransaction();
      await provider.set('name', 'updated');
      await provider.commitTransaction();
      expect(await provider.get<string>('name')).toBe('updated');
    });

    it('should rollback transaction', async () => {
      await provider.set('name', 'original');
      await provider.beginTransaction();
      await provider.set('name', 'changed');
      await provider.set('extra', 'new');
      await provider.rollbackTransaction();
      expect(await provider.get<string>('name')).toBe('original');
      expect(await provider.has('extra')).toBe(false);
    });

    it('should handle nested begin as no-op', async () => {
      await provider.set('a', 1);
      await provider.beginTransaction();
      await provider.set('a', 2);
      await provider.beginTransaction();
      await provider.set('a', 3);
      await provider.commitTransaction();
      expect(await provider.get<number>('a')).toBe(3);
    });

    it('should allow rollback of empty transaction', async () => {
      await provider.set('a', 1);
      await provider.rollbackTransaction();
      expect(await provider.get<number>('a')).toBe(1);
    });

    it('should handle commit without begin gracefully', async () => {
      await provider.set('a', 1);
      await provider.commitTransaction();
      expect(await provider.get<number>('a')).toBe(1);
    });
  });

  describe('Storage — KeyValue operations', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    it('should create a key-value item', async () => {
      const item = await storage.create('settings', {
        key: 'theme',
        value: 'dark',
      } as KeyValueModel);
      expect(item.key).toBe('theme');
      expect(item.value).toBe('dark');
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should save (upsert) a key-value item', async () => {
      await storage.create('settings', {
        key: 'theme',
        value: 'dark',
      } as KeyValueModel);
      const saved = await storage.save('settings', {
        key: 'theme',
        value: 'light',
      } as KeyValueModel);
      expect(saved.value).toBe('light');
      expect(saved.updatedAt).toBeDefined();
    });

    it('should update a key-value item', async () => {
      await storage.create('settings', {
        key: 'region',
        value: 'us',
      } as KeyValueModel);
      const updated = await storage.update('settings', 'region', {
        value: 'eu',
      } as Partial<KeyValueModel>);
      expect(updated).not.toBeNull();
      expect((updated as KeyValueModel).value).toBe('eu');
    });

    it('should throw on update of non-existent item', async () => {
      await expect(
        storage.update('settings', 'no-such-key', { value: 'x' } as Partial<KeyValueModel>),
      ).rejects.toThrow(StorageNotFoundError);
    });

    it('should delete a key-value item', async () => {
      await storage.create('settings', {
        key: 'temp',
        value: 'remove-me',
      } as KeyValueModel);
      const deleted = await storage.delete('settings', 'temp');
      expect(deleted).toBe(true);
    });

    it('should return false on delete of non-existent item', async () => {
      const result = await storage.delete('settings', 'ghost');
      expect(result).toBe(false);
    });

    it('should find by id', async () => {
      await storage.create('settings', {
        key: 'lang',
        value: 'en',
      } as KeyValueModel);
      const found = await storage.findById('settings', 'lang');
      expect(found).not.toBeNull();
      expect((found as KeyValueModel).value).toBe('en');
    });

    it('should return null for missing item', async () => {
      const result = await storage.findById('settings', 'nope');
      expect(result).toBeNull();
    });

    it('should find with pagination', async () => {
      for (let i = 0; i < 10; i++) {
        await storage.create('items', {
          key: `k${i}`,
          value: i,
        } as KeyValueModel);
      }
      const result = await storage.find('items', {
        offset: 2,
        limit: 5,
      } as QueryOptions<KeyValueModel>);
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.offset).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should query with filter', async () => {
      await storage.create('items', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('items', { key: 'b', value: 2 } as KeyValueModel);
      await storage.create('items', { key: 'c', value: 1 } as KeyValueModel);
      const results = await storage.query('items', {
        field: 'value',
        operator: 'eq',
        value: 1,
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(2);
    });

    it('should clear a specific collection', async () => {
      await storage.create('temp', { key: 'x', value: 1 } as KeyValueModel);
      await storage.create('perm', { key: 'y', value: 2 } as KeyValueModel);
      await storage.clear('temp');
      const tempItem = await storage.findById('temp', 'x');
      expect(tempItem).toBeNull();
      const permItem = await storage.findById('perm', 'y');
      expect(permItem).not.toBeNull();
    });

    it('should clear all collections', async () => {
      await storage.create('a', { key: 'k1', value: 1 } as KeyValueModel);
      await storage.create('b', { key: 'k2', value: 2 } as KeyValueModel);
      await storage.clear();
      expect(await storage.findById('a', 'k1')).toBeNull();
      expect(await storage.findById('b', 'k2')).toBeNull();
    });
  });

  describe('Storage — Document operations', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    it('should create a document', async () => {
      const doc = (await storage.create('articles', {
        id: 'doc-1',
        content: { title: 'Hello', body: 'World' },
      } as DocumentModel)) as DocumentModel;
      expect(doc.id).toBe('doc-1');
      expect(doc.content).toEqual({ title: 'Hello', body: 'World' });
    });

    it('should find document by id', async () => {
      await storage.create('articles', {
        id: 'post-1',
        content: { text: 'important' },
      } as DocumentModel);
      const doc = await storage.findById('articles', 'post-1');
      expect(doc).not.toBeNull();
      expect((doc as DocumentModel).content).toEqual({ text: 'important' });
    });

    it('should update document', async () => {
      await storage.create('articles', {
        id: 'post-1',
        content: { title: 'Old' },
      } as DocumentModel);
      const updated = await storage.update('articles', 'post-1', {
        content: { title: 'New' },
      } as Partial<DocumentModel>);
      expect((updated as DocumentModel).content).toEqual({ title: 'New' });
    });

    it('should delete document', async () => {
      await storage.create('articles', {
        id: 'post-1',
        content: { title: 'Remove' },
      } as DocumentModel);
      expect(await storage.delete('articles', 'post-1')).toBe(true);
    });
  });

  describe('Storage — Custom provider', () => {
    it('should accept a custom provider', async () => {
      const custom = new MemoryStorageProvider();
      const storage = new Storage({ provider: custom });
      await storage.create('kv', { key: 'x', value: 1 } as KeyValueModel);
      expect(await storage.getProvider().has('kv:x')).toBe(true);
    });

    it('should pre-register collections', async () => {
      const storage = new Storage({
        collections: ['default'],
      });
      await storage.create('default', { key: 'a', value: 1 } as KeyValueModel);
      expect(await storage.findById('default', 'a')).not.toBeNull();
    });
  });

  describe('Storage — find with query options', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    it('should filter with eq', async () => {
      await storage.create('kv', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 2 } as KeyValueModel);
      await storage.create('kv', { key: 'c', value: 1 } as KeyValueModel);
      const result = await storage.find('kv', {
        filters: [{ field: 'value', operator: 'eq', value: 1 }],
      } as QueryOptions<KeyValueModel>);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter with gt', async () => {
      await storage.create('scores', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('scores', { key: 'b', value: 5 } as KeyValueModel);
      await storage.create('scores', { key: 'c', value: 10 } as KeyValueModel);
      const result = await storage.find('scores', {
        filters: [{ field: 'value', operator: 'gt', value: 4 }],
      } as QueryOptions<KeyValueModel>);
      expect(result.items).toHaveLength(2);
    });

    it('should sort ascending', async () => {
      await storage.create('scores', { key: 'c', value: 10 } as KeyValueModel);
      await storage.create('scores', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('scores', { key: 'b', value: 5 } as KeyValueModel);
      const result = await storage.find('scores', {
        sort: [{ field: 'value', direction: 'asc' }],
      } as QueryOptions<KeyValueModel>);
      expect(result.items.map((i: KeyValueModel) => i.value)).toEqual([1, 5, 10]);
    });

    it('should sort descending', async () => {
      await storage.create('scores', { key: 'c', value: 10 } as KeyValueModel);
      await storage.create('scores', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('scores', { key: 'b', value: 5 } as KeyValueModel);
      const result = await storage.find('scores', {
        sort: [{ field: 'value', direction: 'desc' }],
      } as QueryOptions<KeyValueModel>);
      expect(result.items.map((i: KeyValueModel) => i.value)).toEqual([10, 5, 1]);
    });

    it('should return empty for unregistered collection', async () => {
      const result = await storage.find('unknown');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Storage — Query operators', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    it('should handle neq operator', async () => {
      await storage.create('kv', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 2 } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'neq', value: 1,
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
      expect((results[0] as KeyValueModel).value).toBe(2);
    });

    it('should handle contains operator on string fields', async () => {
      await storage.create('kv', { key: 'a', value: 'hello world' } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 'goodbye' } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'contains', value: 'hello',
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });

    it('should handle startsWith operator', async () => {
      await storage.create('kv', { key: 'a', value: 'prefix-abc' } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 'other' } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'startsWith', value: 'prefix',
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });

    it('should handle endsWith operator', async () => {
      await storage.create('kv', { key: 'a', value: 'file.ts' } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 'file.js' } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'endsWith', value: '.ts',
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });

    it('should handle in operator', async () => {
      await storage.create('kv', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 2 } as KeyValueModel);
      await storage.create('kv', { key: 'c', value: 3 } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'in', value: [1, 3],
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(2);
    });

    it('should handle notIn operator', async () => {
      await storage.create('kv', { key: 'a', value: 1 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 2 } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'notIn', value: [1],
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });

    it('should handle gte operator', async () => {
      await storage.create('kv', { key: 'a', value: 5 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 3 } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'gte', value: 5,
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });

    it('should handle lt operator', async () => {
      await storage.create('kv', { key: 'a', value: 2 } as KeyValueModel);
      await storage.create('kv', { key: 'b', value: 5 } as KeyValueModel);
      const results = await storage.query('kv', {
        field: 'value', operator: 'lt', value: 5,
      } as QueryFilter<KeyValueModel>);
      expect(results).toHaveLength(1);
    });
  });

  describe('Storage — Delete behavior', () => {
    let storage: Storage;

    beforeEach(() => {
      storage = new Storage();
    });

    it('should return false for delete on unknown collection', async () => {
      const result = await storage.delete('unknown', 'id');
      expect(result).toBe(false);
    });

    it('should return null for findById on unknown collection', async () => {
      const result = await storage.findById('unknown', 'id');
      expect(result).toBeNull();
    });
  });
});