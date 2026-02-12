---
title: Session List View
updated: 2026-02-12
category: Features
tags: [react, ui, session-view, sorting, sidechain]
related_articles:
  - docs/kb/features/project-list-view.md
  - docs/kb/features/session-detail-view.md
  - docs/kb/patterns/timestamp-formatting.md
  - docs/kb/features/api-endpoints.md
---

# Session List View

## Overview

The Session List View displays all sessions for a selected project with sorting options and color-coded sidechain percentage badges. Provides breadcrumb navigation and drill-down to message-level detail.

## Implementation

**Components:**
- `SessionCard.tsx` - Individual session card with metadata
- `SessionList.tsx` - Container with breadcrumbs, sort dropdown, and session grid

**Data Flow:**
1. Fetches from `/api/sessions/:projectName` using React Router's `useParams`
2. Displays loading spinner during fetch
3. Renders list of SessionCard components
4. Sort dropdown reorders sessions (Most Recent, Most Expensive, Longest)
5. Click navigates to `/session/:projectName/:sessionId`

**Session Card Display:**
- Session filename and truncated ID (8 chars + ellipsis)
- Timestamp range: "Jan 15, 2:30 PM → 2:45 PM"
- Message count and total tokens
- Cost with 4 decimal precision
- Sidechain percentage badge with color coding

## Key Decisions

1. **Sidechain Badge Colors**: Three-tier system for quick visual scanning:
   - Red (>70%): High sidechain usage warning
   - Amber (>40%): Moderate sidechain usage
   - Gray (≤40%): Normal usage

2. **Default Sort**: "Most Recent" shows latest sessions first, aligning with common workflow of checking recent activity.

3. **Timestamp Format**: Uses locale-aware `Intl.DateTimeFormat` for consistent "MMM DD, HH:MM AM/PM" formatting across different locales.

4. **Session ID Truncation**: Displays 8 characters with ellipsis to maintain card layout while showing enough for identification.

5. **REST API Pattern**: Uses `/api/sessions/:projectName` with project name as URL parameter for clean, debuggable URLs.

## Usage Example

```tsx
// Breadcrumb navigation
<Breadcrumb
  items={[
    { label: 'Projects', path: '/' },
    { label: projectName }  // Current page (no path)
  ]}
/>

// Sidechain badge logic
const getBadgeColor = (percentage: number) => {
  if (percentage > 70) return 'bg-red-500';
  if (percentage > 40) return 'bg-amber-500';
  return 'bg-zinc-500';
};
```

## Edge Cases & Gotchas

- **No Sessions**: Shows "No sessions found" with document icon when project has zero sessions
- **URL Encoding**: Project names with spaces/special chars are properly encoded/decoded via `encodeURIComponent`
- **API 404**: Handles case where project doesn't exist with friendly error message

## Related Topics

- See [Project List View](project-list-view.md) for parent navigation level
- See [Session Detail View](session-detail-view.md) for drill-down detail
- See [Timestamp Formatting](../patterns/timestamp-formatting.md) for date/time utilities
- See [REST API Endpoints](api-endpoints.md) for /api/sessions structure
