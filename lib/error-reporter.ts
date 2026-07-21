/**
 * Centralized error reporting abstraction.
 *
 * Ready for future Sentry (or any other provider) integration.
 * Currently logs to the structured logger; swap `reportError`'s
 * implementation to `Sentry.captureException()` when ready.
 *
 * Do NOT install Sentry yet — this is the pluggable seam.
 */

import type { StructuredLogger } from "@rentfy/engine-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorContext {
  /** The request ID for correlation. */
  requestId?: string;
  /** The route where the error occurred. */
  route?: string;
  /** The authenticated user ID, if available. */
  userId?: string;
  /** The affected property ID, if applicable. */
  propertyId?: string;
  /** The affected lead ID, if applicable. */
  leadId?: string;
  /** The affected agency ID, if applicable. */
  agencyId?: string;
  /** Additional unstructured metadata. */
  extra?: Record<string, unknown>;
}

export interface ErrorReporter {
  /**
   * Report an error for operational visibility.
   *
   * @param error     The thrown Error or plain message.
   * @param context   Optional request/entity context for filtering in dashboards.
   * @param severity  How severe the error is. Defaults to "error".
   */
  report(
    error: Error | string,
    context?: ErrorContext,
    severity?: "warn" | "error" | "fatal",
  ): void;

  /**
   * Report a user-facing warning that did not cause a 500 but is
   * operationally noteworthy (e.g. rate-limit reached, permission denied).
   */
  warn(message: string, context?: ErrorContext): void;
}

// ---------------------------------------------------------------------------
// Default implementation (structured-logger based)
// ---------------------------------------------------------------------------

export class DefaultErrorReporter implements ErrorReporter {
  constructor(private readonly logger: StructuredLogger) {}

  report(
    error: Error | string,
    context?: ErrorContext,
    severity: "warn" | "error" | "fatal" = "error",
  ): void {
    const err =
      typeof error === "string" ? new Error(error) : error;

    const meta: Record<string, unknown> = {
      error: err.message,
      name: err.name,
      stack: err.stack,
    };

    if (context) {
      if (context.requestId) meta.requestId = context.requestId;
      if (context.route) meta.route = context.route;
      if (context.userId) meta.userId = context.userId;
      if (context.propertyId) meta.propertyId = context.propertyId;
      if (context.leadId) meta.leadId = context.leadId;
      if (context.agencyId) meta.agencyId = context.agencyId;
      if (context.extra) Object.assign(meta, context.extra);
    }

    if (severity === "fatal") {
      this.logger.fatal("Unrecoverable error", meta, err);
    } else if (severity === "warn") {
      this.logger.warn("Operational warning", meta);
    } else {
      this.logger.error("Application error", meta, err);
    }
  }

  warn(message: string, context?: ErrorContext): void {
    this.report(message, context, "warn");
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Global error reporter. Replace with a Sentry shim during an ops sprint
 * to capture exceptions to a centralized dashboard without changing any
 * call sites.
 */
let _reporter: ErrorReporter | null = null;

export function getErrorReporter(logger: StructuredLogger): ErrorReporter {
  if (!_reporter) {
    _reporter = new DefaultErrorReporter(logger);
  }
  return _reporter;
}

/**
 * Replace the global error reporter at any time (e.g. for testing or
 * to swap in Sentry).
 */
export function setErrorReporter(reporter: ErrorReporter): void {
  _reporter = reporter;
}