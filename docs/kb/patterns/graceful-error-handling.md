---
title: Graceful Error Handling Pattern
updated: 2026-02-12
category: Patterns
tags: [error-handling, resilience, nodejs]
related_articles:
  - docs/kb/patterns/jsonl-streaming-parser.md
  - docs/kb/features/filesystem-scanner.md
---

# Graceful Error Handling Pattern

## Overview

A defensive programming pattern that prioritizes resilience over strictness. When encountering errors during file scanning or parsing, the system collects and reports errors without crashing, allowing maximum data recovery from partially corrupted or incomplete files.

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

## Key Decisions

**Skip and Continue**: When a single project or file fails, skip it and continue processing others. Better to show partial data than fail entirely.

**Friendly Error Messages**: ENOENT errors (directory not found) get user-friendly messages explaining what to do, not technical stack traces.

**Error Collection**: Instead of logging errors to console and discarding, collect them in structured format for debugging. Allows API to return error counts and details.

**Null Filtering**: Failed operations return `null`, which are filtered out by parent functions using `.filter(Boolean)`. Cleaner than try/catch at every level.

**Default Values**: Missing or invalid fields default to sensible values (`0` for numbers, `"unknown"` for strings, `false` for booleans) rather than throwing errors.

## Usage Example

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

## Edge Cases & Gotchas

**Permission Errors**: Files without read permissions are skipped with warning. No special handling needed - treated like any other I/O error.

**Circular Symlinks**: `fs.readdir` may hang on circular symlinks. Consider adding `maxDepth` limit if scanning user-provided directories.

**Empty Results**: If all projects fail, return empty array rather than error. The UI can display "No projects found" message.

**Error Message Truncation**: Line content previews are limited to 100 characters to prevent memory bloat from very long lines.

## Related Topics

See [JSONL Streaming Parser](./jsonl-streaming-parser.md) for parser implementation.
See [Filesystem Scanner](../features/filesystem-scanner.md) for scanner usage.
