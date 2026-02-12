---
title: Express.js API Server
updated: 2026-02-12
category: Dependency
tags: [express, nodejs, api, backend]
related_articles:
  - docs/kb/features/filesystem-scanner.md
---

# Express.js API Server

## Overview

Express 5.2.1 provides the backend API server for the Claude Code Session Analyzer. The server exposes REST endpoints for project scanning and session data retrieval, running on port 3001 during development.

## Implementation

**Installation:**
```bash
npm install express@^5.2.1 cors@^2.8.6
```

**Server Setup (server/index.js):**
```javascript
import express from 'express';
import cors from 'cors';
import { scanAllProjects } from './scanner.js';

const app = express();
const PORT = 3001;

app.use(cors()); // Allow frontend on port 5173
app.use(express.json());

app.get('/api/projects', async (req, res) => {
  const result = await scanAllProjects();
  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }
  res.json(result.projects);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

## Key Decisions

**Express 5 vs 4**: Chose Express 5 for improved async/await support and better error handling. Express 5 is production-ready as of 2024.

**CORS Enabled**: The `cors` middleware allows requests from the Vite dev server on port 5173. Required for local development.

**Port 3001**: Uses port 3001 to avoid conflicts with Vite (5173) and other common dev servers (3000).

**ES Modules**: Server code uses `import`/`export` syntax (requires `"type": "module"` in package.json).

## Usage Example

```javascript
// Additional API endpoint
app.get('/api/sessions/:projectName', async (req, res) => {
  const { projectName } = req.params;
  const sessions = await getSessionsForProject(projectName);
  res.json(sessions);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
```

## Edge Cases & Gotchas

**CORS in Production**: The permissive CORS policy (`cors()` with no options) allows all origins. Restrict in production if deploying publicly.

**Port Conflicts**: Port 3001 may be in use by other applications. Check with `lsof -i :3001` (macOS/Linux) or Task Manager (Windows).

**ES Module Imports**: Express must be imported with `import express from 'express'`, not `const express = require('express')`. Requires `"type": "module"` in package.json.

**Async Route Handlers**: Express 5 properly handles async route handlers. Express 4 requires `express-async-errors` or manual error wrapping.

## Related Topics

See [Filesystem Scanner](../features/filesystem-scanner.md) for scanner integration.
