# Architecture Review Report — Website Intelligence Platform

**Document Version:** 1.0
**Review Date:** 2026-07-10
**Reviewer:** Principal Software Architect
**Status:** Pre-Implementation Review
**Blueprint Version Reviewed:** 1.0.0 (docs/ARCHITECTURE_BLUEPRINT.md)

---

## Executive Summary

The architecture blueprint presents a **solid foundation** for a Website Intelligence Platform with well-designed core primitives (Engine SDK, Event Bus, Rule Engine, Knowledge Graph, Storage, Config, Metrics, Logging). The plugin architecture, event-driven communication, and shared infrastructure approach are correct for the stated goal of supporting 13+ engines without duplication.

**However, the blueprint has significant gaps in production readiness.** It describes *interfaces* well but omits *operational concerns* required for a platform serving millions of users. The following review identifies 30 categories of missing or incomplete infrastructure, rated by priority.

---

## 1. Missing Infrastructure

### 1.1 API Gateway / Ingress Layer
| Priority | **Critical** |
|---|---|
| **Problem** | No API gateway defined. Engines are invoked via direct SDK calls or HTTP routes in `apps/web/app/api/`. No rate limiting, auth validation, request routing, or protocol translation at the edge. |
| **Why Needed** | Multi-engine platform requires unified entry point for: authentication, rate limiting, request routing, protocol translation (REST/gRPC/GraphQL), SSL termination, WAF integration, canary deployments. |
| **When Critical** | Before any engine exposes external APIs (Phase 2+). Without it, each engine reimplements auth/rate-limiting. |
| **Recommendation** | Add Kong, NGINX, or Cloudflare Workers as API Gateway. Define `EngineGateway` interface in SDK for request routing. |

### 1.2 Service Mesh / Inter-Service Communication
| Priority | **High** |
|---|---|
| **Problem** | Event Bus is in-process (memory). No provision for cross-process, cross-VM, or cross-region engine communication. |
| **Why Needed** | Engines will scale independently. Crawler may run on GPU nodes; SEO on CPU; AI Optimization on LLM-serving infra. Need service discovery, mTLS, load balancing, circuit breaking. |
| **When Critical** | When any engine scales beyond single process (expected Month 3-4). |
| **Recommendation** | Design Event Bus with pluggable transport (NATS, Kafka, Redis Streams). Add `EventBusTransport` interface. Plan for Istio/Linkerd integration. |

### 1.3 Secret Management
| Priority | **Critical** |
|---|---|
| **Problem** | Config system references `${SUPABASE_SERVICE_KEY}` but no secret manager integration. Secrets would be in env vars or config files. |
| **Why Needed** | Production requires: rotation, audit, least-privilege access, dynamic secrets (DB creds), secret scanning prevention. |
| **When Critical** | Before any production deployment. |
| **Recommendation** | Integrate HashiCorp Vault, AWS Secrets Manager, or 1Password SDK. Add `SecretManager` to SDK tokens. |

### 1.4 Certificate Management
| Priority | **High** |
|---|---|
| **Problem** | No TLS certificate provisioning, rotation, or mTLS configuration for inter-engine communication. |
| **Why Needed** | Zero-trust networking requires mTLS between engines, Event Bus, Storage. |
| **When Critical** | When service mesh adopted (see 1.2). |
| **Recommendation** | Use cert-manager + Let's Encrypt for public; SPIFFE/SPIRE for mTLS. |

### 1.5 Blob Storage / CDN
| Priority | **High** |
|---|---|
| **Problem** | `StorageAdapter` has `putBlob`/`getBlob` but no CDN integration, signed URLs, multipart upload, or lifecycle policies. |
| **Why Needed** | Crawler HTML snapshots, Lighthouse reports, PDF reports, screenshots = large objects. Direct DB storage fails at scale. |
| **When Critical** | When Crawler stores HTML (Month 2) or SEO generates PDF reports (Month 3). |
| **Recommendation** | Add `BlobStorage` interface with: presigned URLs, multipart, CDN invalidation, lifecycle. Implement S3/GCS/R2 adapters. |

---

## 2. Missing Platform Services

### 2.1 User Management & Authentication
| Priority | **Critical** |
|---|---|
| **Problem** | Blueprint assumes auth exists (references `auth_user_id` in RLS policies) but no auth service, session management, MFA, SSO, or API keys defined. |
| **Why Needed** | Multi-tenant platform requires: authentication, authorization, API keys for programmatic access, service accounts for engines. |
| **When Critical** | Before any user-facing feature. Current Supabase auth is tied to Next.js app only. |
| **Recommendation** | Extract auth to `@rentfy/auth` package: JWT issuance, JWKS endpoint, API key management, RBAC, SCIM provisioning. |

### 2.2 Authorization / RBAC / ABAC
| Priority | **Critical** |
|---|---|
| **Problem** | Only Supabase RLS policies shown. No engine-level authorization, plugin-level permissions, or fine-grained access control. |
| **Why Needed** | Engines need: per-engine enable/disable per tenant, plugin-level access, data isolation, admin vs. analyst vs. viewer roles. |
| **When Critical** | Multi-tenant launch (Phase 3+). |
| **Recommendation** | Add `AuthorizationService` to SDK with policy engine (OPA/Cedar). Define `EnginePermission`, `PluginPermission`, `DataScope` types. |

### 2.3 Tenant Management
| Priority | **High** |
|---|---|
| **Problem** | No tenant concept in SDK. `EngineConfig` has `scope` but no tenant isolation, quotas, or billing linkage. |
| **Why Needed** | SaaS platform requires: tenant onboarding, isolation, quotas, feature flags per tier, usage metering. |
| **When Critical** | Before beta customers (Month 4-5). |
| **Recommendation** | Add `TenantContext` to all SDK operations. `StorageAdapter` must enforce tenant isolation at query level. |

### 2.4 Billing & Metering
| Priority | **High** |
|---|---|
| **Problem** | No usage tracking for: crawl pages, API calls, LLM tokens, storage GB, engine runs. |
| **Why Needed** | Usage-based billing requires accurate metering per tenant per engine. |
| **When Critical** | Before monetization (Month 5+). |
| **Recommendation** | Add `MeteringService` to SDK. Emit `usage.recorded` events. Integrate with Stripe Metering / Lago / Orb. |

### 2.5 Notification Service
| Priority | **Medium** |
|---|---|
| **Problem** | No email, Slack, webhook, or push notification infrastructure for: audit completion, critical issues, crawl failures, billing alerts. |
| **Why Needed** | Operational visibility and customer communication. |
| **When Critical** | When Automation Engine runs scheduled workflows (Month 4+). |
| **Recommendation** | Add `NotificationService` with template engine, channel adapters, preference management. |

### 2.6 Search / Indexing Service
| Priority | **High** |
|---|---|
| **Problem** | Knowledge Graph queries use PostgreSQL full-text search. No provision for: vector search, faceted search, autocomplete, relevance tuning. |
| **Why Needed** | "Search Intelligence Engine" and "AI Optimization Engine" require semantic search over entities, content, keywords. |
| **When Critical** | Knowledge Graph launch (Month 4+). |
| **Recommendation** | Add `SearchService` interface. Implement Elasticsearch/OpenSearch/Meilisearch/Typesense adapter. Include vector search (pgvector/Pinecone/Weaviate). |

### 2.7 Task / Job Queue
| Priority | **Critical** |
|---|---|
| **Problem** | Crawler runs synchronously in `engine.run()`. No async job queue, retry, scheduling, priority, or distributed worker support. |
| **Why Needed** | Crawls can take minutes/hours. SEO analysis batch jobs. AI Optimization LLM calls. All need: queue, retry, dead-letter, priority, scheduling, horizontal scaling. |
| **When Critical** | Immediately — current crawler design blocks API request. |
| **Recommendation** | Add `JobQueue` to SDK. Implement BullMQ (Redis), Temporal, or Hatchet. Define `Job`, `JobSchedule`, `Worker` interfaces. |

### 2.8 Workflow Engine
| Priority | **High** |
|---|---|
| **Problem** | Automation Engine described as "scheduled runs, trigger-based workflows" but no workflow definition, state machine, compensation, or human-in-the-loop support. |
| **Why Needed** | Complex automations: "Crawl → Audit → Generate Fixes → PR → Deploy → Verify" requires: DAG execution, checkpointing, rollback, approval gates. |
| **When Critical** | Automation Engine v2 (Month 5+). |
| **Recommendation** | Add `WorkflowEngine` interface. Evaluate Temporal, Orkes Conductor, or custom DAG executor. |

### 2.9 Feature Flag Service
| Priority | **High** |
|---|---|
| **Problem** | `featureFlags` in global config but no targeting, rollout, experimentation, or kill-switch infrastructure. |
| **Why Needed** | Safe rollouts of: new analyzers, AI features, rule changes, engine versions. |
| **When Critical** | Before any production feature release (Month 2+). |
| **Recommendation** | Integrate LaunchDarkly, Unleash, or GrowthBook. Add `FeatureFlagService` to SDK with targeting rules. |

---

## 3. Scalability Limitations

### 3.1 In-Memory Event Bus
| Priority | **Critical** |
|---|---|
| **Problem** | `EventBus` implementation uses in-memory maps. Cannot scale beyond single process. No partitioning, replication, or durability. |
| **Why Needed** | At 100+ concurrent crawls, 1000+ events/sec, memory bus OOMs and loses events on restart. |
| **When Critical** | Month 2 (first production crawls). |
| **Recommendation** | Design `EventBusTransport` interface. Implement: Redis Streams (dev), Kafka/Redpanda (prod), NATS JetStream (low latency). Add partitioning by `correlationId` or `entityId`. |

