---
title: JSONL Streaming Parser Pattern
updated: 2026-02-12
category: Patterns
tags: [nodejs, streaming, jsonl, parser]
related_articles:
  - docs/kb/patterns/graceful-error-handling.md
  - docs/kb/features/filesystem-scanner.md
---

# JSONL Streaming Parser Pattern

## Overview

A memory-efficient line-by-line streaming parser for JSONL (JSON Lines) files using Node.js `readline` module. Handles large session files without loading the entire file into memory, with robust error handling for malformed JSON.

## Implementation

**Core Pattern (server/parser.js):**
```javascript
import fs from 'fs/promises';
import readline from 'readline';

async function parseJsonlFile(filePath) {
  const fileHandle = await fs.open(filePath, 'r');
  const stream = fileHandle.createReadStream();
  const rl = readline.createInterface({ input: stream });

  const messages = [];
  const errors = [];
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    if (!line.trim()) continue; // Skip empty lines

    try {
      const parsed = JSON.parse(line);
      const message = parseLine(parsed);
      if (message) messages.push(message);
    } catch (error) {
      errors.push({ lineNumber, error: error.message, content: line.slice(0, 100) });
    }
  }

  await fileHandle.close();
  return { messages, errors };
}
```

**Message Extraction:**
```javascript
function parseLine(rawLine) {
  const msg = rawLine.message;
  if (!msg?.id) return null; // Skip incomplete messages

  return {
    messageId: msg.id,
    timestamp: rawLine.timestamp,
    isSidechain: rawLine.isSidechain || false,
    role: msg.role || 'unknown',
    model: msg.model,
    usage: {
      input_tokens: msg.usage?.input_tokens || 0,
      cache_creation_input_tokens: msg.usage?.cache_creation_input_tokens || 0,
      cache_read_input_tokens: msg.usage?.cache_read_input_tokens || 0,
      output_tokens: msg.usage?.output_tokens || 0,
    },
    content: extractContent(msg.content),
  };
}
```

## Key Decisions

**Streaming vs In-Memory**: Node.js `readline` reads line-by-line without loading the entire file. This handles large session files (10MB+) efficiently while still being fast for typical files (<100ms for 1000 messages).

**Skip, Don't Crash**: Malformed JSON lines are collected in an `errors` array but don't halt parsing. This allows recovering maximum data from partially corrupted files.

**Default to Zero**: Missing token fields default to `0` rather than `null` or `undefined`. Prevents NaN errors in downstream cost calculations.

**Require Message ID**: Lines without `message.id` are skipped entirely. Message ID is essential for tracking and deduplication.

**Content Extraction**: Handles both string content and array of content blocks (`[{ type: "text", text: "..." }]`). Extracts text from all blocks and joins with newlines.

## Usage Example

```javascript
// Simple usage (just messages)
const messages = await parseJsonlFileSimple('./session.jsonl');

// Detailed usage (with errors)
const { messages, errors } = await parseJsonlFile('./session.jsonl');

// Parallel batch processing
const results = await parseMultipleFiles([
  './project-a/session-1.jsonl',
  './project-b/session-2.jsonl',
]);
```

## Edge Cases & Gotchas

**Empty Lines**: Blank lines and whitespace-only lines are skipped automatically. Common in hand-edited or corrupted JSONL files.

**Incomplete Messages**: Messages without `message.id` are silently skipped. Check `errors` array for debugging.

**File Handles**: Always close file handles with `fileHandle.close()` to prevent resource leaks, especially when parsing many files.

**Character Encoding**: Assumes UTF-8 encoding. Non-UTF-8 files may have garbled text or parse errors.

## Related Topics

See [Graceful Error Handling](./graceful-error-handling.md) for error strategy.
See [Filesystem Scanner](../features/filesystem-scanner.md) for integration example.
