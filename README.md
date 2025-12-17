# @synapsmedia/sentry-rate-limiter

In-memory rate limiter for Sentry error reporting to prevent duplicate error spam and avoid draining your error log quota.

## Why?

While Sentry has spike protection that limits errors to ~500 per hour, it doesn't make sense to receive hundreds of logs for a single error on the backend. This library ensures that each unique error is only reported a few times within a configurable time window, dramatically reducing quota usage while still capturing enough information to debug issues.

## Features

- 🚀 **Zero dependencies** (except peer dependency on `@sentry/node`)
- 📦 **TypeScript support** with full type definitions
- 🎯 **Smart fingerprinting** based on error type, message, and stack trace
- ⏱️ **Configurable time windows** (hourly, daily, or custom)
- 🧹 **Automatic memory cleanup** to prevent memory leaks
- 📊 **Statistics API** to monitor rate limiting behavior

## Installation

```bash
npm install @synapsmedia/sentry-rate-limiter
```

or

```bash
yarn add @synapsmedia/sentry-rate-limiter
```

**Peer dependency:** Requires `@sentry/node` v7.x or v8.x

## Usage

### Basic Setup

```typescript
import * as Sentry from "@sentry/node";
import { SentryRateLimiter, createBeforeSend } from "@synapsmedia/sentry-rate-limiter";

// Create rate limiter instance
const rateLimiter = new SentryRateLimiter({
  maxReportsPerWindow: 5,  // Allow max 5 reports per window
  windowHours: 1,          // 1 hour window
});

// Initialize Sentry with rate limiting
Sentry.init({
  dsn: "your-sentry-dsn",
  beforeSend: createBeforeSend(rateLimiter),
  // ... other Sentry options
});
```

### Custom Configuration

```typescript
const rateLimiter = new SentryRateLimiter({
  maxReportsPerWindow: 3,        // Max 3 reports per window
  windowHours: 24,               // 24 hour window
  cleanupIntervalMinutes: 30,    // Run cleanup every 30 minutes
});
```

### Manual Integration

If you need more control over the `beforeSend` hook:

```typescript
import { SentryRateLimiter } from "@synapsmedia/sentry-rate-limiter";

const rateLimiter = new SentryRateLimiter();

Sentry.init({
  dsn: "your-sentry-dsn",
  beforeSend(event) {
    // Your custom logic here
    
    // Apply rate limiting
    if (!rateLimiter.shouldReport(event)) {
      return null;  // Drop the event
    }
    
    // More custom logic
    
    return event;
  },
});
```

### Monitoring Statistics

```typescript
// Get current rate limiting statistics
const stats = rateLimiter.getStats();

console.log(`Tracking ${stats.trackedErrors} unique errors`);
stats.errors.forEach(error => {
  console.log(`Error ${error.fingerprint}:`);
  console.log(`  Count: ${error.count}`);
  console.log(`  First seen: ${error.firstSeen}`);
  console.log(`  Last seen: ${error.lastSeen}`);
});
```

### Cleanup

If you need to manually destroy the rate limiter (e.g., in tests):

```typescript
rateLimiter.destroy();
```

## How It Works

1. **Fingerprinting**: Each error gets a unique SHA256 fingerprint based on:
   - Error type (e.g., `TypeError`, `ReferenceError`)
   - Error message
   - Top 3 stack frames (file and line number)

2. **Rate Limiting**: 
   - First occurrence of an error is always reported
   - Subsequent identical errors are counted within the time window
   - Once the limit is reached, additional occurrences are dropped
   - After the window expires, the counter resets

3. **Memory Management**:
   - Automatic cleanup runs periodically to remove stale entries
   - Prevents memory leaks in long-running applications

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxReportsPerWindow` | `number` | `5` | Maximum number of reports allowed per unique error within the time window |
| `windowHours` | `number` | `1` | Time window in hours for rate limiting |
| `cleanupIntervalMinutes` | `number` | `15` | How often to run cleanup of stale entries (in minutes) |

## Examples

### Strict Rate Limiting (Daily)

```typescript
// Only allow 2 reports per error per day
const rateLimiter = new SentryRateLimiter({
  maxReportsPerWindow: 2,
  windowHours: 24,
});
```

### Lenient Rate Limiting (Hourly)

```typescript
// Allow up to 10 reports per error per hour
const rateLimiter = new SentryRateLimiter({
  maxReportsPerWindow: 10,
  windowHours: 1,
});
```

### Production vs Development

```typescript
const rateLimiter = new SentryRateLimiter({
  maxReportsPerWindow: process.env.NODE_ENV === 'production' ? 3 : 100,
  windowHours: process.env.NODE_ENV === 'production' ? 24 : 1,
});
```

## TypeScript

This library is written in TypeScript and includes full type definitions. All types are exported:

```typescript
import type { 
  SentryRateLimiter, 
  SentryRateLimiterOptions,
  ErrorRateLimit 
} from "@synapsmedia/sentry-rate-limiter";
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/synapsmedia/sentry-rate-limiter/issues).
