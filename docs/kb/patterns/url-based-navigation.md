---
title: URL-Based Navigation
updated: 2026-02-12
category: Patterns
tags: [react-router, navigation, breadcrumbs, spa]
related_articles:
  - docs/kb/dependencies/react-router-dom.md
  - docs/kb/features/project-list-view.md
  - docs/kb/features/session-list-view.md
---

# URL-Based Navigation

## Overview

Pattern for implementing hierarchical navigation using URL paths and React Router. Provides browser back/forward support, bookmarkable URLs, and breadcrumb navigation across drill-down views.

## Implementation

**Route Hierarchy:**
```
/ (Projects)
  └─ /project/:name (Sessions)
       └─ /session/:projectName/:sessionId (Detail)
```

**Navigation Components:**

```tsx
// Programmatic navigation (click handlers)
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate(`/project/${encodeURIComponent(projectName)}`);

// Declarative navigation (links)
import { Link } from 'react-router-dom';

<Link to="/">Projects</Link>
<Link to={`/project/${encodeURIComponent(name)}`}>{name}</Link>

// Parameter extraction
import { useParams } from 'react-router-dom';

const { name } = useParams<{ name: string }>();
const projectName = decodeURIComponent(name || '');
```

**Breadcrumb Component:**

```tsx
interface BreadcrumbItem {
  label: string;
  path?: string;  // Omit for current page
}

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav>
      {items.map((item, idx) => (
        <span key={idx}>
          {item.path ? (
            <Link to={item.path}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
          {idx < items.length - 1 && ' / '}
        </span>
      ))}
    </nav>
  );
}
```

## Key Decisions

1. **URL Encoding Strategy**: Always encode project names and session IDs in URLs, decode when reading from `useParams`. Handles spaces and special characters safely.

2. **Breadcrumb Data Structure**: Array of `{label, path?}` objects where current page omits `path` field and renders as plain text.

3. **Separator Character**: Uses ` / ` (slash with spaces) as breadcrumb separator for clean visual hierarchy.

4. **Navigation Methods**:
   - `useNavigate()` for programmatic navigation (button clicks)
   - `<Link>` for declarative navigation (breadcrumbs, text links)
   - Never mix manual history manipulation with Router

5. **Page Wrapper Pattern**: Each route renders a page wrapper component that extracts URL params and fetches required data, keeping route definitions clean.

## Usage Example

```tsx
// Project List → Session List
function ProjectCard({ project }: Props) {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate(`/project/${encodeURIComponent(project.name)}`)}>
      {project.name}
    </div>
  );
}

// Breadcrumb in Session List
<Breadcrumb
  items={[
    { label: 'Projects', path: '/' },
    { label: projectName }  // Current page
  ]}
/>

// Breadcrumb in Session Detail
<Breadcrumb
  items={[
    { label: 'Projects', path: '/' },
    { label: projectName, path: `/project/${encodeURIComponent(projectName)}` },
    { label: truncateSessionId(sessionId) }  // Current page
  ]}
/>
```

## Edge Cases & Gotchas

- **Special Characters**: Forgetting to encode/decode URLs will break navigation for projects with spaces or special chars.

- **Direct URL Access**: Users can bookmark or manually type URLs, so pages must be self-contained and fetch their own data (can't rely on navigation state).

- **Scroll Restoration**: React Router preserves scroll position by default on back/forward. Reset to top manually if needed with `window.scrollTo(0, 0)`.

- **Filter State**: Search/sort state resets on navigation. Use URL query parameters (e.g., `?sort=recent`) to preserve filter state across navigation.

## Related Topics

- See [React Router DOM](../dependencies/react-router-dom.md) for routing library setup
- See [Project List View](../features/project-list-view.md) for root route
- See [Session List View](../features/session-list-view.md) for breadcrumb usage