### 3.2 Single-Process Plugin Pipeline
| Priority | **High** |
|---|---|
| **Problem** | `runPipeline` executes plugins sequentially in single thread. No parallel plugin execution, no worker pool, no plugin sandboxing. |
| **Why Needed** | SEO Engine with 20+ analyzers + generators + crawlers = 30+ plugins. Sequential = 10s+ per page. |
| **When Critical** | SEO Engine v2 with full analyzer suite (Month 2). |
| **Recommendation** | Add `PluginExecutor` with: `parallel`, `sequential`, `race` modes. Plugin sandboxing via Worker Threads (Node) or WASM. |

### 3.3 Storage Adapter — No Connection Pooling
| Priority | **High** |
|---|---|
| **Problem** | `SupabaseStorageAdapter` creates Supabase client per operation. No pool sizing, retry, or circuit breaker. |
| **Why Needed** | 13 engines × 10 plugins × concurrent runs = connection exhaustion. |
| **When Critical** | Month 2 (concurrent engine runs). |
| **Recommendation** | Add `ConnectionPool` to adapter config. Implement PgBouncer-compatible pooling. Add `StorageCircuitBreaker`. |

### 3.4 Knowledge Graph — No Sharding Strategy
| Priority | **Medium** |
|---|---|
| **Problem** | `KnowledgeGraph` uses single `Map<string, Entity>`. No partitioning by tenant, entity type, or geography. |
| **Why Needed** | Millions of entities (pages, properties, keywords) exceed single-node memory and query latency. |
| **When Critical** | Month 6+ (Knowledge Graph scale). |
| **Recommendation** | Design sharding: by `tenantId` (logical), `entityType` (physical), geographic region. Add `GraphShardRouter` to `GraphQuery`. |

### 3.5 Crawler — No Distributed Crawl Coordination
| Priority | **High** |
|---|---|
| **Problem** | `CrawlerEngine` single-threaded BFS. No: distributed frontier, politeness per domain, crawl budget allocation, resume after crash. |
| **Why Needed** | Large sites (100k+ pages) need horizontal crawl workers. |
| **When Critical** | Month 3 (enterprise sites). |
| **Recommendation** | Redesign crawler as: `CrawlCoordinator` + `CrawlWorker` pool. Use distributed queue (Redis/RabbitMQ) for frontier. Implement politeness via token bucket per domain. |

---

## 4. Performance Bottlenecks

### 4.1 Synchronous Engine.run() Blocks HTTP
| Priority | **Critical** |
|---|---|
| **Problem** | `engine.run()` is `async` but awaited in API route. Crawler takes 30-300s. HTTP timeout = failure. |
| **Why Needed** | User-facing API cannot block 5 minutes. |
| **When Critical** | Immediately — current `app/api/crawler/run/route.ts` will timeout. |
| **Recommendation** | Make all engine runs async: return `runId` immediately. Poll `/api/runs/{runId}` or WebSocket for completion. Add `JobQueue` (see 2.7). |

### 4.2 No Plugin Result Caching
| Priority | **High** |
|---|---|
| **Problem** | Same page analyzed repeatedly across runs. No cache for: crawl results, analyzer outputs, LLM responses. |
| **Why Needed** | Re-crawling same site wastes bandwidth. Re-analyzing unchanged page wastes CPU. LLM calls cost $$. |
| **When Critical** | Month 2 (repeat analyses). |
| **Recommendation** | Add `CacheLayer` to `PluginInput`: `getCached(key)`, `setCached(key, value, ttl)`. Key by `contentHash + pluginVersion`. Integrate with `StorageAdapter` hybrid cache. |

### 4.3 Rule Engine — No Incremental Evaluation
| Priority | **High** |
|---|---|
| **Problem** | `RuleEngine.evaluate()` runs all rules every time. No incremental evaluation when only one page changes. |
| **Why Needed** | Site with 10k pages: changing 1 page shouldn't re-evaluate 10k pages × 50 rules. |
| **When Critical** | Audit Engine on large sites (Month 4+). |
| **Recommendation** | Add `RuleEngine.evaluateIncremental(changedEntities: Entity[])`. Track rule dependencies on entity properties. |

### 4.4 Knowledge Graph — No Query Optimization
| Priority | **Medium** |
|---|---|
| **Problem** | `GraphQuery` interface has no: query planner, index hints, pagination cursors, or cost estimation. |
| **Why Needed** | Graph traversals (PageRank, shortest path) on 1M+ nodes without optimization = 30s+ queries. |
| **When Critical** | Knowledge Graph production (Month 6+). |
| **Recommendation** | Add `GraphQueryPlan`, `ExplainPlan`, `IndexAdvisor`. Delegate to PostgreSQL (pgRouting) or dedicated graph DB (Neo4j, Kuzu). |

### 4.5 Metrics Cardinality Explosion
| Priority | **High** |
|---|---|
| **Problem** | `STANDARD_METRICS` uses high-cardinality labels: `crawl_id`, `audit_id`, `plugin`, `engine`, `channel`. Prometheus will OOM. |
| **Why Needed** | 1000 crawls × 50 plugins × 10 engines = 500k+ label combinations. |
| **When Critical** | Month 2 (metrics collection starts). |
| **Recommendation** | Enforce label cardinality limits. Use `crawl_id` only in logs, not metrics. Aggregate at engine level. Add `MetricsCardinalityGuard` in SDK. |

---

## 5. Security Weaknesses

### 5.1 No Input Validation / Sanitization in SDK
| Priority | **Critical** |
|---|---|
| **Problem** | `PluginInput.payload` is `unknown`. No validation, sanitization, or size limits. Crawler fetches arbitrary URLs — SSRF risk. |
| **Why Needed** | Malicious input → RCE (plugin), SSRF (crawler), DoS (large payloads), XSS (report generation). |
| **When Critical** | Immediately — any engine accepting external input. |
| **Recommendation** | Add `InputValidator` to SDK: schema validation (Zod), size limits, SSRF protection (deny-list private IPs), HTML sanitization for reports. |

### 5.2 No Plugin Sandboxing
| Priority | **High** |
|---|---|
| **Problem** | Plugins run in same process with full Node.js access. Third-party or AI-generated plugins can: read files, spawn processes, access network, crash engine. |
| **Why Needed** | Marketplace plugins (see 19) or AI-generated rules (see 15) must be isolated. |
| **When Critical** | Plugin marketplace or AI rule generation (Month 6+). |
| **Recommendation** | Implement plugin sandbox: Worker Threads with `contextBridge`, or WASM (wasmtime), or separate process with gRPC. Define `PluginSandbox` interface. |

### 5.3 No Audit Logging for Security Events
| Priority | **High** |
|---|---|
| **Problem** | Structured logging exists but no security-specific audit trail: authz decisions, config changes, plugin installation, data export, admin actions. |
| **Why Needed** | Compliance (SOC2, GDPR), incident response, anomaly detection. |
| **When Critical** | Production launch (Month 3+). |
| **Recommendation** | Add `AuditLogger` to SDK: immutable append-only log, tamper-evident, separate retention. Emit `security.audit` events for: `plugin.installed`, `config.changed`, `data.exported`, `tenant.created`. |

### 5.4 No Data Encryption at Rest / In Transit
| Priority | **High** |
|---|---|
| **Problem** | Storage adapter assumes Supabase handles encryption. No: field-level encryption for PII, envelope encryption for blobs, key rotation. |
| **Why Needed** | Real estate data = PII (tenant info, contacts). Compliance requires encryption. |
| **When Critical** | Production with real data (Month 2+). |
| **Recommendation** | Add `EncryptionService` to SDK: `encrypt(field, keyId)`, `decrypt()`. Integrate with KMS (AWS KMS, GCP KMS, Vault Transit). Encrypt: `PropertyEntity.contactInfo`, `UserJourneyEntity.userId`, blob storage. |

### 5.5 No Rate Limiting / DoS Protection
| Priority | **Critical** |
|---|---|
| **Problem** | No rate limits on: engine.run(), crawl requests, API endpoints, event publishing. |
| **Why Needed** | Single tenant can DoS platform: infinite crawl, massive batch analysis, event flood. |
| **When Critical** | Before any external API exposure (Month 1). |
| **Recommendation** | Add `RateLimiter` to SDK: token bucket per tenant/engine/plugin. Integrate with API Gateway. Default limits: 10 crawls/min, 100 analyses/min, 1000 events/sec per tenant. |

### 5.6 Event Bus — No Authentication/Authorization
| Priority | **High** |
|---|---|
| **Problem** | Any engine can publish/subscribe to any channel. No: channel ACLs, event signing, tenant isolation. |
| **Why Needed** | Tenant A's crawl events visible to Tenant B. Malicious engine can inject fake `issue.created` events. |
| **When Critical** | Multi-tenant (Month 4+). |
| **Recommendation** | Add `EventBusPolicy`: `publish(channel, tenant)`, `subscribe(channel, tenant)`. Sign events with tenant JWT. Enforce at transport layer. |

---

## 6. Reliability Concerns

### 6.1 No Health Check / Readiness / Liveness Probes
| Priority | **Critical** |
|---|---|
| **Problem** | Engines have no `/health`, `/ready`, `/live` endpoints. K8s cannot route traffic or restart unhealthy pods. |
| **Why Needed** | Production orchestration requires: startup probe (init complete), readiness (can serve), liveness (not deadlocked). |
| **When Critical** | K8s deployment (Month 2+). |
| **Recommendation** | Add `HealthCheckService` to SDK. Engines implement: `checkDependencies()` (storage, event bus, config), `checkCapacity()` (queue depth, memory). |

### 6.2 No Graceful Shutdown
| Priority | **High** |
|---|---|
| **Problem** | `Engine.run()` has no cancellation signal handling. SIGTERM kills in-progress crawl/analysis. |
| **Why Needed** | Rolling deployments, spot instance termination, scale-down lose work. |
| **When Critical** | Production with autoscaling (Month 3+). |
| **Recommendation** | Add `ShutdownSignal` to `PluginInput`. Implement `onShutdown` hook in `Engine`. Drain in-flight plugins (max 30s). Persist checkpoint for resumable crawls. |

