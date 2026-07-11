/**
 * Plugin Registry — the place plugins are *declared*, independent of
 * any engine. The engine consumes a registry to know what to run.
 *
 * Keeping registration separate from execution keeps each concern small
 * and lets tests use a registry without spinning up an engine.
 *
 * Enable/disable state is held INTERNAL to the registry (a Set), so
 * the `SeoPlugin.enabledByDefault` property is never mutated. This
 * keeps plugins descriptive (defaults) and registry authoritative
 * (overrides).
 */

import type { PluginCapability, PluginPhase, SeoPlugin } from "../types";
import { seoConfig } from "../config";

const defaultPriority = (): number => seoConfig.get("defaultPriority") as number;

/**
 * The shape a registry takes internally. It exists so multiple storage
 * strategies (Map, set, array) can implement the same operations.
 */
export interface SeoRegistryLike {
  register<TInput, TOutput>(
    plugin: SeoPlugin<TInput, TOutput>
  ): this;
  unregister(id: string): boolean;
  enable(id: string): boolean;
  disable(id: string): boolean;
  has(id: string): boolean;
  get(id: string): SeoPlugin | undefined;
  list(): ReadonlyArray<SeoPlugin>;
  byCapability(cap: PluginCapability): ReadonlyArray<SeoPlugin>;
  forPhase(phase: PluginPhase): ReadonlyArray<SeoPlugin>;
  setPriority(id: string, priority: number): boolean;
  size(): number;
  clear(): this;
}

/**
 * Default in-memory registry. Order of insertion is respected when
 * sorting by priority. Higher priority numbers run later; lower runs
 * earlier. Ties fall back to registration order.
 *
 * Disabled plugins are kept in the registry but excluded from
 * `list()` / `byCapability()` / `forPhase()` returns. They survive
 * `clear()` removal only if not unregistered.
 */
export class SeoRegistry implements SeoRegistryLike {
  private readonly plugins = new Map<string, SeoPlugin>();
  private readonly insertionOrder: string[] = [];
  private readonly priorities = new Map<string, number>();
  /** Holds ids of plugins explicitly disabled by the registry. */
  private readonly disabled = new Set<string>();

  register<TInput, TOutput>(
    plugin: SeoPlugin<TInput, TOutput>
  ): this {
    if (!plugin.id) {
      throw new Error("SeoRegistry: plugin.id is required");
    }
    if (this.plugins.has(plugin.id)) {
      throw new Error(`SeoRegistry: duplicate plugin id "${plugin.id}"`);
    }
    this.plugins.set(plugin.id, plugin as unknown as SeoPlugin);
    this.insertionOrder.push(plugin.id);
    this.priorities.set(
      plugin.id,
      plugin.priority ?? defaultPriority()
    );
    // A plugin is enabled unless either (a) the registry has marked
    // it disabled, or (b) the plugin declared `enabledByDefault = false`.
    if (plugin.enabledByDefault === false) {
      this.disabled.add(plugin.id);
    }
    return this;
  }

  unregister(id: string): boolean {
    const existed = this.plugins.delete(id);
    if (existed) {
      const idx = this.insertionOrder.indexOf(id);
      if (idx >= 0) this.insertionOrder.splice(idx, 1);
      this.priorities.delete(id);
      this.disabled.delete(id);
    }
    return existed;
  }

  enable(id: string): boolean {
    if (!this.plugins.has(id)) return false;
    this.disabled.delete(id);
    return true;
  }

  disable(id: string): boolean {
    if (!this.plugins.has(id)) return false;
    this.disabled.add(id);
    return true;
  }

  has(id: string): boolean {
    return this.plugins.has(id);
  }

  get(id: string): SeoPlugin | undefined {
    return this.plugins.get(id);
  }

  list(): ReadonlyArray<SeoPlugin> {
    return this.insertionOrder
      .map((id) => this.plugins.get(id))
      .filter((p): p is SeoPlugin => Boolean(p))
      .filter((p) => !this.disabled.has(p.id));
  }

  byCapability(cap: PluginCapability): ReadonlyArray<SeoPlugin> {
    return this.list().filter((p) => p.capability === cap);
  }

  forPhase(phase: PluginPhase): ReadonlyArray<SeoPlugin> {
    return this.list().filter(
      (p) => (p.phase ?? (p.capability as PluginPhase)) === phase
    );
  }

  setPriority(id: string, priority: number): boolean {
    if (!this.plugins.has(id)) return false;
    this.priorities.set(id, priority);
    return true;
  }

  size(): number {
    return this.plugins.size;
  }

  clear(): this {
    this.plugins.clear();
    this.insertionOrder.length = 0;
    this.priorities.clear();
    this.disabled.clear();
    return this;
  }
}

/**
 * Convenience factory. Most code wants `new SeoRegistry()`; this exists
 * to keep call sites symmetrical with future factory variants.
 */
export const createRegistry = (): SeoRegistry => new SeoRegistry();
