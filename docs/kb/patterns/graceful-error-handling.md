---
title: Graceful Error Handling Pattern
updated: 2026-02-12
category: Patterns
tags: [error-handling, resilience, nodejs]
related_articles:
  - docs/kb/patterns/jsonl-streaming-parser.md
  - docs/kb/features/filesystem-scanner.md
  - docs/kb/infrastructure/structured-logging.md
  - docs/kb/features/api-endpoints.md
---

# Graceful Error Handling Pattern

## Overview

A comprehensive error handling strategy combining defensive programming with structured API error responses. File-level operations prioritize resilience and data recovery, while API endpoints return consistent error formats with appropriate HTTP status codes.

## Implementation

**Filesystem Scanner (server/scanner.js):**
```javascript
async function scanAllProjects() {
  const projectsPath = getClaudeProjectsPath();

  try {
    const entries = await fs.readdir(projectsPath, { withFileTypes: true });
    const projects = await Promise.all(
      entries
        .filter(entry => entry.isDirectory())
        .map(dir => scanProject(path.join(projectsPath, dir.name)))
    );
    return { success: true, projects: projects.filter(Boolean) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: `Claude projects directory not found at: ${projectsPath}\n` +
               `Please ensure Claude Code has been run at least once.`
      };
    }
    return { success: false, error: error.message };
  }
}
```

**Project-Level Error Recovery:**
```javascript
async function scanProject(projectPath) {
  try {
    const files = await findJsonlFiles(projectPath);
    return {
      name: path.basename(projectPath),
      path: projectPath,
      sessionFiles: files,
      totalSessions: files.length,
    };
  } catch (error) {
    console.warn(`Skipping project ${projectPath}:`, error.message);
    return null; // Filtered out by parent
  }
}
```

**JSONL Parser Error Collection:**
```javascript
async function parseJsonlFile(filePath) {
  const messages = [];
  const errors = [];

  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      messages.push(parseLine(parsed));
    } catch (error) {
      // Collect error, continue parsing
      errors.push({
        lineNumber,
        error: error.message,
        content: line.slice(0, 100) // Preview for debugging
      });
    }
  }

  return { messages, errors }; // Both successes and failures
}
```

### API Error Handling Layer

**Custom Error Class (server/errorHandler.ts):**
```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Error Handler Middleware:**
```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString()
    });
  } else {
    Logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
```

**Async Route Handler Wrapper:**
```typescript
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

**Helper Functions:**
```typescript
export function validationError(message: string, details?: Record<string, unknown>) {
  return new ApiError(400, message, details);
}

export function notFoundError(resource: string, identifier?: string) {
  const message = identifier
    ? `${resource} not found: ${identifier}`
    : `${resource} not found`;
  return new ApiError(404, message);
}

export function fileReadError(filePath: string, originalError: Error) {
  return new ApiError(500, 'Failed to read file', {
    file: filePath,
    error: originalError.message
  });
}
```

**Usage in Routes:**
```typescript
app.get('/api/sessions/:projectName', asyncHandler(async (req, res) => {
  const { projectName } = req.params;

  if (!projectName || projectName.trim() === '') {
    throw validationError('Project name is required', { param: 'projectName' });
  }

  const result = await getProjectSessions(projectName);

  if (!result.success) {
    throw notFoundError('Project', projectName);
  }

  res.json(result);
}));
```

## Key Decisions

**Skip and Continue**: When a single project or file fails, skip it and continue processing others. Better to show partial data than fail entirely.

**Friendly Error Messages**: ENOENT errors (directory not found) get user-friendly messages explaining what to do, not technical stack traces.

**Error Collection**: Instead of logging errors to console and discarding, collect them in structured format for debugging. Allows API to return error counts and details.

**Null Filtering**: Failed operations return `null`, which are filtered out by parent functions using `.filter(Boolean)`. Cleaner than try/catch at every level.

**Default Values**: Missing or invalid fields default to sensible values (`0` for numbers, `"unknown"` for strings, `false` for booleans) rather than throwing errors.

**Centralized Error Handling**: Express middleware handles all errors consistently, eliminating repetitive try-catch blocks in route handlers.

**Async Handler Wrapper**: `asyncHandler` wrapper automatically catches promise rejections and passes them to error middleware, preventing unhandled rejections.

**Typed Error Responses**: Custom `ApiError` class ensures all API errors include status code, message, optional details, and timestamp.

**Helper Functions**: Pre-built error helpers (`validationError`, `notFoundError`, etc.) reduce boilerplate and ensure consistent error formats.

**Separation of Concerns**: Internal errors are logged with full details but API responses only expose safe, user-friendly messages.

## Usage Example

**File-Level Error Recovery:**
```javascript
// Scanner with friendly error message
const result = await scanAllProjects();
if (!result.success) {
  console.error(result.error); // User-friendly message
  return;
}

// Parser with error reporting
const { messages, errors } = await parseJsonlFile('./session.jsonl');
console.log(`Parsed ${messages.length} messages, ${errors.length} errors`);
if (errors.length > 0) {
  console.warn('Parse errors:', errors);
}
```

**API Error Handling:**
```typescript
// Route with validation and error handling
app.get('/api/sessions/:projectName', asyncHandler(async (req, res) => {
  const { projectName } = req.params;

  // Validation - throws ApiError with 400 status
  if (!projectName?.trim()) {
    throw validationError('Project name required', { param: 'projectName' });
  }

  const result = await getProjectSessions(projectName);

  // Not found - throws ApiError with 404 status
  if (!result.success) {
    throw notFoundError('Project', projectName);
  }

  res.json(result);
}));

// Error middleware automatically formats response:
// {
//   "status": 404,
//   "message": "Project not found: my-project",
//   "timestamp": "2026-02-12T20:30:00.000Z"
// }
```

## Edge Cases & Gotchas

**Permission Errors**: Files without read permissions are skipped with warning. No special handling needed - treated like any other I/O error.

**Circular Symlinks**: `fs.readdir` may hang on circular symlinks. Consider adding `maxDepth` limit if scanning user-provided directories.

**Empty Results**: If all projects fail, return empty array rather than error. The UI can display "No projects found" message.

**Error Message Truncation**: Line content previews are limited to 100 characters to prevent memory bloat from very long lines.

**Unhandled Errors**: Non-ApiError exceptions are caught by error middleware, logged with full details, but return generic 500 response to avoid leaking internal information.

**Validation Timing**: Route parameter validation happens early (before filesystem operations) to fail fast and avoid wasted work.

## Related Topics

- See [JSONL Streaming Parser](./jsonl-streaming-parser.md) for parser error collection
- See [Filesystem Scanner](../features/filesystem-scanner.md) for scanner error recovery
- See [Structured Logging](../infrastructure/structured-logging.md) for Logger implementation
- See [API Endpoints](../features/api-endpoints.md) for error middleware integration