### 6.3 No Circuit Breakers
| Priority | **High** |
|---|---|
| **Problem** | Storage, Event Bus, LLM, Search API failures cascade. No timeout, retry, fallback, or circuit breaker. |
| **Why Needed** | Downstream outage (Supabase, OpenAI) shouldn't crash all engines. |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | Add `CircuitBreaker` to SDK tokens. Wrap: `StorageAdapter`, `EventBus`, `LLMClient`, `SearchClient`. Config: failure threshold, timeout, half-open requests. |

### 6.4 No Dead Letter Queue for Failed Events
| Priority | **High** |
|---|---|
| **Problem** | Event Bus `SubscriptionOptions` has `deadLetterChannel` but no implementation. Failed events lost. |
| **Why Needed** | Event processing failures (bug, schema change) need replay after fix. |
| **When Critical** | Event Bus v2 (Month 3+). |
| **Recommendation** | Implement DLQ: persist failed event + error + retry count. Admin UI for replay. Max retries → alert. |

### 6.5 No Backup / Point-in-Time Recovery for Knowledge Graph
| Priority | **Medium** |
|---|---|
| **Problem** | `StorageAdapter` has no backup, snapshot, or PITR interface. Corrupted graph = data loss. |
| **Why Needed** | Knowledge Graph is system of record for derived entities. |
| **When Critical** | Knowledge Graph production (Month 6+). |
| **Recommendation** | Add `BackupService`: scheduled snapshots (pg_dump / volume snapshot), PITR (WAL-G), restore testing. Define `RPO`/`RTO` per data tier. |

---

## 7. Fault Tolerance

### 7.1 Plugin Failure = Engine Failure
| Priority | **High** |
|---|---|
| **Problem** | `runPipeline` stops on first plugin error (unless `condition` returns `skip`). No: partial success, degraded mode, plugin isolation. |
| **Why Needed** | One buggy analyzer shouldn't block SEO report. One failing crawler plugin shouldn't stop crawl. |
| **When Critical** | Production with 20+ plugins (Month 2). |
| **Recommendation** | Add `PluginFailurePolicy`: `fail-fast` (default), `continue`, `degrade`. `PhaseResult` includes `degraded: boolean`. Engine runs with degraded plugins marked. |

### 7.2 No Idempotency for Engine Runs
| Priority | **High** |
|---|---|
| **Problem** | Retrying `engine.run()` (network blip, timeout) creates duplicate: crawl, analysis, report, events. |
| **Why Needed** | Client retries are inevitable. Duplicate crawls waste resources. Duplicate reports confuse users. |
| **When Critical** | Async job queue (Month 2). |
| **Recommendation** | Require `idempotencyKey` in `EngineRunOptions`. Engine checks `StorageAdapter` for existing run. Return existing result if found. |

### 7.3 No Partial Crawl Resume
| Priority | **High** |
|---|---|
| **Problem** | Crawl crash at page 5,000 of 10,000 → restart from page 1. |
| **Why Needed** | Large crawls fail (network, OOM, timeout). Resume saves hours. |
| **When Critical** | Enterprise crawls (Month 3+). |
| **Recommendation** | Persist `CrawlCheckpoint` every N pages: `visited`, `queue`, `depth`. `CrawlerEngine.run()` accepts `resumeFrom?: CrawlCheckpoint`. |

### 7.4 No Multi-Region Failover
| Priority | **Future** |
|---|---|
| **Problem** | Single-region design. No: active-active, active-passive, data replication. |
| **Why Needed** | Enterprise SLA (99.99%) requires multi-region. |
| **When Critical** | Enterprise contracts (Year 2+). |
| **Recommendation** | Design for: Supabase read replicas, Event Bus cross-region replication (MirrorMaker), Storage geo-replication. |

---

## 8. Disaster Recovery

### 8.1 No DR Plan Documented
| Priority | **High** |
|---|---|
| **Problem** | Blueprint has no: RPO/RTO targets, failover procedures, backup verification, runbooks. |
| **Why Needed** | Production systems need documented, tested DR. |
| **When Critical** | Before SOC2 audit (Month 6+). |
| **Recommendation** | Create `DR_PLAN.md`: define tiers (Tier 1: config/secrets — RPO 0, RTO 1h; Tier 2: crawl data — RPO 1h, RTO 4h; Tier 3: reports — RPO 24h, RTO 24h). Quarterly DR drills. |

### 8.2 No Chaos Engineering
| Priority | **Medium** |
|---|---|
| **Problem** | No: fault injection, latency injection, dependency failure simulation. |
| **Why Needed** | Validates: circuit breakers, graceful degradation, alerting. |
| **When Critical** | Pre-production (Month 3+). |
| **Recommendation** | Integrate Chaos Mesh or Gremlin. Test: storage latency, event bus partition, LLM timeout, config reload. |

---

## 9. Plugin System Improvements

### 9.1 Plugin Versioning & Compatibility
| Priority | **High** |
|---|---|
| **Problem** | `Plugin.version` exists but no: compatibility matrix, migration path, deprecation policy, breaking change detection. |
| **Why Needed** | 13 engines × 50 plugins = version hell. Engine v2.0 may break plugin v1.0. |
| **When Critical** | Multi-engine platform (Month 3+). |
| **Recommendation** | Add `PluginCompatibility`: `engineVersionRange`, `sdkVersionRange`, `migrationGuide`. SDK validates on `register()`. |

### 9.2 Plugin Discovery & Marketplace
| Priority | **Medium** |
|---|---|
| **Problem** | Plugins registered programmatically (`engine.use()`). No: plugin registry, search, install, update, signing, verification. |
| **Why Needed** | Third-party plugins, community contributions, internal plugin sharing. |
| **When Critical** | Plugin marketplace (Month 8+). |
| **Recommendation** | Build `@rentfy/plugin-registry`: npm-like registry with: manifest, signatures, compatibility, download stats. CLI: `rentfy plugin install seo/title-optimizer@2.1`. |

### 9.3 Plugin Testing Harness
| Priority | **High** |
|---|---|
| **Problem** | No standard test utilities for: mock `PluginInput`, assert `PluginOutput`, test `condition`, test `teardown`, performance benchmarks. |
| **Why Needed** | 50+ plugins need consistent testing. |
| **When Critical** | SDK v1.0 (Month 1). |
| **Recommendation** | Add `@rentfy/engine-sdk/testing`: `createMockPluginInput()`, `assertPluginOutput()`, `benchmarkPlugin()`, `testPluginLifecycle()`. |

### 9.4 Plugin Hot Reload
| Priority | **Medium** |
|---|---|
| **Problem** | Plugin changes require engine restart. No hot reload for development. |
| **Why Needed** | Developer velocity: analyzer tweak → instant feedback. |
| **When Critical** | Development phase (Month 1). |
| **Recommendation** | Add `PluginRegistry.watch()` using `chokidar`. On file change: unregister old, register new, preserve `PluginState` via snapshot. |

### 9.5 Plugin Resource Limits
| Priority | **High** |
|---|---|
| **Problem** | No CPU/memory/time limits per plugin. Runaway plugin = engine OOM or hang. |
| **Why Needed** | AI plugins (LLM calls), regex DoS, infinite loops. |
| **When Critical** | AI Optimization Engine (Month 5+). |
| **Recommendation** | Add `PluginResourceLimits`: `maxMemoryMb`, `maxCpuMs`, `maxWallTimeMs`. Enforce via Worker Thread sandbox. |

---

## 10. Event Bus Improvements

### 10.1 Event Schema Registry
| Priority | **High** |
|---|---|
| **Problem** | Events defined as TypeScript interfaces only. No: schema registry, validation, evolution rules, compatibility checks. |
| **Why Needed** | Producer/consumer decoupled. Schema change breaks consumers silently. |
| **When Critical** | Multi-engine (Month 3+). |
| **Recommendation** | Add `SchemaRegistry` (Confluent Schema Registry or custom). Store Avro/JSON Schema per event type. Validate on `publish()`. Enforce: backward/forward compatibility. |

### 10.2 Exactly-Once Semantics
| Priority | **Medium** |
|---|---|
| **Problem** | Current `publish()` is at-least-once (no deduplication). Duplicate `issue.created` → duplicate alerts. |
| **Why Needed** | Billing, audit, notifications require exactly-once. |
| **When Critical** | Automation Engine billing events (Month 5+). |
| **Recommendation** | Add `eventId` (UUIDv7) + `processedEventIds` store (Redis/set). Consumer tracks processed IDs. Idempotent consumers for critical events. |

### 10.3 Event Ordering Guarantees
| Priority | **High** |
|---|---|
| **Problem** | No ordering guarantees across partitions. `page.crawled` for same URL may arrive out of order. |
| **Why Needed** | Graph builder needs: `page.discovered` → `page.crawled` → `graph.updated` per URL. |
| **When Critical** | Website Graph (Month 3+). |
| **Recommendation** | Add `partitionKey` to `EventEnvelope` (e.g., `url`, `entityId`). Guarantee per-key ordering. Document: global ordering not guaranteed. |

### 10.4 Event Sourcing / CQRS Support
| Priority | **Future** |
|---|---|
| **Problem** | Event Bus is notification-only. No: event store, projections, snapshots, replay for state rebuild. |
| **Why Needed** | Knowledge Graph, Audit Engine need: full history, time-travel queries, rebuilt projections. |
| **When Critical** | Advanced analytics (Year 2+). |
| **Recommendation** | Add `EventStore` interface: `append(events)`, `read(streamId, fromPosition)`, `subscribe(projection)`. Implement with EventStoreDB or Kafka + materialized views. |

### 10.5 Consumer Group / Load Balancing
| Priority | **High** |
|---|---|
| **Problem** | `subscribe()` delivers to ALL subscribers. No: competing consumers, load balancing, scaling subscribers. |
| **Why Needed** | Multiple Automation Engine workers consuming `automation.triggered` — only one should process each. |
| **When Critical** | Horizontal scaling (Month 3+). |
| **Recommendation** | Add `ConsumerGroup` to `SubscriptionOptions`: `groupId`, `instanceId`. Implement: Kafka-style partition assignment, or Redis Streams consumer groups. |

