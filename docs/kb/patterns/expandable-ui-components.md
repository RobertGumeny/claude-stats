---
title: Expandable UI Components
updated: 2026-02-12
category: Patterns
tags: [react, ui-patterns, state-management, expandable-rows]
related_articles:
  - docs/kb/features/session-detail-view.md
  - docs/kb/dependencies/react-19.md
---

# Expandable UI Components

## Overview

Pattern for creating expandable/collapsible UI elements (like table rows) using React state. Allows users to toggle visibility of detailed content without navigation or modals.

## Implementation

**Core Pattern:**

```tsx
import { useState } from 'react';

function MessageTable({ messages }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <table>
      {messages.map((msg, idx) => (
        <>
          <tr onClick={() => toggleRow(idx)} className="cursor-pointer">
            {/* Summary row content */}
          </tr>
          {expandedRows.has(idx) && (
            <tr>
              <td colSpan={5}>
                {/* Expanded detail content */}
              </td>
            </tr>
          )}
        </>
      ))}
    </table>
  );
}
```

## Key Decisions

1. **Set for State**: Uses `Set<number>` instead of `number[]` for O(1) lookups and automatic uniqueness. More efficient when checking if row is expanded.

2. **Index-Based Keys**: Uses array index as row identifier since message order is stable (read-only data from API).

3. **Inline Expansion**: Renders expanded content directly below the row rather than using modals or sidebars. Allows comparing multiple expanded rows simultaneously.

4. **Click Whole Row**: Entire row is clickable (not just an icon) for better UX. Cursor changes to pointer on hover.

5. **Conditional Rendering**: Uses `{condition && <Component />}` pattern for clean show/hide without CSS display:none.

## Usage Example

```tsx
// Session Detail message table
const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

<tr
  onClick={() => toggleRow(idx)}
  className="cursor-pointer hover:bg-background-tertiary transition-colors"
>
  <td>{formatTime(message.timestamp)}</td>
  <td>{message.role}</td>
  {/* ... other columns */}
</tr>

{expandedRows.has(idx) && (
  <tr className="bg-background-tertiary">
    <td colSpan={5} className="p-4">
      <pre className="text-xs overflow-x-auto">
        {JSON.stringify(message.content, null, 2)}
      </pre>
    </td>
  </tr>
)}
```

## Edge Cases & Gotchas

- **Performance**: Expanding many rows (50+) at once can impact render performance. Consider limiting max expanded rows or adding virtualization for large tables.

- **State Reset**: Expanded state resets on navigation away and back. For persistent expansion, consider using URL query parameters.

- **Nested Arrays**: If messages array is re-sorted, index-based keys may cause incorrect rows to be expanded. Use stable IDs (message.id) if sorting is dynamic.

- **Mobile UX**: Clickable rows work well on mobile, but ensure touch targets are large enough (minimum 44px height).

## Related Topics

- See [Session Detail View](../features/session-detail-view.md) for production usage
- See [React 19](../dependencies/react-19.md) for useState hook
