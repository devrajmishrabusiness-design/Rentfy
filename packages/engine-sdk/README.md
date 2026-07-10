# @rentfy/engine-sdk

Core Engine SDK for the Website Intelligence Platform.

## Overview

The Engine SDK provides a standardized foundation for building platform engines. It implements:

- **Engine Interface** - Base engine with lifecycle management
- **Plugin System** - Extensible plugin architecture with dependency resolution
- **Execution Context** - Shared context for configuration, logging, storage, metrics, and events
- **Lifecycle Management** - Coordinated initialization, execution, and shutdown
- **Error Handling** - Structured error model with metadata
- **Versioning** - SDK version management and compatibility checking

## Installation

```bash
npm install @rentfy/engine-sdk
```

## Quick Start

```typescript
import { AbstractEngine, PluginDefinition, SDK_VERSION } from '@rentfy/engine-sdk';

// Define your engine
class MyEngine extends AbstractEngine {
  info = { name: 'my-engine', version: '1.0.0' };

  async validateConfig(config: MyEngineConfig): Promise<void> {
    // Validate config
  }

  async registerPlugins(plugins: PluginConfig[]): Promise<void> {
    // Register plugins
  }

  async onInitialize(): Promise<void> {
    // Custom initialization
  }

  async onStart(): Promise<void> {
    // Engine-specific start logic
  }

  async onStop(): Promise<void> {
    // Engine-specific stop logic
  }

  async onDispose(): Promise<void> {
    // Cleanup
  }
}

// Define a plugin
const myPlugin: PluginDefinition = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  phase: 'process',
  priority: 100,
  execute: async (input, context) => {
    // Plugin logic
    return { processed: true };
  },
};

// Run the engine
const engine = new MyEngine(config);
await engine.initialize();
await engine.start();
const result = await engine.run(input, 'process');
await engine.stop();
await engine.dispose();
```

## Core Concepts

### Engine Lifecycle

```
uninitialized -> initializing -> idle -> running -> stopping -> stopped -> error
```

1. **initialize()** - Validates config, registers plugins, validates dependencies, initializes plugins
2. **start()** - Begins engine operation
3. **run()** - Executes a phase with registered plugins
4. **stop()** - Gracefully stops execution
5. **dispose()** - Cleans up resources

### Plugin Architecture

Plugins are the primary extension mechanism:

```typescript
const plugin: PluginDefinition<Input, Output, Config> = {
  id: 'unique-plugin-id',
  name: 'Display Name',
  version: '1.0.0',
  phase: 'process',        // Execution phase
  priority: 100,           // Lower runs first
  dependencies: ['other-plugin-id'],
  config: { option: true }, // Plugin config
  validateConfig: (config) => boolean,
  execute: async (input, context) => Output,
  onInit: async (context) => void,
  onShutdown: async (context) => void,
};
```

### Plugin Phases

Plugins are grouped by phase and executed in priority order (lower = first):

- `bootstrap` - Engine initialization
- `discover` - Discovery operations
- `process` - Main processing
- `analyze` - Analysis operations
- `generate` - Content generation
- `report` - Reporting
- `cleanup` - Cleanup operations
- `default` - Default phase

### Dependency Resolution

Plugins declare dependencies which are validated on initialization:

```typescript
const pluginA = { id: 'plugin-a', ... };
const pluginB = { id: 'plugin-b', dependencies: ['plugin-a'], ... };
// plugin-a will always execute before plugin-b
```

Cycles are detected and reported as errors.

## API Reference

### Engine

```typescript
interface AbstractEngine<Config> {
  info: EngineInfo;
  config: Config;
  status: EngineStatus;
  metrics: EngineMetrics;

  initialize(config?: Partial<Config>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  health(): Promise<EngineHealth>;

  on(event: string, handler: EngineEventHandler): void;
  off(event: string, handler: EngineEventHandler): void;
  emit(event: EngineEvent): void;
}
```

### Plugin Registry

