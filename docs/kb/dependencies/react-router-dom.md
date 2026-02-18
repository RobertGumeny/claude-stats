---
title: React Router DOM v7
updated: 2026-02-12
category: Dependency
tags: [react-router, routing, navigation, spa]
related_articles:
  - docs/kb/patterns/url-based-navigation.md
  - docs/kb/dependencies/react-19.md
  - docs/kb/features/project-list-view.md
---

# React Router DOM v7

## Overview

React Router DOM v7.13.0 provides client-side routing for the single-page application. Enables URL-based navigation with browser back/forward support and direct URL access without full page reloads.

## Implementation

**Installation:**
```bash
npm install react-router-dom@^7.13.0
```

**Route Structure:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<ProjectListPage />} />
    <Route path="/project/:name" element={<SessionListPage />} />
    <Route path="/session/:projectName/:sessionId" element={<SessionDetailPage />} />
  </Routes>
</BrowserRouter>
```

**Navigation Patterns:**
- `useNavigate()` for programmatic navigation (click handlers)
- `<Link>` for declarative navigation (breadcrumbs)
- `useParams()` to extract URL parameters

## Key Decisions

1. **BrowserRouter over HashRouter**: Chose BrowserRouter for clean URLs without `#` hash. Modern browsers support HTML5 History API, and Vite dev server handles client-side routing automatically.

2. **URL Parameter Encoding**: All project names and session IDs are encoded with `encodeURIComponent()` and decoded with `decodeURIComponent()` to handle spaces and special characters.

3. **Route Parameter Names**: Used descriptive names (`:projectName`, `:sessionId`) instead of generic names (`:id`) for better code readability.

4. **Page Wrapper Pattern**: Created wrapper components (ProjectListPage, SessionListPage, SessionDetailPage) to keep route definitions clean and handle parameter extraction with `useParams`.

5. **No Route Guards**: v1 relies on API validation for invalid project/session requests. Routes are public and don't require authentication.

## Usage Example

```tsx
// Programmatic navigation
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${encodeURIComponent(project.name)}`);
  };

  return <div onClick={handleClick}>...</div>;
}

// Extract URL parameters
import { useParams } from 'react-router-dom';

function SessionListPage() {
  const { name } = useParams<{ name: string }>();
  const projectName = decodeURIComponent(name || '');
  // ...
}

// Declarative navigation
import { Link } from 'react-router-dom';

<Link to="/">Projects</Link>
<Link to={`/project/${encodeURIComponent(projectName)}`}>
  {projectName}
</Link>
```

## Edge Cases & Gotchas

- **Special Characters**: Project names with spaces, slashes, or Unicode must be encoded/decoded properly or navigation will fail.

- **Direct URL Access**: Users can bookmark or manually type URLs. Pages must fetch their own data rather than relying on navigation state.

- **Browser Back/Forward**: React Router preserves scroll position by default. Filter state resets on navigation (can be enhanced with URL query params in future).

- **404 Handling**: No catch-all route in v1. Invalid project/session URLs return API 404 errors rather than client-side 404 page.

## Related Topics

- See [URL-Based Navigation](../patterns/url-based-navigation.md) for navigation patterns and breadcrumb implementation
- See [React 19](react-19.md) for UI framework integration
- See [Project List View](../features/project-list-view.md) for root route implementation
