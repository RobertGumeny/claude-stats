---
title: Timestamp Formatting
updated: 2026-02-12
category: Patterns
tags: [utilities, formatting, dates, timestamps]
related_articles:
  - docs/kb/features/session-list-view.md
  - docs/kb/features/session-detail-view.md
---

# Timestamp Formatting

## Overview

Centralized timestamp formatting utilities provide consistent date/time display across the application. Handles both single timestamps and timestamp ranges with locale-aware formatting.

## Implementation

**File:** `src/utils/formatters.ts`

**Core Functions:**

```typescript
// Format single timestamp
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

// Format timestamp range
export function formatTimestampRange(first: string, last: string): string {
  const start = formatTimestamp(first);
  const end = new Date(last).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${start} → ${end}`;
}

// Format duration
export function formatDuration(startTime: string, endTime: string): string {
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
```

**Additional Utilities:**
- `formatCost(amount: number)`: Formats to 4 decimal places ("$X.XXXX")
- `formatNumber(num: number)`: Adds thousand separators ("125,000")
- `truncateSessionId(id: string, length = 8)`: Truncates with ellipsis

## Key Decisions

1. **Locale-Aware Formatting**: Uses `Intl.DateTimeFormat` and `toLocaleTimeString()` instead of manual string construction to respect user locale preferences.

2. **Arrow Separator**: Chose "→" Unicode arrow for timestamp ranges instead of hyphen for better visual distinction.

3. **Consistent Formats**:
   - Session List: "Jan 15, 2:30 PM → 2:45 PM"
   - Message Table: "HH:MM:SS" (24-hour for precision)
   - Duration: "Xm Ys" (human-readable)

4. **Centralized in Single File**: All formatters in one file makes it easy to maintain consistency and adjust formats globally.

## Usage Example

```tsx
// Session card timestamp range
import { formatTimestampRange } from '../utils/formatters';

<p className="text-sm text-text-tertiary">
  {formatTimestampRange(session.firstMessageTime, session.lastMessageTime)}
</p>

// Message table timestamp
const messageTime = new Date(message.timestamp).toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

// Session duration
import { formatDuration } from '../utils/formatters';

<span>{formatDuration(session.firstMessageTime, session.lastMessageTime)}</span>
```

## Edge Cases & Gotchas

- **Invalid Timestamps**: Functions don't validate input - will return "Invalid Date" if timestamp string is malformed. Consider adding try/catch in production.

- **Timezone Display**: All timestamps shown in user's local timezone. Original UTC timestamps from session files are converted automatically by `Date()`.

- **Session Duration**: Calculated from first/last message timestamps, not actual wall-clock time. May not reflect session pauses.

## Related Topics

- See [Session List View](../features/session-list-view.md) for timestamp range usage
- See [Session Detail View](../features/session-detail-view.md) for duration calculation
