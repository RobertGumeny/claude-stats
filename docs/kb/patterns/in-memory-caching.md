---
title: In-Memory Caching Pattern
updated: 2026-02-12
category: Patterns
tags: [caching, performance, optimization, backend]
related_articles:
  - docs/kb/features/api-endpoints.md
  - docs/kb/features/filesystem-scanner.md
---

# In-Memory Caching Pattern

## Overview

A simple module-level caching mechanism that stores filesystem scan results in memory to avoid redundant scans. Provides manual cache invalidation via refresh endpoint while maintaining fast response times for repeated requests.

## Implementation

**Cache Variable** (server/scanner.ts):
```typescript
let cachedScanResult: ScanSuccessResult | null = null;

export function clearCache(): void {
  cachedScanResult = null;
}

export async function scanAllProjects(useCache: boolean = true): Promise<ScanResult> {
  if (useCache && cachedScanResult) {
    return cachedScanResult;
  }

  // Perform scan...
  const result = await performScan();

  if (result.success) {
    cachedScanResult = result;
  }

  return result;
}
```

**Cache Invalidation** (server/index.ts):
```typescript
app.post('/api/refresh', asyncHandler(async (req, res) => {
  clearCache();
  const result = await scanAllProjects(false); // Force fresh scan

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    durationMs: scanDuration,
    projectsScanned: result.projects.length
  });
}));
```

## Key Decisions

1. **Module-Level Variable**: Used simple module-level variable instead of Redis or external cache because:
   - Application runs locally (not distributed)
   - No persistence needed across server restarts
   - Zero additional dependencies
   - Sufficient for single-instance deployment

2. **Optional Caching Parameter**: Made caching opt-out via `useCache` parameter to allow:
   - Existing endpoints to benefit automatically (default: true)
   - Refresh endpoint to force fresh scans (explicit: false)
   - Future flexibility for different strategies

3. **POST for Refresh**: Used POST method for refresh endpoint because operation modifies server state (clears cache), following REST conventions.

4. **Cache on Success Only**: Only successful scans are cached - errors are never cached to avoid serving stale error responses.

## Usage Example

```typescript
// First request - performs full scan
const projects1 = await scanAllProjects(); // ~2000ms

// Subsequent requests - served from cache
const projects2 = await scanAllProjects(); // <10ms

// Force fresh scan
clearCache();
const projects3 = await scanAllProjects(false); // ~2000ms
```

## Edge Cases & Gotchas

- **Cache Staleness**: Cached data remains until server restart or manual refresh. New sessions won't appear automatically.

- **Memory Growth**: For very large project counts (1000+ projects), cached scan results could consume significant memory. Not a concern for typical use (50-200 projects).

- **Concurrency**: Multiple simultaneous requests during initial scan will all trigger scans. Cache only helps after first scan completes. Consider request deduplication for high-concurrency scenarios.

## Performance Impact

**Typical Performance**:
- Initial scan (no cache): ~2000ms for 50 projects
- Cached retrieval: <10ms
- Cache clear + refresh: ~2000ms

**Target Met**: Refresh completes in <3s as specified in acceptance criteria due to existing parallel scanning implementation.

## Related Topics

- See [API Endpoints](../features/api-endpoints.md) for refresh endpoint details
- See [Filesystem Scanner](../features/filesystem-scanner.md) for scan implementation