---

## 11. Rule Engine Improvements

### 11.1 Rule Testing / Simulation
| Priority | **High** |
|---|---|
| **Problem** | No: rule unit test framework, simulation against historical data, A/B testing rule changes. |
| **Why Needed** | 500+ rules across engines. Changing one rule shouldn't regress others. |
| **When Critical** | Audit Engine launch (Month 4+). |
| **Recommendation** | Add `RuleTestHarness`: `testRule(rule, fixtures[])`, `simulateRuleset(rules, historicalRuns[])`, `compareRulesets(old, new, sample[])`. |

### 11.2 Rule Composition / Reuse
| Priority | **Medium** |
|---|---|
| **Problem** | Rules are flat. No: rule sets, rule inheritance, parameterized rules, macro rules. |
| **Why Needed** | SEO rules for "real estate" vs "e-commerce" share 80% logic. DRY. |
| **When Critical** | Multi-vertical (Month 6+). |
| **Recommendation** | Add `RuleSet`: `extends`, `parameters`, `overrides`. `RuleEngine` resolves parameterized rules at evaluation. |

### 11.3 Rule Explainability
| Priority | **High** |
|---|---|
| **Problem** | `RuleResult` has `evidence` but no: decision trace, rule dependency graph, counterfactual ("what if this passed?"). |
| **Why Needed** | Users need to understand WHY audit failed. Debugging complex rule chains. |
| **When Critical** | Audit Engine UI (Month 4+). |
| **Recommendation** | Add `RuleExplanation`: `trace: RuleTraceNode[]`, `counterfactuals: Counterfactual[]`. `RuleEngine.explain(ruleId, payload, context)`. |

### 11.4 Distributed Rule Evaluation
| Priority | **Future** |
|---|---|
| **Problem** | Single-threaded rule evaluation. 10k pages × 500 rules = sequential bottleneck. |
| **Why Needed** | Enterprise audit scale. |
| **When Critical** | Year 2. |
| **Recommendation** | Partition rules by `category` + `entityType`. Evaluate per partition in parallel. Merge results. |

---

## 12. Storage Abstraction Improvements

### 12.1 Migration / Schema Evolution
| Priority | **High** |
|---|---|
| **Problem** | `Migration` in `StorageAdapter` but no: migration runner, version tracking, rollback, dry-run. |
| **Why Needed** | 13 engines = 13 schema domains. Coordinated migrations needed. |
| **When Critical** | Month 2 (first schema change). |
| **Recommendation** | Add `MigrationRunner`: `plan()`, `execute()`, `rollback()`, `status()`. Version table per engine. Integrate with CI/CD. |

### 12.2 Query Builder / Type-Safe Queries
| Priority | **Medium** |
|---|---|
| **Problem** | `EntityQuery` uses string-based filters. No: type-safe query builder, join syntax, subqueries. |
| **Why Needed** | Complex graph queries (e.g., "pages linking to properties in Noida with SEO score < 50") are error-prone. |
| **When Critical** | Knowledge Graph queries (Month 5+). |
| **Recommendation** | Add `QueryBuilder<E>` with: `where()`, `join()`, `select()`, `orderBy()`, `paginate()`. Generate TypeScript types from entity definitions. |

### 12.3 Optimistic Concurrency Control
| Priority | **High** |
|---|---|
| **Problem** | `Entity.version` exists but `upsertEntity()` doesn't enforce it. Lost updates. |
| **Why Needed** | Concurrent: crawl updates page, SEO updates score, Graph updates links. |
| **When Critical** | Multi-engine writes (Month 3+). |
| **Recommendation** | `upsertEntity(entity, expectedVersion?)` throws `OptimisticLockError` if mismatch. Add `retryWithBackoff` helper. |

### 12.4 Soft Delete / Archival
| Priority | **Medium** |
|---|---|
| **Problem** | `deleteEntity()` hard deletes. No: soft delete, archive, GDPR purge, retention policies. |
| **Why Needed** | Compliance, audit trail, accidental deletion recovery. |
| **When Critical** | Production (Month 3+). |
| **Recommendation** | Add `DeleteOptions`: `soft: boolean`, `archiveTo?: string`. `Entity.deletedAt`, `deletedBy`. `StorageAdapter` filters soft-deleted by default. |

### 12.5 Change Data Capture (CDC)
| Priority | **High** |
|---|---|
| **Problem** | Engines poll storage for changes. No: real-time change streams, webhooks, replication. |
| **Why Needed** | Knowledge Graph needs: crawl → entity extraction → graph update in seconds, not minutes. |
| **When Critical** | Website Graph → Knowledge Graph pipeline (Month 4+). |
| **Recommendation** | Add `ChangeStream` to `StorageAdapter`: `watch(collection, filter) -> AsyncIterable<ChangeEvent>`. Implement via: Supabase Realtime, PostgreSQL logical replication, Debezium. |

---

## 13. Knowledge Graph Improvements

### 13.1 Entity Resolution / Deduplication
| Priority | **Critical** |
|---|---|
| **Problem** | Same property crawled multiple times → duplicate `PropertyEntity`. Same agency from different sources → duplicate `AgencyEntity`. No: fuzzy matching, canonical ID, merge logic. |
| **Why Needed** | Graph quality degrades exponentially with duplicates. PageRank, recommendations fail. |
| **When Critical** | Knowledge Graph v1 (Month 5+). |
| **Recommendation** | Add `EntityResolver`: `candidates(entity) -> Entity[]`, `merge(primary, secondary)`, `confidenceScore`. Use: property listing ID, address normalization, agency license number. |

### 13.2 Temporal Validity
| Priority | **High** |
|---|---|
| **Problem** | `Relationship.validFrom/validTo` defined but unused. Property price changes, agency moves, page content updates — graph shows stale state. |
| **Why Needed** | Time-travel queries: "What was the SEO score last month?" "Which keywords ranked in Q1?" |
| **When Critical** | Analytics / Search Intelligence (Month 6+). |
| **Recommendation** | Enforce temporal writes: `upsertEntity(entity, validFrom=now)`. `GraphQuery.at(timestamp)`. Bitemporal: `transactionTime` + `validTime`. |

### 13.3 Provenance / Lineage
| Priority | **High** |
|---|---|
| **Problem** | `EntitySource` tracks origin but no: transformation chain, confidence propagation, human review trail. |
| **Why Needed** | "Why does this entity have this value?" → debug extraction errors, audit AI decisions. |
| **When Critical** | AI extraction (Month 6+). |
| **Recommendation** | Add `EntityLineage`: `derivationChain: DerivationStep[]`. `DerivationStep`: `sourceEntityIds`, `transformPlugin`, `confidence`, `humanReviewed`. |

### 13.4 Graph Algorithms as Plugins
| Priority | **Medium** |
|---|---|
| **Problem** | `GraphQuery` has `pageRank()`, `communityDetection()` as methods. Not extensible. |
| **Why Needed** | Trust Engine needs: TrustRank, HITS. Search Intelligence needs: Personalized PageRank. |
| **When Critical** | Trust Engine (Month 7+). |
| **Recommendation** | Make algorithms plugins: `GraphAlgorithmPlugin` with `compute(graph, params)`. Register via `GraphEngine.useAlgorithm()`. |

### 13.5 Vector Embeddings Integration
| Priority | **High** |
|---|---|
| **Problem** | No vector storage/search in `StorageAdapter`. Semantic search requires: embeddings, ANN index, hybrid search. |
| **Why Needed** | AI Optimization, Search Intelligence, Content Engine need: "similar pages", "related keywords", "content gaps". |
| **When Critical** | AI Optimization Engine (Month 5+). |
| **Recommendation** | Add `VectorSearch` to `StorageCapabilities`. `upsertVectors(entityId, vectors[])`, `searchVector(queryVector, k, filter)`. Implement: pgvector, Pinecone, Weaviate, Qdrant adapters. |

---

## 14. Engine SDK Improvements

### 14.1 Engine Lifecycle Management
| Priority | **High** |
|---|---|
| **Problem** | `Engine` has `run()` but no: `initialize()`, `shutdown()`, `pause()`, `resume()`, `scale()`. |
| **Why Needed** | Platform manages engine lifecycle: startup order, health, scaling, maintenance windows. |
| **When Critical** | Platform orchestration (Month 3+). |
| **Recommendation** | Add `EngineLifecycle`: `start()`, `stop(graceful?)`, `pause()`, `resume()`, `status()`. `PlatformEngineRegistry` orchestrates. |

### 14.2 Engine Versioning & Rolling Updates
| Priority | **High** |
|---|---|
| **Problem** | No: engine version in registry, canary deployment, backward compatibility, rollback. |
| **Why Needed** | Deploy SEO Engine v2.1 without breaking Crawler Engine v1.0. |
| **When Critical** | Multi-engine production (Month 3+). |
| **Recommendation** | `EngineDescriptor` adds: `sdkVersionRange`, `compatibleEngineVersions`. `PlatformEngineRegistry` validates compatibility graph. Support: blue-green, canary via `EngineFactory` version parameter. |

### 14.3 Engine-to-Engine RPC (Beyond Events)
| Priority | **Medium** |
|---|---|
| **Problem** | Event Bus is fire-and-forget. Some operations need: request-response, streaming, progress updates. |
| **Why Needed** | SEO Engine needs: "Crawler, give me page X now" (not wait for event). Content Engine needs: "LLM, stream tokens". |
| **When Critical** | Synchronous cross-engine calls (Month 4+). |
| **Recommendation** | Add `EngineRpcClient` / `EngineRpcServer` to SDK. gRPC or Cap'n Proto. Define `.proto` for each engine's RPC API. |

### 14.4 Engine Configuration Schema Generation
| Priority | **Medium** |
|---|---|
| **Problem** | Config schemas defined manually in JSON. No: TypeScript → JSON Schema, validation, documentation generation. |
| **Why Needed** | 13 engines × 50 plugins = 650 config schemas. Manual = drift. |
| **When Critical** | SDK v1.0 (Month 1). |
| **Recommendation** | Add `ConfigSchemaGenerator`: reads Zod schemas from plugin/engine `defineConfig()`, outputs: JSON Schema, Markdown docs, TypeScript types. CI validates. |

