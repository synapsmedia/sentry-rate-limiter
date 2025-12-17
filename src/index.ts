import type * as Sentry from "@sentry/node";
import { createHash } from "crypto";

export interface ErrorRateLimit {
  count: number;
  firstSeen: number;
  lastSeen: number;
}

export interface SentryRateLimiterOptions {
  maxReportsPerWindow?: number;
  windowHours?: number;
  cleanupIntervalMinutes?: number;
}

export class SentryRateLimiter {
  private errorCounts = new Map<string, ErrorRateLimit>();
  private readonly maxReportsPerWindow: number;
  private readonly windowMs: number;
  private readonly cleanupIntervalMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: SentryRateLimiterOptions = {}) {
    this.maxReportsPerWindow = options.maxReportsPerWindow ?? 5;
    this.windowMs = (options.windowHours ?? 1) * 60 * 60 * 1000;
    this.cleanupIntervalMs = (options.cleanupIntervalMinutes ?? 15) * 60 * 1000;

    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  private getErrorFingerprint(event: Sentry.ErrorEvent): string {
    const message = event.message || event.exception?.values?.[0]?.value || "unknown";
    const type = event.exception?.values?.[0]?.type || "Error";
    const stacktrace =
      event.exception?.values?.[0]?.stacktrace?.frames
        ?.slice(-3)
        .map((f) => `${f.filename}:${f.lineno}`)
        .join("|") || "";

    const fingerprint = `${type}:${message}:${stacktrace}`;
    return createHash("sha256").update(fingerprint).digest("hex");
  }

  shouldReport(event: Sentry.ErrorEvent): boolean {
    const fingerprint = this.getErrorFingerprint(event);
    const now = Date.now();
    const existing = this.errorCounts.get(fingerprint);

    if (!existing) {
      this.errorCounts.set(fingerprint, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      return true;
    }

    const windowStart = now - this.windowMs;
    if (existing.firstSeen < windowStart) {
      this.errorCounts.set(fingerprint, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      return true;
    }

    if (existing.count >= this.maxReportsPerWindow) {
      existing.lastSeen = now;
      return false;
    }

    existing.count++;
    existing.lastSeen = now;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    for (const [fingerprint, data] of this.errorCounts.entries()) {
      if (data.lastSeen < cutoff) {
        this.errorCounts.delete(fingerprint);
      }
    }
  }

  getStats() {
    return {
      trackedErrors: this.errorCounts.size,
      errors: Array.from(this.errorCounts.entries()).map(([fingerprint, data]) => ({
        fingerprint,
        count: data.count,
        firstSeen: new Date(data.firstSeen),
        lastSeen: new Date(data.lastSeen),
      })),
    };
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.errorCounts.clear();
  }
}

export function createBeforeSend(
  rateLimiter: SentryRateLimiter
): (event: Sentry.ErrorEvent) => Sentry.ErrorEvent | null {
  return (event: Sentry.ErrorEvent) => {
    if (!rateLimiter.shouldReport(event)) {
      return null;
    }
    return event;
  };
}
