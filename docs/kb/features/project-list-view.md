---
title: Project List View
updated: 2026-02-12
category: Features
tags: [react, ui, project-view, search, sorting]
related_articles:
  - docs/kb/features/session-list-view.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/patterns/ui-state-management.md
  - docs/kb/dependencies/react-router-dom.md
---

# Project List View

## Overview

The Project List View is the main landing page that displays all Claude Code projects with summary statistics. Provides real-time search filtering and four sorting options to help users quickly find projects of interest.

## Implementation

**Components:**
- `ProjectCard.tsx` - Individual project card with summary stats
- `ProjectList.tsx` - Container with search bar, sort dropdown, and grid layout

**Data Flow:**
1. Fetches from `/api/projects` endpoint on mount
2. Displays loading spinner during fetch (zinc-400 color)
3. Renders grid of ProjectCard components (1/2/3 columns responsive)
4. Search bar filters projects in real-time using `useMemo`
5. Sort dropdown reorders filtered results

**Layout:**
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each card shows: project name, session count, total cost, last activity
- Hover states with border color transitions
- Click navigates to session list view via React Router

## Key Decisions

1. **Real-time Search**: Implemented instant filtering without search button for better UX. Uses `useMemo` to avoid unnecessary re-filtering.

2. **Four Sort Options**: Added "Most Sessions" beyond the PRD's three options (Most Expensive, Most Recent, Alphabetical) based on common user workflows.

3. **Cost Formatting**: Consistently displays costs to 4 decimal places ($X.XXXX) per PRD specification.

4. **Date Formatting**: Uses `toLocaleDateString()` for last activity timestamps to respect user locale.

5. **Navigation**: Integrated with React Router for declarative navigation to `/project/:name` route.

## Usage Example

```tsx
// App.tsx integration
function ProjectListPage({ projects, loading, error }: Props) {
  return loading ? (
    <LoadingSpinner />
  ) : error ? (
    <ErrorState message={error} />
  ) : (
    <ProjectList projects={projects} />
  );
}
```

## Edge Cases & Gotchas

- **Empty Search Results**: Shows "No projects found matching..." when search returns no results
- **No Projects**: Shows "No Claude Code projects detected" with folder icon when projects array is empty
- **Cost Precision**: Always formats to 4 decimals even for whole dollar amounts (e.g., "$1.0000" not "$1")

## Related Topics

- See [Session List View](session-list-view.md) for drill-down detail
- See [REST API Endpoints](api-endpoints.md) for /api/projects structure
- See [UI State Management](../patterns/ui-state-management.md) for loading/error patterns
- See [React Router](../dependencies/react-router-dom.md) for navigation implementation