### 14.5 Engine Metrics Standardization
| Priority | **High** |
|---|---|
| **Problem** | Each engine defines own metrics. No: standard metric names, required metrics, metric health checks. |
| **Why Needed** | Dashboard, alerting, autoscaling need consistent metrics. |
| **When Critical** | Observability (Month 2+). |
| **Recommendation** | Define `RequiredEngineMetrics`: `engine.up`, `engine.runs.total`, `engine.run.duration`, `engine.run.errors`. SDK auto-instruments. Engines add custom metrics via `metrics.createCustom()`. |

---

## 15. Future AI Integration Improvements

### 15.1 LLM Gateway / Abstraction
| Priority | **Critical** |
|---|---|
| **Problem** | AI Optimization Engine will call OpenAI, Anthropic, local models directly. No: provider abstraction, fallback, cost tracking, prompt management, eval. |
| **Why Needed** | Vendor lock-in, cost explosion, prompt drift, compliance (data residency). |
| **When Critical** | AI Optimization Engine (Month 5+). |
| **Recommendation** | Add `LlmGateway` to SDK: `chat(messages, options)`, `embed(texts)`, `providers: LlmProvider[]`. Implement: routing (cost/latency/quality), fallback, caching, budget enforcement, PII redaction. |

### 15.2 Prompt Engineering Framework
| Priority | **High** |
|---|---|
| **Problem** | Prompts scattered in plugin code. No: versioning, testing, A/B, templating, variable injection. |
| **Why Needed** | 50+ prompts across engines. "Improve title" prompt v3 vs v4 — which converts better? |
| **When Critical** | AI Optimization launch (Month 5+). |
| **Recommendation** | Add `PromptRegistry`: `registerPrompt(id, template, version)`, `render(id, variables)`, `abTest(id, variants[])`. Store in config/storage. |

### 15.3 AI Rule Generation Pipeline
| Priority | **Medium** |
|---|---|
| **Problem** | "Future AI-generated rules" mentioned but no: training data pipeline, validation, human review, deployment. |
| **Why Needed** | Learning Engine (Month 8+) generates rules from patterns. Must be safe. |
| **When Critical** | Learning Engine (Month 8+). |
| **Recommendation** | Design `AiRulePipeline`: `minePatterns(historicalRuns) → candidateRules → validate(sandbox) → humanReview → deploy(canary) → monitor → promote`. |

### 15.4 RAG (Retrieval-Augmented Generation) Infrastructure
| Priority | **High** |
|---|---|
| **Problem** | Content Engine, AI Optimization need: retrieve relevant context (pages, rules, best practices) → inject into prompt. No: retrieval pipeline, chunking, embedding, reranking. |
| **Why Needed** | LLM context window limited. Quality depends on retrieval. |
| **When Critical** | Content Engine (Month 5+). |
| **Recommendation** | Add `RagPipeline`: `chunk(document)`, `embed(chunks)`, `store(vectorStore)`, `retrieve(query, k)`, `rerank(results)`. Integrate with Knowledge Graph entities. |

### 15.5 AI Safety / Guardrails
| Priority | **Critical** |
|---|---|
| **Problem** | No: output validation, hallucination detection, PII leakage prevention, prompt injection defense, cost limits. |
| **Why Needed** | AI-generated content published to production sites. Legal/reputation risk. |
| **When Critical** | First AI feature (Month 5+). |
| **Recommendation** | Add `AiGuardrails`: `validateOutput(output, schema)`, `detectHallucination(output, sources)`, `redactPii(text)`, `detectPromptInjection(input)`, `enforceBudget(tenant, model, tokens)`. |

---

## 16. Workflow Engine Requirements

### 16.1 Workflow Definition Language
| Priority | **High** |
|---|---|
| **Problem** | Automation Engine described but no: DSL, visual designer, versioning, import/export. |
| **Why Needed** | Non-technical users need: "When crawl completes → run audit → if critical issues → create GitHub issue → notify Slack". |
| **When Critical** | Automation Engine v2 (Month 5+). |
| **Recommendation** | Adopt Temporal (TypeScript SDK) or Orkes Conductor. Define: `Workflow<TInput, TOutput>`, `Activity`, `Signal`, `Query`. Visual editor via React Flow. |

### 16.2 Human-in-the-Loop
| Priority | **High** |
|---|---|
| **Problem** | No: approval gates, manual tasks, escalation, SLA timers. |
| **Why Needed** | "Auto-fix meta description" needs approval. "Deploy schema changes" needs DevOps sign-off. |
| **When Critical** | Automation with side effects (Month 5+). |
| **Recommendation** | Workflow engine must support: `waitForSignal('approval', timeout)`, `assignTask(user, role)`, `escalate(after)`, `compensation(rollbackActivity)`. |

### 16.3 Workflow Observability
| Priority | **High** |
|---|---|
| **Problem** | No: workflow execution history, replay, debugging, metrics. |
| **Why Needed** | "Why did this automation fail at step 3?" "Replay from step 2 after fix." |
| **When Critical** | Production automations (Month 5+). |
| **Recommendation** | Temporal provides: Web UI, stack traces, replay, metrics. Export to SDK `MetricsCollector`. |

---

## 17. Job Queue Requirements

### 17.1 Job Queue Interface
| Priority | **Critical** |
|---|---|
| **Problem** | No `JobQueue` in SDK. Crawler, SEO batch, AI jobs all need queue. |
| **Why Needed** | Async execution, retry, priority, scheduling, scaling workers independently. |
| **When Critical** | Immediately (Month 1). |
| **Recommendation** | Add `JobQueue` to SDK: `enqueue(job)`, `schedule(job, cron)`, `cancel(jobId)`, `retry(jobId)`. Implement BullMQ (Redis) for v1. Define `Job<T>`: `id`, `type`, `payload`, `priority`, `maxRetries`, `timeoutMs`, `idempotencyKey`. |

### 17.2 Worker Pool Management
| Priority | **High** |
|---|---|
| **Problem** | No: worker scaling, concurrency control, graceful drain, per-job-type pools. |
| **Why Needed** | Crawl workers (I/O bound) vs AI workers (GPU) vs SEO workers (CPU) need different scaling. |
| **When Critical** | Month 3 (horizontal scaling). |
| **Recommendation** | Add `WorkerPool`: `concurrency`, `jobTypes[]`, `autoscaling(min, max, targetUtilization)`. K8s HPA integration via custom metrics. |

### 17.3 Job Priority & Fairness
| Priority | **Medium** |
|---|---|
| **Problem** | No: priority inversion prevention, tenant fairness, noisy neighbor protection. |
| **Why Needed** | Tenant A's 10k-page crawl shouldn't block Tenant B's 1-page audit. |
| **When Critical** | Multi-tenant (Month 4+). |
| **Recommendation** | Per-tenant queues with weighted fair queuing. Priority: `critical` > `high` > `normal` > `low`. Tenant quota: max concurrent jobs. |

### 17.4 Job Observability
| Priority | **High** |
|---|---|
| **Problem** | No: job status API, progress tracking, logs aggregation, distributed tracing. |
| **Why Needed** | "Where is my crawl?" "Why did job fail?" "How long will it take?" |
| **When Critical** | Async API launch (Month 2). |
| **Recommendation** | Job status: `pending` → `running` (progress%) → `completed`/`failed`/`cancelled`. Emit `job.started`, `job.progress`, `job.completed` events. Correlate with `correlationId`. |

---

## 18. Scheduling System

### 18.1 Cron / Schedule Management
| Priority | **High** |
|---|---|
| **Problem** | Automation Engine mentions "scheduled runs" but no: cron parser, timezone support, schedule CRUD, conflict detection, skip/catch-up policies. |
| **Why Needed** | "Run audit every Monday 2am UTC" — daylight saving, missed runs, manual trigger. |
| **When Critical** | Automation Engine (Month 5+). |
| **Recommendation** | Add `SchedulerService`: `createSchedule(cron, timezone, job)`, `listSchedules()`, `triggerNow(scheduleId)`, `pause/resume`. Use `croner` or `later.js`. Handle: `misfirePolicy: skip | runOnce | runAll`. |

### 18.2 Distributed Lock for Scheduled Jobs
| Priority | **High** |
|---|---|
| **Problem** | Multiple scheduler replicas → duplicate job execution. |
| **Why Needed** | HA scheduler = duplicate crawls, duplicate bills. |
| **When Critical** | HA deployment (Month 3+). |
| **Recommendation** | Redis-based distributed lock (`SET NX EX`). Lock key: `schedule:{scheduleId}:{executionTime}`. TTL = max job duration. |

### 18.3 Calendar / Business Day Scheduling
| Priority | **Medium** |
|---|---|
| **Problem** | Cron doesn't support: "first business day of month", "every weekday except holidays". |
| **Why Needed** | Business reports: "Generate monthly SEO report on 1st business day". |
| **When Critical** | Enterprise reporting (Month 6+). |
| **Recommendation** | Integrate `business-days` calendar. Schedule definition: `frequency: 'monthly', day: '1st-business-day', timezone: 'UTC', holidays: 'US'`. |

---

## 19. Marketplace / Plugin Ecosystem

### 19.1 Plugin Registry & Distribution
| Priority | **Medium** |
|---|---|
| **Problem** | No: plugin publishing, discovery, installation, update, signing, verification. |
| **Why Needed** | Community plugins, partner integrations, internal sharing across teams. |
| **When Critical** | Plugin marketplace (Month 8+). |
| **Recommendation** | Build `@rentfy/plugin-registry` (private npm-like): `publish`, `install`, `search`, `audit`. CLI: `rentfy plugin install seo/title-optimizer`. Signatures: `cosign` / `sigstore`. |

