export interface EventMetadata {
  readonly id: string;
  readonly correlationId: string;
  readonly source: string;
  readonly timestamp: number;
  readonly version: number;
}

export interface PlatformEvent<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly timestamp: number;
  readonly source: string;
  readonly correlationId: string;
  readonly version: number;
  readonly payload: TPayload;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type PlatformEventType = string;

export type EventHandler<TPayload = unknown> = (
  event: PlatformEvent<TPayload>,
) => void | Promise<void>;

export interface EventEnvelope<TPayload = unknown> {
  readonly event: PlatformEvent<TPayload>;
  readonly attempt: number;
  readonly receivedAt: number;
}

export const DEFAULT_EVENT_VERSION = 1;
