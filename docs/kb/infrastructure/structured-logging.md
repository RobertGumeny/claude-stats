---
title: Structured Logging System
updated: 2026-02-12
category: Infrastructure
tags: [logging, observability, error-handling, debugging]
related_articles:
  - docs/kb/patterns/graceful-error-handling.md
  - docs/kb/features/api-endpoints.md
---

# Structured Logging System

## Overview

A lightweight logging utility that provides consistent, structured log output across all backend modules. Supports multiple log levels with formatted output including timestamps and contextual information.

## Implementation

**Logger Utility** (server/errorHandler.ts):
```typescript
export class Logger {
  static info(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.log(`[INFO] ${timestamp} ${message}${contextStr}`);
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.warn(`[WARN] ${timestamp} ${message}${contextStr}`);
  }

  static error(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.error(`[ERROR] ${timestamp} ${message}${contextStr}`);
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    console.debug(`[DEBUG] ${timestamp} ${message}${contextStr}`);
  }
}
```

**Usage in Parser** (server/parser.ts):
```typescript
Logger.warn('Malformed JSONL line', {
  file: filePath,
  line: lineNumber,
  error: truncatedError
});

Logger.info('Parse complete', {
  file: filePath,
  totalLines: stats.totalLines,
  errorRate: `${errorRate}%`
});
```

**Usage in Scanner** (server/scanner.ts):
```typescript
Logger.error('Failed to parse session file', {
  file: sessionFile.filename,
  error: parseResult.error
});

Logger.debug('Successfully scanned project', {
  project: projectName,
  sessionCount: sessions.length
});
```

## Key Decisions

1. **Static Methods**: Logger uses static methods instead of instance-based API for simplicity - no need to instantiate or pass logger objects.

2. **Four Log Levels**:
   - `INFO` - Successful operations and milestones
   - `WARN` - Recoverable issues (corrupted files, skipped data)
   - `ERROR` - Operation failures requiring attention
   - `DEBUG` - Development-only detailed tracing

3. **Structured Context**: Optional `context` parameter accepts object with relevant data (file paths, error rates, statistics) for easier log parsing.

4. **ISO Timestamps**: All logs include ISO 8601 timestamps for consistent sorting and correlation across services.

5. **Console-Based**: Uses native `console` methods instead of external logging library to minimize dependencies and maintain simplicity for local development tool.

## Usage Example

```typescript
import { Logger } from './errorHandler.js';

// Basic logging
Logger.info('Server started on port 3001');

// With context
Logger.warn('Corrupted JSONL file skipped', {
  file: 'session-abc.jsonl',
  project: 'my-project',
  lineNumber: 42
});

// Error logging
Logger.error('Failed to scan directory', {
  path: projectPath,
  error: error.message
});
```

## Log Output Format

```
[INFO] 2026-02-12T20:30:15.234Z Server started on port 3001
[WARN] 2026-02-12T20:30:20.567Z Corrupted JSONL file skipped {"file":"session-abc.jsonl","project":"my-project","lineNumber":42}
[ERROR] 2026-02-12T20:30:25.890Z Failed to scan directory {"path":"/path/to/project","error":"ENOENT"}
```

## Edge Cases & Gotchas

- **Internal Errors Not Exposed**: Error details are logged but not returned in API responses to avoid leaking internal paths or stack traces to consumers.

- **No Log Rotation**: For local development tool, logs output to console with no persistence or rotation. Production deployment would need log management.

- **Context Serialization**: Complex objects in context parameter are JSON-stringified, which may lose prototype information or cause circular reference errors. Keep context simple.

## Related Topics

- See [Graceful Error Handling](../patterns/graceful-error-handling.md) for error handling middleware and ApiError class
- See [API Endpoints](../features/api-endpoints.md) for integration with Express routes