### 19.2 Plugin Sandbox & Security
| Priority | **High** |
|---|---|
| **Problem** | Third-party plugins run with full Node.js privileges. |
| **Why Needed** | Supply chain attack: malicious plugin exfiltrates data, mines crypto. |
| **When Critical** | Marketplace launch (Month 8+). |
| **Recommendation** | Mandatory sandbox: WASM (wasmtime) or isolated Worker Thread with `contextBridge`. Capability-based permissions: `fs:read:/allowed/path`, `net:connect:api.openai.com`, `env:read:OPENAI_KEY`. |

### 19.3 Plugin Monetization
| Priority | **Future** |
|---|---|
| **Problem** | No: paid plugins, revenue sharing, licensing, trials. |
| **Why Needed** | Partner ecosystem revenue. |
| **When Critical** | Year 2+. |
| **Recommendation** | License validation in `PluginRegistry`: `verifyLicense(pluginId, tenantId) → LicenseStatus`. Metered billing via `MeteringService`. |

---

## 20. Multi-Tenant Architecture

### 20.1 Tenant Isolation Model
| Priority | **Critical** |
|---|---|
| **Problem** | No tenant concept in SDK. `EngineConfig.scope` is a string, not typed tenant ID. Storage, events, config, metrics all lack tenant isolation. |
| **Why Needed** | SaaS platform. Tenant A must not see Tenant B's: crawl data, SEO reports, issues, graph entities. |
| **When Critical** | Before first beta customer (Month 3). |
| **Recommendation** | Add `TenantContext` to all SDK operations. `StorageAdapter` enforces: `WHERE tenant_id = $1`. `EventBus` partitions by `tenantId`. `ConfigManager` resolves per-tenant overrides. `MetricsCollector` adds `tenant_id` label. |

### 20.2 Tenant Onboarding / Provisioning
| Priority | **High** |
|---|---|
| **Problem** | No: tenant create, default config, resource quotas, feature flags, trial management. |
| **Why Needed** | Self-serve signup. |
| **When Critical** | Public beta (Month 4+). |
| **Recommendation** | Add `TenantService`: `createTenant(slug, tier)`, `provisionResources(tenantId)`, `setQuota(tenantId, resource, limit)`, `getUsage(tenantId)`. |

### 20.3 Cross-Tenant Analytics (Admin)
| Priority | **Medium** |
|---|---|
| **Problem** | Platform admin needs: aggregate usage, health, adoption across tenants. |
| **Why Needed** | Product decisions, capacity planning, abuse detection. |
| **When Critical** | Month 4+. |
| **Recommendation** | Admin `DashboardDataProvider` with `tenantId: '*'` scope. Aggregated metrics only (no PII). Role: `platform_admin`. |

### 20.4 Data Residency / Compliance
| Priority | **Future** |
|---|---|
| **Problem** | No: region selection, data localization, GDPR/CCPA compliance, data export/deletion. |
| **Why Needed** | EU customers require EU data residency. |
| **When Critical** | International expansion (Year 2+). |
| **Recommendation** | Tenant `dataRegion: 'us-east' | 'eu-west' | 'ap-south'`. Provision infra per region. `StorageAdapter` routes to regional DB. `EventBus` replicates only metadata cross-region. |

---

## 21. Enterprise Readiness

### 21.1 SSO / SAML / OIDC / SCIM
| Priority | **High** |
|---|---|
| **Problem** | Only email/password (Supabase Auth). Enterprise needs: SAML, OIDC, SCIM provisioning, JIT provisioning, attribute mapping. |
| **Why Needed** | Enterprise deals require SSO. |
| **When Critical** | First enterprise pilot (Month 4+). |
| **Recommendation** | Integrate `AuthService` with: SAML (SAML Jackson), OIDC (standard), SCIM (scim-server). Map: `groups → roles`, `attributes → tenant metadata`. |

### 21.2 Audit Logging (Compliance)
| Priority | **High** |
|---|---|
| **Problem** | Structured logs ≠ audit logs. No: immutable, tamper-evident, retention, export, SIEM integration. |
| **Why Needed** | SOC2, ISO27001, GDPR Art. 30. |
| **When Critical** | Enterprise pilot (Month 4+). |
| **Recommendation** | `AuditLogService`: append-only (CloudTrail-style), signed entries, retention policy (7 years), export to S3/GCS, Splunk/Datadog/Sentinel integration. |

### 21.3 Role-Based Access Control (RBAC)
| Priority | **Critical** |
|---|---|
| **Problem** | Only Supabase RLS. No: engine-level permissions, plugin-level, data-level, custom roles. |
| **Why Needed** | Enterprise org: Admin, SEO Manager, Content Editor, Developer, Viewer — different engine/plugin access. |
| **When Critical** | Multi-user tenants (Month 4+). |
| **Recommendation** | `AuthorizationService` with: `Role`, `Permission(resource, action)`, `Policy(condition)`. Default roles: `tenant_admin`, `seo_manager`, `content_editor`, `developer`, `viewer`. Policy engine: OPA/Cedar. |

### 21.4 API Keys / Service Accounts
| Priority | **High** |
|---|---|
| **Problem** | No programmatic auth. CI/CD, external tools need API keys. |
| **Why Needed** | "Run crawl via API", "Sync SEO reports to Data Warehouse". |
| **When Critical** | API launch (Month 3+). |
| **Recommendation** | `ApiKeyService`: `createKey(name, scopes[], expiresAt)`, `rotateKey(id)`, `revokeKey(id)`. Scopes: `crawl:read`, `crawl:write`, `seo:read`, `seo:write`, `admin`. Hash keys (bcrypt). |

### 21.5 SLA / Contractual Commitments
| Priority | **Future** |
|---|---|
| **Problem** | No: uptime SLA, latency SLO, support tiers, penalty clauses. |
| **Why Needed** | Enterprise contracts. |
| **When Critical** | Year 2. |
| **Recommendation** | Define: `SLA: 99.9% uptime`, `SLO: p99 < 2s for SEO analysis`, `Support: Business / Enterprise / Premium`. Build monitoring/alerting to match. |

---

## 22. API Versioning

### 22.1 API Versioning Strategy
| Priority | **High** |
|---|---|
| **Problem** | No versioning: REST routes in `app/api/`, engine contracts in TypeScript. Breaking changes = broken clients. |
| **Why Needed** | Mobile apps, external integrations, partner APIs need stability. |
| **When Critical** | Public API (Month 3+). |
| **Recommendation** | URL versioning: `/api/v1/`, `/api/v2/`. Deprecation policy: 12 months notice. OpenAPI spec per version. SDK generates client per version. |

### 22.2 Engine Contract Versioning
| Priority | **High** |
|---|---|
| **Problem** | `EngineContracts` namespace has no versioning. `CrawlDataReady` v1 → v2 breaks consumers. |
| **Why Needed** | Engines evolve independently. SEO Engine v2 may need different crawl data shape. |
| **When Critical** | Multi-engine (Month 3+). |
| **Recommendation** | Version contracts: `EngineContracts.v1`, `EngineContracts.v2`. Event envelope includes `contractVersion`. Consumers declare supported versions. Adapter layer translates. |

### 22.3 GraphQL / tRPC Alternative
| Priority | **Medium** |
|---|---|
| **Problem** | REST only. Over-fetching (dashboard), under-fetching (mobile), no real-time subscriptions. |
| **Why Needed** | Complex dashboard queries: "SEO report + crawl status + recent issues + graph neighbors" = 5 REST calls. |
| **When Critical** | Complex UIs (Month 4+). |
| **Recommendation** | Add GraphQL gateway (Apollo / Pothos) or tRPC. Schema stitching from engine contracts. Subscriptions via Event Bus. |

---

## 23. Monitoring and Observability

### 23.1 Unified Dashboard
| Priority | **High** |
|---|---|
| **Problem** | `DashboardDataProvider` defined but no: real-time streaming, alerting, anomaly detection, custom dashboards per role. |
| **Why Needed** | Platform team needs: "Are all engines healthy?" "Why did crawl throughput drop?" |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | Grafana + Loki + Tempo + Prometheus stack. Pre-built dashboards: Engine Health, Crawl Pipeline, Audit Pipeline, Tenant Usage, Cost. Alerting: PrometheusRule → Alertmanager → PagerDuty/Slack. |

### 23.2 Log Aggregation
| Priority | **Critical** |
|---|---|
| **Problem** | `LogTransport` writes to console/file. No: central aggregation, query, retention, alerting on logs. |
| **Why Needed** | Debugging distributed failures requires correlated logs. |
| **When Critical** | Multi-engine (Month 2+). |
| **Recommendation** | Loki (Grafana) or Elasticsearch/OpenSearch. SDK `LokiTransport` / `ElasticTransport`. Structured JSON only. Retention: 30d hot, 1y cold. |

### 23.3 Metric Alerting
| Priority | **Critical** |
|---|---|
| **Problem** | Metrics defined but no: alert rules, notification routing, runbooks, SLO burn rate alerts. |
| **Why Needed** | "Crawler success rate < 90% for 5m" → page on-call. |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | Define `PrometheusRule` per engine: `EngineDown`, `HighErrorRate`, `HighLatency`, `QueueBacklog`, `LowDiskSpace`. Integrate Alertmanager → PagerDuty / Opsgenie / Slack. |

### 23.4 Synthetic Monitoring
| Priority | **Medium** |
|---|---|
| **Problem** | No: external health checks, API latency from customer perspective, SSL cert expiry, DNS. |
| **Why Needed** | Internal metrics ≠ user experience. |
| **When Critical** | Public API (Month 3+). |
| **Recommendation** | Checkly, Grafana Synthetic Monitoring, or custom: `curl -f https://api.rentfy.com/health` every 30s from 3 regions. Alert on failure. |

---

## 24. Distributed Tracing