```typescript
interface PluginRegistry {
  register<Input, Output, Config>(plugin: PluginDefinition): void;
  unregister(pluginId: string): boolean;
  get<Input, Output, Config>(pluginId: string): PluginDefinition | undefined;
  getAll(): PluginDefinition[];
  getByPhase(phase: string): PluginDefinition[];
  getEnabled(): PluginDefinition[];
  isRegistered(pluginId: string): boolean;
  enable(pluginId: string): boolean;
  disable(pluginId: string): boolean;
  getDependencyGraph(): Map<string, string[]>;
  validateDependencies(): { valid: boolean; cycles: string[][]; missing: string[] };
  clear(): void;
}
```

### Plugin Executor

```typescript
interface PluginExecutor {
  initialize<Config>(plugin: PluginDefinition, context: PluginInitContext<Config>): Promise<void>;
  execute<Input, Output, Config>(plugin: PluginDefinition, input: Input, context: PluginExecutionContext<Config>): Promise<PluginResult<Output>>;
  shutdown(plugin: PluginDefinition, context: PluginShutdownContext): Promise<void>;
  abort(pluginId: string): void;
  abortAll(): void;
}
```

### Context Services

All context services are interfaces that can be implemented for different environments:

- **EventBus** - Pub/sub event system
- **EngineLogger** - Structured logging
- **EngineStorage** - Key-value storage
- **EngineMetrics** - Metrics collection

Default in-memory implementations are provided.

### Error Model

```typescript
class EngineError extends Error {
  code: EngineErrorCode;
  details?: Record<string, unknown>;
  cause?: Error;
  timestamp: number;
}

class PluginError extends EngineError {
  pluginId: string;
}

class LifecycleError extends EngineError {
  phase: string;
}

class ConfigurationError extends EngineError {}
```

### Error Codes

- `ENGINE_NOT_INITIALIZED`
- `ENGINE_ALREADY_RUNNING`
- `ENGINE_START_FAILED`
- `ENGINE_STOP_FAILED`
- `PLUGIN_NOT_FOUND`
- `PLUGIN_ALREADY_REGISTERED`
- `PLUGIN_REGISTRATION_FAILED`
- `PLUGIN_EXECUTION_FAILED`
- `PLUGIN_DEPENDENCY_CYCLE`
- `PLUGIN_DEPENDENCY_MISSING`
- `LIFECYCLE_HOOK_FAILED`
- `CONFIG_VALIDATION_FAILED`
- `TIMEOUT`
- `ABORTED`

### Versioning

```typescript
import { getVersion, isCompatible, getVersionInfo } from '@rentfy/engine-sdk';

// Check SDK version
const version = getVersion();
console.log(version.version); // "1.0.0"

// Check compatibility
if (isCompatible('1.0.0')) {
  // Compatible
}

// Get full version info
const info = getVersionInfo('my-engine', '2.0.0');
```

## Platform Event Bus (PF-2)

The Platform Event Bus provides a transport-agnostic pub/sub backbone for cross-engine and cross-plugin communication.

### Event Lifecycle

1. **Construct** — `bus.publish(type, payload)` creates a `PlatformEvent` with auto-populated metadata (id, correlationId, timestamp, source, version).
2. **Dispatch** — The event is handed to the underlying transport (first pass = `MemoryEventBusTransport`).
3. **Invoke** — Each subscriber is invoked in registration order.
4. **Isolate** — Handler errors are caught and reported via the platform's `EngineError` model; remaining subscribers are never blocked.
5. **Complete** — Once handlers return `once` subscriptions for the event type are unregistered.

### Event Metadata

Every published `PlatformEvent` carries:

| Field | Auto-populated | Overridable |
|-------|---------------|-------------|
| `id` | UUID-like | via `options.id` |
| `type` | *(required)* | — |
| `timestamp` | `Date.now()` | via `options.timestamp` |
| `source` | `defaultSource` | via `options.source` |
| `correlationId` | unique per-publish | via `options.correlationId` |
| `version` | `1` | via `options.version` |
| `payload` | *(required)* | — |
| `metadata` | — | via `options.metadata` |

### Public API

