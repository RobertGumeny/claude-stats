---
title: React 19
updated: 2026-02-12
category: Dependency
tags: [react, frontend, ui-framework]
related_articles:
  - docs/kb/infrastructure/vite-react-typescript-setup.md
---

# React 19

## Overview

React 19.0 is used as the UI framework for the Claude Code Session Analyzer. This latest major version includes performance improvements, new hooks, and better TypeScript support compared to React 18.

## Implementation

**Installation:**
```bash
npm install react@^19.0 react-dom@^19.0
```

**Entry Point (src/main.tsx):**
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**TypeScript Types:**
```json
{
  "devDependencies": {
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2"
  }
}
```

## Key Decisions

**React 19 vs 18**: Chose React 19 for improved performance, better TypeScript integration, and new concurrent features. The project doesn't rely on any deprecated APIs from React 18.

**StrictMode in Development**: Enables double-rendering in development to catch side effects early. Has no impact on production builds.

**Functional Components Only**: All components use functional components with hooks. No class components are used in this project.

## Usage Example

```tsx
// Typical functional component pattern
import { useState, useEffect } from 'react';

function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data));
  }, []);

  return <div>{/* render projects */}</div>;
}
```

## Edge Cases & Gotchas

**Breaking Changes from React 18**: React 19 may have different behavior for automatic batching and concurrent rendering. Test thoroughly if migrating from React 18.

**StrictMode Double Rendering**: In development, components render twice to detect side effects. This is expected behavior and helps catch bugs early.

**TypeScript Version**: Requires TypeScript 5.0+ for proper type inference with React 19 types.

## Related Topics

See [Vite + React + TypeScript Setup](../infrastructure/vite-react-typescript-setup.md) for build configuration.
