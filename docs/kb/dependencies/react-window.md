---
title: react-window
updated: 2026-02-18
category: Dependency
tags: [react, performance, virtualization, large-lists]
related_articles:
  - docs/kb/features/session-detail-view.md
  - docs/kb/patterns/expandable-ui-components.md
---

# react-window

## Overview

`react-window` v2 is a windowing library that renders only the visible portion of large lists, dramatically reducing DOM node count. Used in the message table for sessions with ≥200 messages.

**Package:** `react-window@^2.2.7` + `@types/react-window`

## Implementation

**Threshold:** `VIRTUALIZATION_THRESHOLD = 200` (matches PRD performance requirement)

**v2 API** (distinct from the more-documented v1):
- `List` component accepts `rowComponent`, `rowProps`, and `rowHeight`
- `useDynamicRowHeight` hook for dynamic/expandable rows — provides height cache that must be reset when row content changes
- No `VariableSizeList` (that's v1)

**Key setup in `MessageTable.tsx`:**

```tsx
import { List, useDynamicRowHeight } from 'react-window';

const { rowHeight, resetRowHeight } = useDynamicRowHeight({
  // Reset cache whenever expanded rows change (row heights change on expand)
  key: expandedRows.size,
});

{messages.length >= VIRTUALIZATION_THRESHOLD ? (
  <div className="virtualized-wrapper">
    <VirtualHeader />  {/* sticky column headers */}
    <List
      height={600}
      itemCount={messages.length}
      rowHeight={rowHeight}
      rowComponent={VirtualRow}
      rowProps={{ messages, expandedRows, toggleRow }}
    />
  </div>
) : (
  <table>/* standard table */</table>
)}
```

**Layout difference**: react-window renders outside a `<table>` DOM context (it uses `<div>` containers internally). Virtualized rows use flexbox divs with fixed column widths matching the header — not `<tr>`/`<td>` elements.

## Key Decisions

1. **Threshold at 200**: Below threshold, the standard `<table>` layout is used unchanged. This preserves perfect backward compatibility and avoids virtualization overhead for typical sessions.

2. **`useDynamicRowHeight` keyed on `expandedRows.size`**: When rows expand/collapse, their pixel height changes. Keying the hook on `expandedRows.size` tells react-window to discard its height cache and remeasure.

3. **`VirtualRow` not wrapped in `memo()`**: react-window v2's `rowComponent` type expects `ReactElement | null`. `React.memo()` changes the inferred return type to `ReactNode`, which is incompatible. Virtualization itself limits rendered DOM nodes, so memo provides minimal additional benefit here.

4. **Div-based columns**: Column widths are fixed pixel values matching the `<thead>` of the non-virtualized table. Alignment must be maintained manually if columns change.

## Edge Cases & Gotchas

- **v1 vs v2 API difference**: Most online documentation and examples are for v1 (`VariableSizeList`). The v2 API is `List` with `rowComponent`/`useDynamicRowHeight`. Don't confuse them.
- **Height cache invalidation**: If `expandedRows.size` doesn't change (e.g., one row closes and another opens in the same render), the cache won't reset. Key on the full Set or a derived value if needed.
- **Footer badge**: The `(virtualized)` text badge in the table footer signals to users that not all rows are in the DOM simultaneously.

## Related Topics

- See [Session Detail View](../features/session-detail-view.md) for the integration context
- See [Expandable UI Components](../patterns/expandable-ui-components.md) for the row expansion pattern that interacts with virtualization