### 24.1 Trace Context Propagation
| Priority | **Critical** |
|---|---|
| **Problem** | `correlationId` in logs/events but no: trace context (W3C TraceContext), span creation, parent-child relationships, sampling. |
| **Why Needed** | "Crawl → SEO → Audit" chain: which span failed? Where is latency? |
| **When Critical** | Multi-engine (Month 3+). |
| **Recommendation** | Adopt OpenTelemetry. SDK: `TracerProvider`, `propagation: W3C`. Every `Engine.run()` starts span. Every `Plugin.run()` child span. Every `EventBus.publish()` injects trace context. Every `StorageAdapter` call: span. Export to Tempo / Jaeger / Datadog. |

### 24.2 Trace Sampling
| Priority | **High** |
|---|---|
| **Problem** | 100% tracing = cost explosion. No: head/tail sampling, adaptive sampling. |
| **Why Needed** | 10k traces/sec = $1000+/mo in tracing backend. |
| **When Critical** | Production scale (Month 3+). |
| **Recommendation** | OTel sampler: `ParentBased(TraceIdRatioBased(0.1))` + `TailSampling(alwaysSampleErrors, latency > 1s)`. Configure per engine. |

### 24.3 Trace-Based Debugging
| Priority | **Medium** |
|---|---|
| **Problem** | No: trace query UI, span comparison, flame graphs, trace-to-logs correlation. |
| **Why Needed** | "Why was this crawl slow?" → trace shows: DNS 2s, TLS 1s, HTML parse 500ms. |
| **When Critical** | Month 3+. |
| **Recommendation** | Tempo + Grafana: TraceQL queries, span attributes → logs (Loki), metrics (Prometheus) via exemplars. |

---

## 25. Feature Flags

### 25.1 Feature Flag Service
| Priority | **High** |
|---|---|
| **Problem** | `featureFlags` in config but no: targeting, gradual rollout, kill switch, experimentation, audit. |
| **Why Needed** | "Roll out AI title generator to 10% of Pro users". "Kill switch for broken crawler". |
| **When Critical** | First feature behind flag (Month 2+). |
| **Recommendation** | Integrate LaunchDarkly / Unleash / GrowthBook. SDK: `FeatureFlagService`: `isEnabled(flag, context)`, `getVariant(flag, context)`. Context: `tenantId`, `userId`, `plan`, `engine`. |

### 25.2 Flag-Driven Plugin Registration
| Priority | **Medium** |
|---|---|
| **Problem** | Plugins registered at startup. Can't enable/disable per tenant via flag without restart. |
| **Why Needed** | "Enable schema analyzer for Enterprise only". |
| **When Critical** | Tiered features (Month 4+). |
| **Recommendation** | `PluginRegistry` checks flag on `list()`/`forPhase()`: `plugin.enabledFlag?: string`. Dynamic enable/disable via flag change event. |

---

## 26. Configuration Management

### 26.1 Configuration Drift Detection
| Priority | **High** |
|---|---|
| **Problem** | Runtime overrides (env, programmatic) diverge from committed config. No: drift detection, audit, auto-remediation. |
| **Why Needed** | "Why is crawler timeout 5s in prod but 30s in config?" |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | `ConfigManager` emits `config.drift` event: `source`, `key`, `expected`, `actual`. Daily job: compare runtime vs Git. Alert on drift. |

### 26.2 Configuration Validation Pipeline
| Priority | **High** |
|---|---|
| **Problem** | Invalid config deployed → engine crash. No: PR validation, staging validation, canary validation. |
| **Why Needed** | Prevent: missing required field, wrong type, invalid enum. |
| **When Critical** | CI/CD (Month 1). |
| **Recommendation** | CI step: `rentfy config validate --env=staging --schema=strict`. Staging deployment: smoke test `engine.run()` with staging config. Canary: 1% traffic with new config. |

### 26.3 Secrets Rotation
| Priority | **High** |
|---|---|
| **Problem** | Supabase key, OpenAI key, Redis password — no rotation, no expiry detection. |
| **Why Needed** | Security compliance. Leaked key = breach. |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | `SecretManager` with: `rotateSecret(name)`, `onRotation(callback)`, `checkExpiry()`. Integrate: AWS Secrets Manager rotation, Vault dynamic secrets. SDK reloads config on rotation event. |

---

## 27. Cost Tracking

