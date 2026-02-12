---
title: UI State Management
updated: 2026-02-12
category: Patterns
tags: [react, state, loading, error-handling, empty-states]
related_articles:
  - docs/kb/features/project-list-view.md
  - docs/kb/features/session-list-view.md
  - docs/kb/patterns/graceful-error-handling.md
---

# UI State Management

## Overview

Consistent pattern for handling loading, error, and empty states across all views. Provides friendly user feedback during async operations with dark theme styling.

## Implementation

**State Types:**
1. **Loading**: Async operation in progress (API fetch, file scan)
2. **Error**: Operation failed with friendly error message
3. **Empty**: Operation succeeded but returned no data
4. **Success**: Operation succeeded with data to display

**Component Pattern:**

```tsx
function ViewComponent() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

## Key Decisions

1. **Spinner Color**: Uses `zinc-400` (not blue) per PRD specification for subtle, theme-consistent loading indicators.

2. **Error Message Format**:
   - Heading: "Failed to load [resource]"
   - Primary message: "Failed to load [resource]. Try refreshing the page."
   - Helper text: "Make sure the API server is running on port 3001."

3. **Empty State Icons**: Uses inline SVG icons (folder, document) instead of icon library to avoid additional dependencies.

4. **Visual Consistency**: All states use same background (`background-secondary`), border (`border-primary`), and text (`text-tertiary`) colors.

5. **Error Boundary**: No global error boundary in v1. Each component handles its own errors for granular recovery.

## Usage Example

```tsx
// Loading spinner (centered, zinc-400)
{loading && (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400" />
  </div>
)}

// Error state with friendly message
{error && (
  <div className="p-8 text-center rounded-lg border border-border-primary bg-background-secondary">
    <h3 className="text-lg font-semibold text-text-secondary mb-2">
      Failed to load projects
    </h3>
    <p className="text-text-tertiary mb-4">
      Failed to load projects. Try refreshing the page.
    </p>
    <p className="text-sm text-text-tertiary">
      Make sure the API server is running on port 3001.
    </p>
  </div>
)}

// Empty state with icon
{data.length === 0 && (
  <div className="p-8 text-center">
    <FolderIcon className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
    <p className="text-text-tertiary">No projects found</p>
  </div>
)}
```

## Edge Cases & Gotchas

- **Race Conditions**: Multiple rapid API calls can result in stale data. Use cleanup functions in `useEffect` or track request IDs.

- **Empty vs Error**: Distinguish between "no data found" (empty state) and "API failed" (error state). Return 200 with empty array for no data.

- **Loading Flicker**: Don't show spinner for very fast responses (<200ms). Consider adding delay before showing loading state.

- **Retry Logic**: Error states should provide clear action (refresh page). Future enhancement: add retry button that re-triggers fetch.

## Related Topics

- See [Project List View](../features/project-list-view.md) for production usage
- See [Session List View](../features/session-list-view.md) for loading/empty/error examples
- See [Graceful Error Handling](graceful-error-handling.md) for backend error patterns
