---
title: Session Detail View
updated: 2026-02-12
category: Features
tags: [react, ui, session-detail, messages, expandable-rows]
related_articles:
  - docs/kb/features/session-list-view.md
  - docs/kb/patterns/expandable-ui-components.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/features/cost-calculator.md
---

# Session Detail View

## Overview

The Session Detail View provides message-level analysis of a Claude Code session. Includes summary statistics card and expandable message table for deep inspection of agent conversations and costs.

## Implementation

**Components:**
- `SummaryCard.tsx` - Session-level statistics display
- `MessageTable.tsx` - Table with expandable rows for message content
- `SessionDetail.tsx` - Container integrating both components

**Data Flow:**
1. Fetches from `/api/session-detail/:projectName/:sessionId`
2. SummaryCard displays aggregated metrics
3. MessageTable renders all messages with expand/collapse
4. Click row to toggle JSON content display

**Summary Card Metrics:**
- Total cost (green accent)
- Message counts (main/sidechain breakdown)
- Token statistics (input/output with K notation)
- Cache hit rate (calculated as cache_read / cache_write)
- Session duration (formatted as "Xm Ys")

**Message Table Columns:**
- Timestamp (HH:MM:SS format)
- Role (user/assistant)
- Type badge (Main/Sidechain with color coding)
- Total tokens per message
- Individual message cost

## Key Decisions

1. **Cache Hit Rate Calculation**: Implemented as `cache_read / cache_write` with edge case handling:
   - "N/A" when both are zero
   - "∞" when only reads exist (no writes)
   - "Xx" format for normal cases (e.g., "18.5x")

2. **K Notation for Tokens**: Displays large token counts as "125K in, 8.2K out" to keep UI compact while maintaining readability.

3. **Inline Expansion**: Chose inline row expansion over modals to allow comparing multiple messages simultaneously and maintain context.

4. **No Virtualization**: Renders all messages without virtualization in v1. Acceptable performance for sessions under 200 messages (PRD requirement: 100 messages in <800ms).

5. **JSON Display**: Shows full message content as formatted JSON rather than parsing/prettifying, since session logs contain varied structures (text, tool calls, etc.).

6. **Time Formats**: Uses HH:MM:SS (24-hour) for precision in table, but human-readable "Xm Ys" for session duration.

## Usage Example

```tsx
// Cache hit rate calculation
const cacheHitRate = useMemo(() => {
  const { cache_read_tokens, cache_write_tokens } = session;

  if (cache_read_tokens === 0 && cache_write_tokens === 0) {
    return 'N/A';
  }
  if (cache_write_tokens === 0) {
    return '∞';
  }
  return `${(cache_read_tokens / cache_write_tokens).toFixed(1)}x`;
}, [session]);

// Expandable row state
const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
```

## Edge Cases & Gotchas

- **Session Not Found**: Returns 404 if session doesn't exist in project (could occur if session was deleted)
- **Large Sessions**: Performance may degrade with 500+ messages. Consider virtualization if this becomes common.
- **Duration Calculation**: Computed as difference between first and last message timestamps (may not reflect actual wall-clock time if session was paused)

## Related Topics

- See [Session List View](session-list-view.md) for parent navigation level
- See [Expandable UI Components](../patterns/expandable-ui-components.md) for row expansion pattern
- See [REST API Endpoints](api-endpoints.md) for /api/session-detail structure
- See [Cost Calculator](cost-calculator.md) for per-message cost calculation
