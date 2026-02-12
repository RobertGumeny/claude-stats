# Claude Stats API Server

Backend API server for scanning and analyzing Claude Code session logs.

## Modules

### scanner.js

File system scanner that recursively finds all `.jsonl` session files in `~/.claude/projects/`.

**Key Functions:**

- `getClaudeProjectsPath()` - Returns path to `~/.claude/projects` directory
- `scanAllProjects()` - Scans all projects and returns structured data

**Return Format:**

```javascript
{
  success: true,
  projects: [
    {
      name: "project-name",
      path: "/absolute/path/to/project",
      sessionFiles: [
        {
          filename: "session-uuid.jsonl",
          path: "/absolute/path/to/session-uuid.jsonl"
        }
      ],
      totalSessions: 5
    }
  ],
  metadata: {
    totalProjects: 10,
    scanDurationMs: 234,
    scannedAt: "2026-02-12T18:30:00.000Z"
  }
}
```

**Error Handling:**

- Gracefully handles missing `~/.claude/projects/` directory
- Skips directories that can't be read (permissions)
- Returns friendly error messages

### index.js

Express API server providing REST endpoints for the frontend.

**Endpoints:**

- `GET /api/projects` - List all projects with session files
- `GET /api/health` - Health check

**Port:** 3001

## Running

```bash
# Start the API server
npm run server

# Test the scanner
npm run test:scanner

# Validate implementation against acceptance criteria
npm run validate
```

## Performance

The scanner is optimized for speed:

- Parallel project scanning using `Promise.all()`
- Efficient filesystem operations with `fs/promises`
- Target: <3 seconds for 50 projects

## Development

```bash
# Run both frontend and backend
npm run dev:all
```
