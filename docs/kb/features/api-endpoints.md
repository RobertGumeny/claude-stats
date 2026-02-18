---
title: REST API Endpoints
updated: 2026-02-12
category: Features
tags: [express, api, rest, endpoints, backend]
related_articles:
  - docs/kb/dependencies/express.md
  - docs/kb/patterns/in-memory-caching.md
  - docs/kb/patterns/graceful-error-handling.md
  - docs/kb/features/filesystem-scanner.md
  - docs/kb/features/project-list-view.md
  - docs/kb/features/session-list-view.md
  - docs/kb/features/session-detail-view.md
---

# REST API Endpoints

## Overview

The Express server provides a RESTful API for accessing Claude Code session data. Three main endpoints provide progressive detail from project summaries to individual message breakdowns, plus a refresh mechanism for cache invalidation.

## Implementation

**Base URL**: `http://localhost:3001`

### GET /api/projects

Returns aggregated data for all projects with session statistics.

**Response Structure**:
```typescript
{
  success: true,
  projects: Project[],
  metadata: {
    totalProjects: number,
    scannedAt: string
  }
}
```

**Performance**: Parallel scanning of all projects and session files ensures <2s response time for 50 projects with 200 sessions.

### GET /api/sessions/:projectName

Returns all sessions for a specific project with summary statistics.

**Parameters**:
- `projectName` (required) - Project directory name

**Response Structure**:
```typescript
{
  success: true,
  projectName: string,
  sessions: Session[]
}
```

**Error Responses**:
- `400` - Empty/invalid project name
- `404` - Project not found

### GET /api/session-detail/:projectName/:sessionId

Returns complete message-level breakdown for a single session.

**Parameters**:
- `projectName` (required) - Project directory name
- `sessionId` (required) - Session UUID

**Response Structure**:
```typescript
{
  success: true,
  sessionDetail: SessionDetail // extends Session with messages[]
}
```

**Session Lookup**: Iterates through project JSONL files to find matching sessionId (O(n) complexity, acceptable for typical project sizes).

**Error Responses**:
- `400` - Invalid/empty parameters
- `404` - Project or session not found

### POST /api/refresh

Clears in-memory cache and triggers fresh filesystem scan.

**Response Structure**:
```typescript
{
  success: true,
  timestamp: string,
  durationMs: number,
  projectsScanned: number
}
```

**Cache Strategy**: Uses module-level variable in `scanner.ts` for simple in-memory caching. POST method chosen because operation modifies server state.

## Key Decisions

1. **Progressive Detail Pattern**: Endpoints structured as drill-down hierarchy (projects → sessions → messages) to minimize data transfer and maximize response speed.

2. **Parallel Processing**: All project scans and session file parsing use `Promise.all()` for maximum performance.

3. **Consistent Error Format**: All errors return JSON with `status`, `message`, `details`, and `timestamp` fields via centralized error handler middleware.

4. **Parameter Validation**: All endpoints validate required parameters early and return 400 Bad Request with descriptive details before filesystem operations.

5. **Optional Caching**: Scanner accepts `useCache` parameter (defaults to true) allowing existing endpoints to benefit from caching automatically while refresh endpoint forces fresh scans.

## Edge Cases & Gotchas

- **Session Not Found**: Detail endpoint returns 404 if session doesn't exist in any file within the project (could occur if session was deleted or moved).

- **Empty Project Names**: Validation catches empty strings and returns 400 instead of attempting filesystem operations.

- **Cache Staleness**: Cached data persists until server restart or manual refresh - no automatic invalidation in v1.

## Usage Example

```typescript
// Fetch all projects
const response = await fetch('http://localhost:3001/api/projects');
const { projects } = await response.json();

// Get sessions for specific project
const sessions = await fetch(`http://localhost:3001/api/sessions/${projectName}`);

// Get message detail
const detail = await fetch(
  `http://localhost:3001/api/session-detail/${projectName}/${sessionId}`
);

// Refresh cache
await fetch('http://localhost:3001/api/refresh', { method: 'POST' });
```

## Related Topics

- See [Express Configuration](../dependencies/express.md) for server setup and middleware
- See [In-Memory Caching](../patterns/in-memory-caching.md) for cache implementation details
- See [Graceful Error Handling](../patterns/graceful-error-handling.md) for error middleware
- See [Filesystem Scanner](../features/filesystem-scanner.md) for underlying scan logic
- See [Project List View](project-list-view.md) for /api/projects consumer
- See [Session List View](session-list-view.md) for /api/sessions consumer
- See [Session Detail View](session-detail-view.md) for /api/session-detail consumer
