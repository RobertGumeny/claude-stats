---
title: Project List View
updated: 2026-02-18
category: Features
tags: [react, ui, project-view, search, sorting, refresh]
related_articles:
  - docs/kb/features/session-list-view.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/patterns/ui-state-management.md
  - docs/kb/dependencies/react-router-dom.md
---

# Project List View

## Overview

The Project List View is the main landing page that displays all Claude Code projects with summary statistics. Provides real-time search filtering, four sorting options, and a manual refresh button in the header.

## Implementation

**Components:**
- `ProjectCard.tsx` - Individual project card with summary stats and copy button for session IDs
- `ProjectListPage.tsx` - Container with header (total cost + refresh button), search bar, sort dropdown, and grid layout
- `RefreshButton.tsx` - Presentational button with SVG refresh icon and animated spinner during loading

**Data Flow:**
1. Fetches from `/api/projects` endpoint on mount
2. Displays loading spinner during fetch (zinc-400 color)
3. Renders grid of ProjectCard components (1/2/3 columns responsive)
4. Search bar filters projects in real-time using `useMemo`
5. Sort dropdown reorders filtered results
6. Refresh button calls `POST /api/refresh` via `useRefresh` hook, then re-fetches projects

**Layout:**
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each card shows: project name, session count, total cost, last activity
- Hover states with border color transitions
- Click navigates to session list view via React Router

**Manual Refresh Flow:**
1. User clicks refresh button (or uses `Cmd/Ctrl+R` browser shortcut natively)
2. `useRefresh` calls `POST /api/refresh` → clears server-side cache, triggers re-scan
3. On success, `onSuccess` callback fires → `fetchProjects()` re-fetches updated data
4. Button is disabled while `isRefreshing` or `loading` (initial fetch) is true
5. Animated spinner SVG replaces the static refresh icon during loading

## Key Decisions

1. **`useRefresh` hook separation**: The `POST /api/refresh` call is encapsulated in `useRefresh` separately from the data re-fetch (`onSuccess` callback triggers `fetchProjects` in `App.tsx`). Keeps network concern separate from data-fetch concern.

2. **Real-time Search**: Implemented instant filtering without search button using `useMemo`.

3. **Four Sort Options**: Includes "Most Sessions" beyond the PRD's three options (Most Expensive, Most Recent, Alphabetical).

4. **Cost Formatting**: Consistently displays costs to 4 decimal places ($X.XXXX) per PRD specification.

5. **Navigation State Preserved on Refresh**: The router does not navigate away during refresh; only data is re-fetched. Users stay on their current view.

6. **Inline SVG icons**: No icon library dependency — consistent with codebase-wide preference.

## Usage Example

```tsx
// useRefresh hook
const { refresh, isRefreshing } = useRefresh({
  onSuccess: () => fetchProjects(),
});

// RefreshButton in header
<RefreshButton
  onClick={refresh}
  isLoading={isRefreshing || loading}
/>
```

## Edge Cases & Gotchas

- **Empty Search Results**: Shows "No projects found matching..." when search returns no results.
- **No Projects**: Shows "No Claude Code projects detected" with folder icon when projects array is empty.
- **Refresh + initial load**: `isLoading` (passed to `RefreshButton`) combines both `loading` (initial fetch) and `isRefreshing` to prevent double-clicking during either state.
- **`Cmd/Ctrl+R` works natively**: No custom keyboard handler — the browser's reload shortcut re-runs the page, which re-fetches data naturally.

## Related Topics

- See [Session List View](session-list-view.md) for drill-down detail
- See [REST API Endpoints](api-endpoints.md) for /api/projects and /api/refresh structure
- See [UI State Management](../patterns/ui-state-management.md) for loading/error patterns
- See [React Router](../dependencies/react-router-dom.md) for navigation implementation