```typescript
interface PlatformEventBus {
  // Publish a typed event (builds PlatformEvent automatically)
  publish<TPayload>(type: string, payload: TPayload, options?: EventPublishOptions): PlatformEvent<TPayload>;

  // Publish a pre-built event (for forwarding/replaying)
  publishEvent<TPayload>(event: PlatformEvent<TPayload>): PlatformEvent<TPayload>;

  // Subscribe to every occurrence of an event type
  subscribe<TPayload>(type: string, handler: EventHandler<TPayload>, opts?: EventSubscribeOptions): Subscription;

  // Subscribe for a single occurrence
  once<TPayload>(type: string, handler: EventHandler<TPayload>, opts?: EventSubscribeOptions): Subscription;

  // Unregister individual subscription
  unsubscribe(subscription: Subscription): boolean;

  // Unregister all subscriptions for a type (or globally if no type)
  unsubscribeAll(type?: string): number;

  // Remove every subscription and reset transport
  clear(): void;

  // Inspection
  listenerCount(type: string): number;
  hasListeners(type: string): boolean;
  eventTypes(): readonly string[];

  // Replace error-reporting hook
  setErrorReporter(reporter: HandlerErrorReporter): void;
}
```

### Usage Examples

```typescript
import {
  createEventBus,
  defaultEventBus,
  createEventBusFromTransport,
  DefaultPlatformEventBus,
  MemoryEventBusTransport,
  DefaultHandlerErrorReporter,
} from '@rentfy/engine-sdk';

// 1) Create from preset
const bus = createEventBus('memory', { defaultSource: 'crawler-engine' });

// 2) Subscribe
const sub = bus.subscribe<{ url: string }>('page.crawled', (event) => {
  console.log(`Crawled ${event.payload.url}`);
});

// 3) Publish
const evt = bus.publish('page.crawled', { url: '/about' });
// evt.id, evt.correlationId, evt.timestamp all populated

// 4) One‑time listener
bus.once('engine.ready', (event) => {
  console.log('Engine ready once');
});

// 5) Unsubscribe
bus.unsubscribe(sub);

// 6) Error reporting (platform model)
const errors: unknown[] = [];
bus.setErrorReporter((err, ctx) => {
  console.error(`Handler for "${ctx.event.type}" failed`, err);
  errors.push(err);
});
```

### Future Transport Architecture

The `EventBusTransport` interface is designed so future backends can be plugged in without changing any public API:

```typescript
interface EventBusTransport<TEvent extends PlatformEvent = PlatformEvent> {
  readonly kind: string;           // 'memory' | 'redis' | 'kafka' | 'nats' | 'rabbitmq'
  publish(event: TEvent): void | Promise<void>;
  on(type: string, handler: EventHandler): Subscription;
  off(subscription: Subscription): void;
  clear(): void;
  listenerCount(type: string): number;
  trackedTypes?(): readonly string[];
  configure?(options: unknown): void;
  dispose?(): void | Promise<void>;
}

// Factory accepts any transport
import { createEventBusFromTransport } from '@rentfy/engine-sdk';

// Hypothetical future:
// const redisBus = createEventBusFromTransport(new RedisEventBusTransport({ url: '...' }));
```

Future transports planned (but not yet built):
- `RedisEventBusTransport` — distributed pub/sub
- `KafkaEventBusTransport` — persistent event streaming
- `NatsEventBusTransport` — lightweight high-throughput messaging
- `RabbitMQEventBusTransport` — AMQP 0-9-1 broker
- `PersistentEventStoreTransport` — event sourcing with replay

## Default Implementations

The SDK provides default implementations for all context services:

- `DefaultPluginRegistry` - In-memory plugin registry with dependency resolution
- `DefaultPluginExecutor` - Plugin execution with timeout and retry support
- `DefaultEventBus` - In-memory event bus with once/on/off
- `DefaultEngineLogger` - Console-based structured logger
- `MemoryEngineStorage` - In-memory key-value storage
- `DefaultPluginMetrics` - In-memory metrics collector

## Building an Engine

To create a new engine:

1. Extend `AbstractEngine<Config>`
2. Implement abstract methods:
   - `validateConfig()`
   - `registerPlugins()`
   - `onInitialize()`
   - `onStart()`
   - `onStop()`
   - `onDispose()`
3. Register plugins via configuration or programmatically
4. Use the engine lifecycle methods

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## License

MIT