### 27.1 Infrastructure Cost Allocation
| Priority | **High** |
|---|---|
| **Problem** | No: per-tenant cost, per-engine cost, per-feature cost. Shared Supabase, Redis, Kubernetes = invisible costs. |
| **Why Needed** | Profitability: "Tenant X costs $500/mo but pays $200". Capacity planning. |
| **When Critical** | Monetization (Month 5+). |
| **Recommendation** | `CostTrackingService`: tag all resources (K8s labels, DB schemas, S3 prefixes) with `tenant_id`, `engine`, `feature`. Ingest: AWS CUR, GCP Billing, Kubernetes kubecost. Allocate: `cost = Σ(resource_unit_cost × usage)`. Dashboard: cost) usage`. |

### 27.2 LLM Token Cost Tracking
| Priority | **Critical** |
|---|---|
| **Problem** | AI Optimization Engine will burn $10k+/mo in LLM calls. No: per-request cost, per-tenant budget, per-model tracking, anomaly detection. |
| **Why Needed** | Runaway LLM costs = business failure. |
| **When Critical** | AI Engine launch (Month 5+). |
| **Recommendation** | `LlmGateway` emits: `llm.tokens.input`, `llm.tokens.output`, `llm.cost.usd` per request. `BudgetService`: `setBudget(tenant, model, monthlyUsd)`, `enforceBudget()` → reject request / downgrade model. Alert at 80%. |

### 27.3 Crawl Cost Tracking
| Priority | **Medium** |
|---|---|
| **Problem** | Crawler bandwidth, CPU, storage — no cost attribution. |
| **Why Needed** | "Enterprise crawl 1M pages = $X". Pricing model. |
| **When Critical** | Crawl-as-a-service (Month 6+). |
| **Recommendation** | `CrawlerEngine` emits: `crawl.pages`, `crawl.bytes`, `crawl.duration`, `crawl.cpuMs`. `CostModel`: `$/GB bandwidth`, `$/CPU-hour`, `$/GB-month storage`. |

---

## 28. Testing Infrastructure

### 28.1 Contract Testing
| Priority | **High** |
|---|---|
| **Problem** | Engines communicate via events/contracts. No: consumer-driven contract testing, schema compatibility CI. |
| **Why Needed** | SEO Engine update breaks Crawler Engine consumer. |
| **When Critical** | Multi-engine (Month 3+). |
| **Recommendation** | Pact (consumer-driven) or GraphQL schema validation. CI: `pact:verify` for each engine pair. Event schema: `EventSchemaRegistry.validateCompatibility(v1, v2)`. |

### 28.2 Chaos Testing
| Priority | **Medium** |
|---|---|
| **Problem** | No: fault injection, dependency failure simulation, latency injection. |
| **Why Needed** | Validates: circuit breakers, retries, graceful degradation. |
| **When Critical** | Pre-production (Month 3+). |
| **Recommendation** | Chaos Mesh (K8s) or Gremlin. Scenarios: `storage.latency(5s)`, `eventbus.partition(50%)`, `llm.timeout`, `config.reload`. Run weekly. |

### 28.3 Performance Benchmarking
| Priority | **High** |
|---|---|
| **Problem** | No: baseline benchmarks, regression detection, comparison across versions. |
| **Why Needed** | "v2.1 is 3x slower than v2.0" — catch before merge. |
| **When Critical** | CI/CD (Month 1). |
| **Recommendation** | `bencher.dev` or custom: `benchmarks/` per engine. CI: run on `main` + PR. Compare: p50/p95/p99, throughput, memory. Fail PR if >10% regression. |

### 28.4 Integration Test Sandbox
| Priority | **High** |
|---|---|
| **Problem** | Tests use `MemoryStorageAdapter`, `MemoryEventBus`. No: real Supabase, real Redis, real Kafka, real LLM (mock). |
| **Why Needed** | Memory adapters hide: connection pool exhaustion, transaction conflicts, network latency, serialization bugs. |
| **When Critical** | Month 2 (staging environment). |
| **Recommendation** | Testcontainers: spin up real Supabase, Redis, Kafka, MinIO per test suite. GitHub Actions: `services:` for integration tests. |

---

## 29. CI/CD Architecture

### 29.1 Monorepo Build System
| Priority | **High** |
|---|---|
| **Problem** | Single `package.json` at root. No: workspace isolation, affected projects, incremental builds, caching. |
| **Why Needed** | 15+ packages. Changing `@rentfy/engine-sdk` shouldn't rebuild `apps/web` if unaffected. |
| **When Critical** | Monorepo migration (Month 1). |
| **Recommendation** | Turborepo or Nx. `turbo.json`: `pipeline: { build: { dependsOn: ["^build"] }, test: { dependsOn: ["build"] } }`. Remote caching (Vercel / Turborepo). |

### 29.2 Deployment Pipeline
| Priority | **High** |
|---|---|
| **Problem** | No: staging, canary, blue-green, rollback, feature flags in deploy. |
| **Why Needed** | Safe, frequent deployments. |
| **When Critical** | Production (Month 2+). |
| **Recommendation** | GitHub Actions / GitLab CI / ArgoCD: `build → test → staging → canary(10%) → promote → rollback on alert`. Helm charts for K8s. Argo Rollouts for canary. |

### 29.3 Database Migration Pipeline
| Priority | **Critical** |
|---|---|
| **Problem** | Supabase migrations in `supabase/migrations/` but no: CI validation, staging apply, rollback, zero-downtime. |
| **Why Needed** | `ALTER TABLE` locks = downtime. Failed migration = broken prod. |
| **When Critical** | First schema change (Month 1). |
| **Recommendation** | `supabase db diff` in CI. Staging: auto-apply. Production: manual approve. Zero-downtime: expand/contract pattern. `pgroll` or `atlas` for reversible migrations. |

### 29.4 SDK Release Management
| Priority | **High** |
|---|---|
| **Problem** | `@rentfy/engine-sdk` versioning, changelog, breaking change policy, deprecation timeline not defined. |
| **Why Needed** | 13 engines depend on SDK. Breaking change = blocked releases. |
| **When Critical** | SDK v1.0 (Month 1). |
| **Recommendation** | SemVer strict. `changesets` for versioning. `CHANGELOG.md` per package. Deprecation: 2 minor versions notice. `@deprecated` JSDoc + runtime warning. |

---

## 30. Long-Term Maintainability

### 30.1 Technical Debt Budget
| Priority | **Medium** |
|---|---|
| **Problem** | No: debt tracking, allocation, paydown sprints, architecture decision records (ADR) enforcement. |
| **Why Needed** | 13 engines + SDK = compounding complexity. "Quick fix" becomes permanent. |
| **When Critical** | Month 6+. |
| **Recommendation** | ADR process (already have RFCs). 20% sprint capacity for debt. `DEBT.md` per package. Quarterly architecture review. |

### 30.2 Documentation as Code
| Priority | **High** |
|---|---|
| **Problem** | Architecture blueprint = Markdown. No: living docs, API reference generation, diagram sync, tutorial validation. |
| **Why Needed** | 13 engines × 50 plugins = impossible to maintain manually. |
| **When Critical** | SDK v1.0 (Month 1). |
| **Recommendation** | TypeDoc → API reference. Mermaid diagrams in code → auto-render. Docusaurus / Mintlify for portal. `doctest` for code examples. |

### 30.3 Dependency Management
| Priority | **High** |
|---|---|
| **Problem** | No: `dependabot`, `renovate`, license scanning, vulnerability scanning, SBOM. |
| **Why Needed** | Supply chain security. `lodash` CVE = 15 packages affected. |
| **When Critical** | Month 1. |
| **Recommendation** | Renovate: grouped PRs, auto-merge patch. `npm audit` / `snyk` in CI. `cyclonedx` SBOM per release. License: `license-checker` — fail on GPL/AGPL. |

### 30.4 Architecture Evolution Guardrails
| Priority | **Medium** |
|---|---|
| **Problem** | No: module boundary enforcement, circular dependency detection, layer violation detection. |
| **Why Needed** | Engine imports SDK internals. Plugin imports another plugin's implementation. |
| **When Critical** | Month 3 (codebase growth). |
| **Recommendation** | `eslint-plugin-boundaries`: `engine/*` → `sdk/*` only. `plugin/*` → `sdk/*` + own `types/`. `madge` for circular deps in CI. |

### 30.5 Knowledge Transfer / Bus Factor
| Priority | **High** |
|---|---|
| **Problem** | Single architect knows: event contracts, graph schema, rule engine internals. |
| **Why Needed** | Team scales. Onboarding takes months without docs. |
| **When Critical** | Team > 5 engineers (Month 2+). |
| **Recommendation** | `ONBOARDING.md` per package. Architecture decision records (ADR) for every major choice. Pair programming rotation. "Architecture office hours" weekly. |

---

## Summary: Priority Matrix

| Category | Critical | High | Medium | Future |
|---|---|---|---|---|
| **Infrastructure** | 3 (API Gateway, Secrets, Rate Limiting) | 2 (Service Mesh, Blob/CDN) | 1 (Cert Mgmt) | - |
| **Platform Services** | 3 (Auth, AuthZ, Job Queue) | 4 (Tenant, Billing, Search, Workflow) | 1 (Notifications) | - |
| **Scalability** | 1 (Event Bus) | 4 (Pipeline, Storage Pool, Crawler, Graph Sharding) | - | - |
| **Performance** | 1 (Sync run) | 3 (Cache, Incremental Rules, Metrics Cardinality) | 1 (Graph Query) | - |
| **Security** | 3 (Input Validation, Rate Limit, AuthZ) | 3 (Sandbox, Audit Log, Encryption, Event AuthZ) | - | - |
| **Reliability** | 1 (Health Checks) | 4 (Graceful Shutdown, Circuit Breaker, DLQ, Idempotency) | 1 (Backup) | 1 (Multi-region) |
| **Fault Tolerance** | - | 4 (Plugin Isolation, Idempotency, Crawl Resume, DR) | - | 1 (Multi-region) |
| **Disaster Recovery** | - | 1 (DR Plan) | 1 (Chaos Eng) | - |
| **Plugin System** | - | 3 (Versioning, Testing, Resource Limits) | 2 (Marketplace, Hot Reload) | - |
| **Event Bus** | - | 4 (Schema Registry, Exactly-Once, Ordering, Consumer Groups) | 1 (Event Sourcing) | - |
| **Rule Engine** | - | 2 (Testing, Explainability) | 1 (Composition) | 1 (Distributed) |
| **Storage** | - | 3 (Migrations, OCC, CDC) | 2 (Query Builder, Soft Delete) | - |
| **Knowledge Graph** | 1 (Entity Resolution) | 3 (Temporal, Provenance, Vectors) | 1 (Algorithms as Plugins) | - |
| **Engine SDK** | - | 4 (Lifecycle, Versioning, RPC, Metrics) | 1 (Config Gen) | - |
| **AI Integration** | 2 (LLM Gateway, Guardrails) | 2 (Prompt Framework, RAG) | 1 (Rule Gen) | - |
| **Workflow Engine** | - | 3 (DSL, Human-in-loop, Observability) | - | - |
| **Job Queue** | 1 (Queue Interface) | 3 (Workers, Priority, Observability) | - | - |
| **Scheduling** | - | 2 (Cron, Distributed Lock) | 1 (Calendar) | - |
| **Marketplace** | - | 1 (Sandbox) | 1 (Registry) | 1 (Monetization) |
| **Multi-Tenant** | 1 (Isolation) | 2 (Onboarding, Admin Analytics) | - | 1 (Data Residency) |
| **Enterprise** | 1 (RBAC) | 4 (SSO, Audit, API Keys, SLA) | - | - |
| **API Versioning** | - | 2 (Strategy, Contract Versioning) | 1 (GraphQL) | - |
| **Observability** | 2 (Logs, Alerts) | 2 (Dashboard, Synthetic) | - | - |
| **Distributed Tracing** | 1 (Context Prop) | 1 (Sampling) | 1 (Debugging) | - |
| **Feature Flags** | - | 1 (Service) | 1 (Plugin Flags) | - |
| **Config Mgmt** | - | 3 (Drift, Validation, Secrets Rotation) | - | - |
| **Cost Tracking** | 1 (LLM Cost) | 1 (Infra Cost) | 1 (Crawl Cost) | - |
| **Testing** | - | 3 (Contract, Perf, Integration) | 1 (Chaos) | - |
| **CI/CD** | 1 (DB Migrations) | 3 (Monorepo, Deploy, SDK Release) | - | - |
| **Maintainability** | - | 3 (Docs, Deps, Boundaries) | 1 (Debt) | 1 (Bus Factor) |

**Total: 16 Critical, 48 High, 15 Medium, 6 Future**

---

## Recommended Implementation Sequence

### Phase 0: Foundation (Weeks 1-4) — *Do First*
1. **API Gateway + Rate Limiting + Auth** (Critical path for any external access)
2. **Job Queue (BullMQ) + Async Engine.run()** (Unblocks crawler/SEO async)
3. **Event Bus with Redis Streams transport** (Replaces in-memory; enables multi-engine)
4. **Health Checks + Graceful Shutdown** (K8s readiness)
5. **OpenTelemetry + Distributed Tracing** (Observability foundation)
6. **Secret Manager Integration** (Security baseline)
7. **Tenant Context + Storage Isolation** (Multi-tenant foundation)
8. **CI/CD: Turborepo + Testcontainers + Migration Pipeline** (Dev velocity)

### Phase 1: Core Platform (Weeks 5-10)
9. **Plugin Sandbox (Worker Threads)** (Security for marketplace)
10. **Rule Engine + Testing Harness** (Audit Engine foundation)
11. **Storage: Migrations + OCC + CDC** (Data integrity)
12. **Feature Flag Service (Unleash)** (Safe rollouts)
13. **Config Drift Detection + Validation Pipeline** (Operational safety)
14. **Cost Tracking: LLM Gateway + Budget Enforcement** (AI cost control)
15. **RBAC + API Keys + Audit Logging** (Enterprise readiness)

### Phase 2: Engine Scale (Weeks 11-18)
16. **Crawler: Distributed Coordinator + Workers** (Scale crawls)
17. **Plugin Parallel Executor + Resource Limits** (SEO Engine performance)
18. **Knowledge Graph: Entity Resolution + Vector Search** (Graph quality)
19. **Workflow Engine (Temporal) + Human-in-loop** (Automation)
20. **Scheduler + Distributed Lock** (Reliable cron)
21. **Event Bus: Schema Registry + Exactly-Once + Consumer Groups** (Reliability)
22. **GraphQL Gateway** (Dashboard/API flexibility)

### Phase 3: Intelligence & Ecosystem (Weeks 19-30)
23. **AI: Prompt Registry + RAG Pipeline + Guardrails** (AI quality)
24. **Learning Engine: Pattern Mining → Rule Generation** (Self-improving)
25. **Plugin Marketplace + Registry + Monetization** (Ecosystem)
26. **Multi-region DR + Data Residency** (Enterprise)
27. **Advanced Cost Allocation + Profitability Dashboards** (Business)
28. **Chaos Engineering + Synthetic Monitoring** (Resilience)

---

## Final Recommendation

**The architecture blueprint is a strong *interface specification* but lacks *operational specification*.** Before writing implementation code, the team should:

1. **Adopt this review as a backlog** — convert each Critical/High item to a GitHub Issue with owner.
2. **Prioritize Phase 0 items** — they unblock all downstream work.
3. **Establish Architecture Review Board** — weekly 30min to review ADRs, tech debt, and progress on this backlog.
4. **Invest in developer experience early** — Turborepo, Testcontainers, living docs, contract testing — these compound.

The platform *can* support 13 engines at scale, but only if the operational foundation (Phase 0) is solid before engine development accelerates.

---

*End of Architecture Review Report*