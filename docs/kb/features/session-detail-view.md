---
title: Session Detail View
updated: 2026-02-18
category: Features
tags: [react, ui, session-detail, messages, expandable-rows, filters, virtualization, token-visualization]
related_articles:
  - docs/kb/features/session-list-view.md
  - docs/kb/patterns/expandable-ui-components.md
  - docs/kb/patterns/copy-to-clipboard.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/features/cost-calculator.md
  - docs/kb/dependencies/react-window.md
---

# Session Detail View

## Overview

The Session Detail View provides message-level analysis of a Claude Code session. Includes summary statistics card, filter controls, and an expandable message table with token visualization and copy-to-clipboard actions.

## Implementation

**Components:**
- `SummaryCard.tsx` - Session-level statistics display (memoized calculations)
- `MessageTable.tsx` - Filterable, expandable, optionally virtualized message table
- `SessionDetail.tsx` - Container integrating both components with filter state
- `TokenBar.tsx` - Inline stacked bar chart for token type distribution

**Data Flow:**
1. Fetches from `/api/session-detail/:projectName/:sessionId`
2. SummaryCard displays aggregated metrics
3. Filter bar controls narrow visible messages (Main Thread / Sidechain toggle + User / Assistant checkboxes)
4. `applyFilters` pure function computes `filteredMessages` via `useMemo`
5. MessageTable receives filtered subset and renders with optional virtualization
6. Click row to toggle JSON content display; copy buttons on IDs and content

**Summary Card Metrics:**
- Total cost (green accent), memoized via `useMemo`
- Message counts (main/sidechain breakdown)
- Token statistics (input/output with K notation), memoized
- Cache hit rate (calculated as cache_read / cache_write), memoized
- Session duration (formatted as "Xm Ys"), memoized

**Message Table Columns:**
- Timestamp (HH:MM:SS format)
- Role (user/assistant) with copy button for Message ID
- Type badge (Main/Sidechain with color coding)
- Total tokens per message + `TokenBar` inline visualization
- Individual message cost
- Copy button for full message content (in expanded rows)

**Filter Controls:**
- Thread filter: All / Main Thread / Sidechain (mutually exclusive radio-style buttons)
- Role filter: Show User / Show Assistant (independent checkboxes)
- Footer shows "Showing X of Y messages" when filters are active

**Token Visualization (`TokenBar`):**
- Stacked horizontal bar, CSS-only (inline `width: %` on Tailwind divs)
- Segments: Input (blue) → Cache Write (purple) → Cache Read (green) → Output (amber)
- Hover tooltip shows exact counts per type and total
- Returns `null` for zero-token messages (user messages typically have no `usage`)

**Virtualization:**
- Sessions with ≥200 messages render with `react-window` v2 `List` component
- Threshold constant: `VIRTUALIZATION_THRESHOLD = 200`
- Below threshold: standard `<table>` layout (full backward compatibility)
- Above threshold: flexbox div-based rows matching header column widths; footer shows "(virtualized)" badge

## Key Decisions

1. **`applyFilters` as exported pure function**: Extracted from the component for unit testability without a DOM renderer. Accepts messages + filter state, returns filtered array.

2. **Filter state in `SessionDetail`**: Lives for the lifetime of the component (within-session navigation). Not persisted to URL.

3. **`useMemo` throughout**: `filteredMessages` (filter application), `calculateCacheHitRate`, `calculateDuration`, `calculateTokenStats`, and `computeTotalTokens` are all memoized to prevent redundant recalculation on unrelated renders.

4. **`useCallback` on `toggleRow`**: Stabilizes handler reference passed to `React.memo`-wrapped `MessageRow`.

5. **`React.memo` on `MessageRow`**: Prevents re-renders when sibling rows expand/collapse or filter state changes.

6. **Cache Hit Rate Calculation**: `cache_read / cache_write` with edge case handling:
   - "N/A" when both are zero
   - "∞" when only reads exist (no writes)
   - "Xx" format for normal cases (e.g., "18.5x")

7. **Inline Expansion**: Chosen over modals to allow comparing multiple messages simultaneously.

8. **`buildSegments` pure export on TokenBar**: Same testability rationale as `applyFilters` — pure logic tested independently of rendering.

9. **react-window div layout**: react-window renders outside `<table>` DOM context, so virtualized rows use flexbox divs. The `VirtualRow` function is not wrapped in `memo()` because `memo()` changes the inferred return type incompatible with react-window v2's `rowComponent` contract.

## Usage Example

```tsx
// applyFilters pure function (exported from SessionDetail)
export function applyFilters(
  messages: Message[],
  threadFilter: 'all' | 'main' | 'sidechain',
  showUser: boolean,
  showAssistant: boolean
): Message[] {
  return messages.filter(msg => {
    const threadOk = threadFilter === 'all'
      || (threadFilter === 'main' && !msg.isSidechain)
      || (threadFilter === 'sidechain' && msg.isSidechain);
    const roleOk = (msg.role === 'user' && showUser)
      || (msg.role === 'assistant' && showAssistant);
    return threadOk && roleOk;
  });
}

// TokenBar segment building (exported from TokenBar)
export function buildSegments(usage: Usage): Segment[] {
  const total = usage.input_tokens + usage.cache_creation_input_tokens
    + usage.cache_read_input_tokens + usage.output_tokens;
  return [
    { label: 'Input', count: usage.input_tokens, pct: (usage.input_tokens / total) * 100, color: 'bg-blue-500' },
    // ... cache write (purple), cache read (green), output (amber)
  ];
}
```

## Edge Cases & Gotchas

- **Session Not Found**: Returns 404 if session doesn't exist in project.
- **Duration Calculation**: Computed as difference between first and last message timestamps (may not reflect wall-clock time if session was paused).
- **Virtualized rows not `memo`-wrapped**: See Key Decision #9 above — react-window v2 type constraints prevent it.
- **`useDynamicRowHeight` reset**: The height cache must be keyed on `expandedRows.size` so it resets when rows expand/collapse in virtualized mode.
- **Copy buttons and event propagation**: `CopyButton` calls `e.stopPropagation()` to prevent triggering row expansion on click.

## Related Topics

- See [Session List View](session-list-view.md) for parent navigation level
- See [Expandable UI Components](../patterns/expandable-ui-components.md) for row expansion pattern
- See [Copy to Clipboard](../patterns/copy-to-clipboard.md) for copy button implementation
- See [react-window](../dependencies/react-window.md) for virtualization library details
- See [REST API Endpoints](api-endpoints.md) for /api/session-detail structure
- See [Cost Calculator](cost-calculator.md) for per-message cost calculation
