---
title: Express.js API Server
updated: 2026-02-12
category: Dependency
tags: [express, nodejs, api, backend]
related_articles:
  - docs/kb/features/filesystem-scanner.md
  - docs/kb/features/api-endpoints.md
  - docs/kb/patterns/graceful-error-handling.md
  - docs/kb/infrastructure/backend-typescript-configuration.md
---

# Express.js API Server

## Overview

Express 5.2.1 provides the backend API server for the Claude Code Session Analyzer. The TypeScript-based server exposes REST endpoints for project scanning and session data retrieval, with comprehensive error handling middleware and structured logging. Runs on port 3001 during development.

## Implementation

**Installation:**
```bash
npm install express@^5.2.1 cors@^2.8.6
```

**Server Setup (server/index.ts):**
```typescript
import express from 'express';
import cors from 'cors';
import { scanAllProjects, getProjectSessions, getSessionDetail } from './scanner.js';
import { errorHandler, asyncHandler, validationError } from './errorHandler.js';
import { Logger } from './errorHandler.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Allow frontend on port 5173
app.use(express.json());

// Routes with error handling
app.get('/api/projects', asyncHandler(async (req, res) => {
  Logger.info('Fetching all projects');
  const result = await scanAllProjects();

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    projects: result.projects,
    metadata: {
      totalProjects: result.projects.length,
      scannedAt: new Date().toISOString()
    }
  });
}));

app.get('/api/sessions/:projectName', asyncHandler(async (req, res) => {
  const { projectName } = req.params;

  if (!projectName?.trim()) {
    throw validationError('Project name is required', { param: 'projectName' });
  }

  const result = await getProjectSessions(projectName);

  if (!result.success) {
    throw notFoundError('Project', projectName);
  }

  res.json(result);
}));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  Logger.info(`API server running on http://localhost:${PORT}`);
  Logger.info('Available endpoints:');
  Logger.info('  GET /api/projects');
  Logger.info('  GET /api/sessions/:projectName');
  Logger.info('  GET /api/session-detail/:projectName/:sessionId');
  Logger.info('  POST /api/refresh');
});
```

## Key Decisions

**Express 5 vs 4**: Chose Express 5 for improved async/await support and better error handling. Express 5 is production-ready as of 2024.

**CORS Enabled**: The `cors` middleware allows requests from the Vite dev server on port 5173. Required for local development.

**Port 3001**: Uses port 3001 to avoid conflicts with Vite (5173) and other common dev servers (3000).

**ES Modules**: Server code uses `import`/`export` syntax (requires `"type": "module"` in package.json).

**TypeScript Conversion**: Server migrated to TypeScript with separate `tsconfig.server.json` configuration for backend-specific settings.

**Error Handling Middleware**: Centralized error handler provides consistent API error responses with status codes, messages, and timestamps.

**Async Handler Wrapper**: `asyncHandler` utility automatically catches promise rejections in route handlers and passes them to error middleware.

## Usage Example

**Adding New Endpoint:**
```typescript
app.post('/api/refresh', asyncHandler(async (req, res) => {
  Logger.info('Refreshing cache');

  clearCache();
  const result = await scanAllProjects(false);

  if (!result.success) {
    throw new Error(result.error);
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    projectsScanned: result.projects.length
  });
}));
```

**Development vs Production:**
```bash
# Development - run TypeScript directly with tsx
npm run server

# Production - compile TypeScript, then run JavaScript
npm run build:server
npm run server:build
```

## Edge Cases & Gotchas

**CORS in Production**: The permissive CORS policy (`cors()` with no options) allows all origins. Restrict in production if deploying publicly.

**Port Conflicts**: Port 3001 may be in use by other applications. Check with `lsof -i :3001` (macOS/Linux) or Task Manager (Windows).

**ES Module Imports**: Express must be imported with `import express from 'express'`, not `const express = require('express')`. Requires `"type": "module"` in package.json.

**Async Route Handlers**: Express 5 properly handles async route handlers. Express 4 requires `express-async-errors` or manual error wrapping.

**TypeScript Imports**: TypeScript requires `.js` extensions in import statements even when importing `.ts` files. This is ESM convention for TypeScript with Node.js.

## Related Topics

- See [Filesystem Scanner](../features/filesystem-scanner.md) for scanner integration
- See [API Endpoints](../features/api-endpoints.md) for complete endpoint documentation
- See [Graceful Error Handling](../patterns/graceful-error-handling.md) for error middleware details
- See [Backend TypeScript Configuration](../infrastructure/backend-typescript-configuration.md) for TypeScript setup
